
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { accountingRulesService } from '../accountingRulesService';
import { journalService } from '../journalService';
import { subledgerService } from '../subledgerService';

export const receivePurchaseOrder = async (
  poId: string,
  receivedLines: Array<{
    lineId: string;
    receivedQuantity: number;
  }>,
  organizationId: string,
  receivedBy: string,
  receivedByName: string
): Promise<PurchaseOrder> => {
  console.log(`[PO Receive] Starting receipt process for PO ${poId}`);

  // Fetch the current PO to validate
  const { data: currentPO, error: fetchError } = await supabase
    .from('purchase_order')
    .select(`
      *,
      lines:purchase_order_line(*),
      gstBreakdown:purchase_order_gst_breakdown(*)
    `)
    .eq('id', poId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !currentPO) {
    console.error(`[PO Receive] Error fetching PO ${poId}:`, fetchError);
    throw new Error(`Purchase Order not found: ${fetchError?.message}`);
  }

  if (currentPO.status !== 'Created' && currentPO.status !== 'Partially Received') {
    throw new Error(`Cannot receive Purchase Order with status: ${currentPO.status}. Only 'Created' or 'Partially Received' POs can be received.`);
  }

  // Validate received lines
  for (const receivedLine of receivedLines) {
    const poLine = currentPO.lines?.find(line => line.id === receivedLine.lineId);
    if (!poLine) {
      throw new Error(`Purchase Order line not found: ${receivedLine.lineId}`);
    }

    const totalReceived = (poLine.received_quantity || 0) + receivedLine.receivedQuantity;
    if (totalReceived > poLine.quantity) {
      throw new Error(`Cannot receive more than ordered quantity for line ${poLine.line_number}`);
    }

    if (receivedLine.receivedQuantity <= 0) {
      throw new Error(`Received quantity must be greater than 0 for line ${poLine.line_number}`);
    }
  }

  // Update received quantities and create receive transactions
  for (const receivedLine of receivedLines) {
    const poLine = currentPO.lines?.find(line => line.id === receivedLine.lineId);
    if (!poLine) continue;

    const newReceivedQuantity = (poLine.received_quantity || 0) + receivedLine.receivedQuantity;

    // Update the PO line with new received quantity
    const { error: updateLineError } = await supabase
      .from('purchase_order_line')
      .update({
        received_quantity: newReceivedQuantity,
        updated_by: receivedByName,
        updated_on: new Date().toISOString(),
      })
      .eq('id', receivedLine.lineId);

    if (updateLineError) {
      console.error(`[PO Receive] Error updating PO line ${receivedLine.lineId}:`, updateLineError);
      throw new Error(`Failed to update purchase order line: ${updateLineError.message}`);
    }

    // Create receive transaction record
    const { error: receiveTransactionError } = await supabase
      .from('po_receive_transaction')
      .insert({
        organization_id: organizationId,
        purchase_order_id: poId,
        purchase_order_line_id: receivedLine.lineId,
        item_id: poLine.item_id,
        uom: poLine.uom,
        quantity_received: receivedLine.receivedQuantity,
        received_by: receivedBy,
      });

    if (receiveTransactionError) {
      console.error(`[PO Receive] Error creating receive transaction for line ${receivedLine.lineId}:`, receiveTransactionError);
      throw new Error(`Failed to create receive transaction: ${receiveTransactionError.message}`);
    }

    // Update inventory stock
    const { error: inventoryError } = await supabase
      .from('inventory_stock')
      .insert({
        organization_id: organizationId,
        division_id: currentPO.division_id,
        item_id: poLine.item_id,
        uom: poLine.uom,
        quantity: receivedLine.receivedQuantity,
        transaction_type: 'PO_RECEIVE',
        reference_number: currentPO.po_number,
        created_by: receivedByName,
      });

    if (inventoryError) {
      console.error(`[PO Receive] Error updating inventory for item ${poLine.item_id}:`, inventoryError);
      throw new Error(`Failed to update inventory: ${inventoryError.message}`);
    }
  }

  // Check if PO is fully received
  const { data: updatedPO, error: updatedPOError } = await supabase
    .from('purchase_order')
    .select(`
      *,
      lines:purchase_order_line(*),
      gstBreakdown:purchase_order_gst_breakdown(*)
    `)
    .eq('id', poId)
    .single();

  if (updatedPOError || !updatedPO) {
    throw new Error(`Failed to fetch updated PO: ${updatedPOError?.message}`);
  }

  // Determine if all lines are fully received
  const allLinesReceived = updatedPO.lines?.every(line => 
    (line.received_quantity || 0) >= line.quantity
  ) || false;

  const newStatus = allLinesReceived ? 'Received' : 'Partially Received';

  // Update PO status
  const { data: finalPO, error: statusUpdateError } = await supabase
    .from('purchase_order')
    .update({
      status: newStatus,
      updated_by: receivedByName,
      updated_on: new Date().toISOString(),
    })
    .eq('id', poId)
    .select(`
      *,
      lines:purchase_order_line(*),
      gstBreakdown:purchase_order_gst_breakdown(*),
      supplier:organizations!supplier_id(*),
      division:divisions(*)
    `)
    .single();

  if (statusUpdateError || !finalPO) {
    console.error(`[PO Receive] Error updating PO status:`, statusUpdateError);
    throw new Error(`Failed to update purchase order status: ${statusUpdateError?.message}`);
  }

  // --- Auto Journal Posting Logic ---
  if (newStatus === 'Received') {
    try {
      // 1. Fetch matching accounting rules - now filter by division as well
      const rules = await accountingRulesService.getAccountingRules(finalPO.organization_id);
      const matchingRules = rules.filter(rule =>
        rule.transactionCategory === 'PO' &&
        rule.triggeringAction === 'Purchase order receive' &&
        rule.transactionType === finalPO.po_type &&
        // Filter by division if rule has division specified
        (!rule.divisionId || rule.divisionId === finalPO.division_id)
      );

      console.log(`[Auto Journal] Found ${matchingRules.length} matching rules for PO ${finalPO.po_number} in division ${finalPO.division?.name}`);

      for (const rule of matchingRules) {
        // Skip rules without lines
        if (!rule.lines || rule.lines.length === 0) {
          console.warn(`[Auto Journal] No lines defined for rule ${rule.ruleName}, skipping`);
          continue;
        }

        // Calculate GST breakdown totals for new amount sources
        const gstBreakdown = finalPO.gstBreakdown || [];
        const totalCGST = gstBreakdown.reduce((sum, breakdown) => sum + (breakdown.cgst_amount || 0), 0);
        const totalSGST = gstBreakdown.reduce((sum, breakdown) => sum + (breakdown.sgst_amount || 0), 0);
        const totalIGST = gstBreakdown.reduce((sum, breakdown) => sum + (breakdown.igst_amount || 0), 0);

        console.log(`[Auto Journal] GST Breakdown - CGST: ${totalCGST}, SGST: ${totalSGST}, IGST: ${totalIGST}`);

        // Collect all journal lines for this rule
        const allJournalLines = [];
        for (const line of rule.lines) {
          // Calculate amount based on line's amount source
          let amount = 0;
          if (line.amountSource === 'Total GST value' || line.amountSource === 'Total GST Value') {
            amount = (finalPO.lines || []).reduce((sum, poLine) => sum + (poLine.gst_value || 0), 0);
          } else if (line.amountSource === 'sum of line' || line.amountSource === 'Total PO Value') {
            amount = (finalPO.lines || []).reduce((sum, poLine) => sum + (poLine.line_total || 0), 0);
          } else if (line.amountSource === 'Item total price') {
            amount = (finalPO.lines || []).reduce((sum, poLine) => sum + (poLine.total_unit_price || 0), 0);
          } else if (line.amountSource === 'Total PO CGST') {
            amount = totalCGST;
          } else if (line.amountSource === 'Total PO SGST') {
            amount = totalSGST;
          } else if (line.amountSource === 'Total PO IGST') {
            amount = totalIGST;
          }

          // Safety checks
          if (!amount || amount === 0) {
            console.warn(`[Auto Journal] Amount is 0 for rule ${rule.ruleName} line ${line.lineNumber}, skipping`);
            continue;
          }
          if (!line.debitAccountCode && !line.creditAccountCode) {
            console.warn(`[Auto Journal] Both account codes missing for rule ${rule.ruleName} line ${line.lineNumber}, skipping`);
            continue;
          }

          if (line.debitAccountCode) {
            allJournalLines.push({
              lineNumber: (line.lineNumber * 2) - 1,
              accountCode: line.debitAccountCode,
              debitAmount: amount,
              creditAmount: null,
              narration: `PO Receive - Debit - Line ${line.lineNumber} - ${line.amountSource}`,
            });
          }

          if (line.creditAccountCode) {
            allJournalLines.push({
              lineNumber: line.lineNumber * 2,
              accountCode: line.creditAccountCode,
              debitAmount: null,
              creditAmount: amount,
              narration: `PO Receive - Credit - Line ${line.lineNumber} - ${line.amountSource}`,
            });
          }
        }

        // Skip if no journal lines to create
        if (allJournalLines.length === 0) {
          console.warn(`[Auto Journal] No journal lines to create for rule ${rule.ruleName}, skipping`);
          continue;
        }

        console.log(`[Auto Journal] Creating journal for rule ${rule.ruleName} with lines:`, allJournalLines);

        try {
          const createdJournal = await journalService.createJournal({
            journalDate: new Date().toISOString().split('T')[0],
            transactionType: 'PO',
            transactionReference: finalPO.po_number,
            journalLines: allJournalLines,
          }, finalPO.organization_id, receivedByName);

          console.log(`[Auto Journal] Created journal for rule ${rule.ruleName}:`, createdJournal);

          if (createdJournal && createdJournal.id) {
            // Create subledger entries for lines with enableSubledger = true
            await createSubledgerEntriesForPO(finalPO, rule, createdJournal.id, receivedByName);
            
            await journalService.postJournal(createdJournal.id, finalPO.organization_id, receivedByName);
          } else {
            console.error(`[Auto Journal] Journal not created or missing ID for rule ${rule.ruleName}`);
          }
        } catch (journalError) {
          console.error(`[Auto Journal] Failed to create journal for rule ${rule.ruleName}:`, journalError);
        }
      }
    } catch (err) {
      console.error('[PO Receive] Error in auto journal posting:', err);
      // Optionally: throw or continue
    }
  }
  // --- End Auto Journal Posting Logic ---

  console.log(`[PO Receive] Successfully processed PO ${poId} with status: ${newStatus}`);

  return {
    ...finalPO,
    created_on: new Date(finalPO.created_on),
    updated_on: finalPO.updated_on ? new Date(finalPO.updated_on) : undefined,
  } as unknown as PurchaseOrder;
};

/**
 * Creates subledger entries for PO accounting rule lines with enableSubledger = true
 */
async function createSubledgerEntriesForPO(
  po: any,
  rule: any,
  journalId: string,
  createdBy: string
): Promise<void> {
  console.log('Creating subledger entries for PO:', po.po_number);
  
  const subledgerLines = rule.lines.filter((line: any) => line.enableSubledger);
  
  if (subledgerLines.length === 0) {
    console.log('No subledger lines found for rule:', rule.ruleName);
    return;
  }

  for (const line of subledgerLines) {
    try {
      // Calculate amount based on line's amount source
      let amount = 0;
      if (line.amountSource === 'Total GST value' || line.amountSource === 'Total GST Value') {
        amount = (po.lines || []).reduce((sum: number, poLine: any) => sum + (poLine.gst_value || 0), 0);
      } else if (line.amountSource === 'sum of line' || line.amountSource === 'Total PO Value') {
        amount = (po.lines || []).reduce((sum: number, poLine: any) => sum + (poLine.line_total || 0), 0);
      } else if (line.amountSource === 'Item total price') {
        amount = (po.lines || []).reduce((sum: number, poLine: any) => sum + (poLine.total_unit_price || 0), 0);
      } else if (line.amountSource === 'Total PO CGST') {
        const gstBreakdown = po.gstBreakdown || [];
        amount = gstBreakdown.reduce((sum: number, breakdown: any) => sum + (breakdown.cgst_amount || 0), 0);
      } else if (line.amountSource === 'Total PO SGST') {
        const gstBreakdown = po.gstBreakdown || [];
        amount = gstBreakdown.reduce((sum: number, breakdown: any) => sum + (breakdown.sgst_amount || 0), 0);
      } else if (line.amountSource === 'Total PO IGST') {
        const gstBreakdown = po.gstBreakdown || [];
        amount = gstBreakdown.reduce((sum: number, breakdown: any) => sum + (breakdown.igst_amount || 0), 0);
      }

      // Get supplier organization details for party information
      const partyOrgId = po.supplier_id;
      const partyName = po.supplier?.name || '';
      
      // Get remit to contact ID from PO if available
      const partyContactId = po.remit_to_contact_id;
      
      // Check if the accounting rule line is debit or credit to post accordingly
      const debitAmount = line.debitAccountCode ? amount : undefined;
      const creditAmount = line.creditAccountCode ? amount : undefined;
      
      await subledgerService.createSubledgerEntry({
        organizationId: po.organization_id,
        journalId,
        partyOrgId,
        partyContactId,
        transactionDate: new Date().toISOString().split('T')[0], // Current date
        debitAmount,
        creditAmount,
        sourceReference: po.po_number,
        transactionCategory: 'Purchase Order', // PO related transaction
        triggeringAction: 'PO Received', // Triggering action for PO receipt
        createdBy,
      });
      
      console.log(`Subledger entry created for PO line ${line.lineNumber}`);
    } catch (error) {
      console.error(`Error creating subledger entry for PO line ${line.lineNumber}:`, error);
      throw error;
    }
  }
}
