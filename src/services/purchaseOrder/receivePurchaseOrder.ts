
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';

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
      lines:purchase_order_line(*)
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
      lines:purchase_order_line(*)
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
      supplier:organizations!supplier_id(*),
      division:divisions(*)
    `)
    .single();

  if (statusUpdateError || !finalPO) {
    console.error(`[PO Receive] Error updating PO status:`, statusUpdateError);
    throw new Error(`Failed to update purchase order status: ${statusUpdateError?.message}`);
  }

  console.log(`[PO Receive] Successfully processed PO ${poId} with status: ${newStatus}`);

  return {
    ...finalPO,
    created_on: new Date(finalPO.created_on),
    updated_on: finalPO.updated_on ? new Date(finalPO.updated_on) : undefined,
  } as unknown as PurchaseOrder;
};
