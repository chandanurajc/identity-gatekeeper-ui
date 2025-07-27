// Manually trigger journal creation/posting for a transfer
async function createOrPostJournalForTransfer(transferId: string, confirmedBy: string): Promise<void> {
  // Get transfer details
  const transfer = await getInventoryTransfer(transferId);
  // Use the same journal logic as in confirmInventoryTransfer
  try {
    const { accountingRulesService } = await import("@/services/accountingRulesService");
    const { journalService } = await import("@/services/journalService");
    const rules = await accountingRulesService.getAccountingRules(transfer.organization_id);
    const matchingRule = rules.find(
      (rule) =>
        rule.transactionCategory === 'Inventory Transfer' &&
        rule.triggeringAction === 'Transfer confirmed' &&
        rule.status === 'Active' &&
        rule.divisionId === transfer.origin_division_id &&
        rule.destinationDivisionId === transfer.destination_division_id
    );
    if (matchingRule && matchingRule.lines && matchingRule.lines.length > 0) {
      const journalLines = matchingRule.lines.map((line) => {
        let amount = 0;
        if (line.amountSource === 'Item total price' || line.amountSource === 'Total transfer value') {
          amount = (transfer.transfer_lines || []).reduce(
            (sum, l) => sum + (l.inventory_cost || 0) * (l.quantity_to_transfer || 0),
            0
          );
        }
        return {
          lineNumber: line.lineNumber,
          accountCode: line.debitAccountCode || line.creditAccountCode || '',
          debitAmount: line.debitAccountCode ? amount : undefined,
          creditAmount: line.creditAccountCode ? amount : undefined,
          narration: `Inventory transfer journal for transfer #${transfer.transfer_number}`,
        };
      });
      const journalData = {
        journalDate: new Date().toISOString().slice(0, 10),
        transactionType: 'Inventory transfer' as 'Inventory transfer',
        transactionReference: transfer.transfer_number,
        journalLines,
      };
      const journal = await journalService.createJournal(
        journalData,
        transfer.organization_id,
        confirmedBy
      );
      await journalService.postJournal(journal.id, transfer.organization_id, confirmedBy);
    }
  } catch (err) {
    throw err;
  }
}
import { supabase } from "@/integrations/supabase/client";
import { InventoryTransfer, InventoryTransferLine, CreateInventoryTransferData } from "@/types/inventoryTransfer";

// Get all inventory transfers for an organization
async function getInventoryTransfers(organizationId: string): Promise<InventoryTransfer[]> {
  const { data, error } = await supabase
    .from("inventory_transfers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_on", { ascending: false });

  if (error) {
    console.error("Error fetching inventory transfers:", error);
    throw new Error(`Failed to fetch inventory transfers: ${error.message}`);
  }

  // Fetch division names separately
  const transfers = await Promise.all((data || []).map(async (transfer) => {
    const [originDivision, destinationDivision] = await Promise.all([
      supabase.from("divisions").select("name").eq("id", transfer.origin_division_id).single(),
      supabase.from("divisions").select("name").eq("id", transfer.destination_division_id).single()
    ]);

    return {
      ...transfer,
      created_on: new Date(transfer.created_on),
      updated_on: transfer.updated_on ? new Date(transfer.updated_on) : undefined,
      origin_division_name: originDivision.data?.name || 'Unknown',
      destination_division_name: destinationDivision.data?.name || 'Unknown'
    };
  }));

  return transfers as InventoryTransfer[];
}

// Get a single inventory transfer with its lines
async function getInventoryTransfer(transferId: string): Promise<InventoryTransfer> {
  const { data, error } = await supabase
    .from("inventory_transfers")
    .select("*")
    .eq("id", transferId)
    .single();

  if (error) {
    console.error("Error fetching inventory transfer:", error);
    throw new Error(`Failed to fetch inventory transfer: ${error.message}`);
  }

  // Fetch related data separately
  const [originDivision, destinationDivision, transferLines] = await Promise.all([
    supabase.from("divisions").select("name").eq("id", data.origin_division_id).single(),
    supabase.from("divisions").select("name").eq("id", data.destination_division_id).single(),
    supabase.from("inventory_transfer_lines").select(`
      *,
      items(description)
    `).eq("transfer_id", transferId)
  ]);

  const processedTransfer = {
    ...data,
    created_on: new Date(data.created_on),
    updated_on: data.updated_on ? new Date(data.updated_on) : undefined,
    origin_division_name: originDivision.data?.name || 'Unknown',
    destination_division_name: destinationDivision.data?.name || 'Unknown',
    transfer_lines: (transferLines.data || []).map(line => ({
      ...line,
      created_on: new Date(line.created_on),
      updated_on: line.updated_on ? new Date(line.updated_on) : undefined,
      item_description: (line as any).items?.description
    }))
  };

  return processedTransfer as InventoryTransfer;
}


// Create a new inventory transfer
async function createInventoryTransfer(transferData: CreateInventoryTransferData): Promise<InventoryTransfer> {
  // First, generate the transfer number
  const { data: transferNumber, error: numberError } = await supabase.rpc(
    'generate_transfer_number',
    { org_id: transferData.organization_id }
  );

  if (numberError) {
    console.error("Error generating transfer number:", numberError);
    throw new Error(`Failed to generate transfer number: ${numberError.message}`);
  }

  // Fetch username for created_by
  let createdByUsername = transferData.created_by;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transferData.created_by)) {
    // Only fetch if it's a UUID
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', transferData.created_by)
      .single();
    if (!userError && userProfile?.username) {
      createdByUsername = userProfile.username;
    }
  }

  // Create the transfer header
  const { data: transfer, error: transferError } = await supabase
    .from("inventory_transfers")
    .insert({
      transfer_number: transferNumber,
      organization_id: transferData.organization_id,
      origin_division_id: transferData.origin_division_id,
      destination_division_id: transferData.destination_division_id,
      transfer_date: transferData.transfer_date,
      tracking_number: transferData.tracking_number,
      created_by: createdByUsername
    })
    .select()
    .single();

  if (transferError) {
    console.error("Error creating inventory transfer:", transferError);
    throw new Error(`Failed to create inventory transfer: ${transferError.message}`);
  }

  // Create the transfer lines
  const lines = transferData.transfer_lines.map(line => ({
    transfer_id: transfer.id,
    line_number: line.line_number,
    item_id: line.item_id,
    quantity_to_transfer: line.quantity_to_transfer,
    inventory_cost: line.inventory_cost ?? null
  }));

  const { error: linesError } = await supabase
    .from("inventory_transfer_lines")
    .insert(lines);

  if (linesError) {
    console.error("Error creating transfer lines:", linesError);
    throw new Error(`Failed to create transfer lines: ${linesError.message}`);
  }


  // Create negative inventory stock entries for origin division
  const stockEntries = transferData.transfer_lines.map(line => ({
    organization_id: transferData.organization_id,
    item_id: line.item_id,
    division_id: transferData.origin_division_id,
    available_quantity: -line.quantity_to_transfer,
    in_process_quantity: 0,
    uom: 'Unit', // Default UOM, should be fetched from item
    transaction_type: 'TRANSFER',
    reference_number: transferNumber,
    created_by: createdByUsername,
    inventory_cost: line.inventory_cost ?? null
  }));

  // Create in-process inventory stock entries for destination division
  const inProcessEntries = transferData.transfer_lines.map(line => ({
    organization_id: transferData.organization_id,
    item_id: line.item_id,
    division_id: transferData.destination_division_id,
    available_quantity: 0,
    in_process_quantity: line.quantity_to_transfer,
    uom: 'Unit',
    transaction_type: 'TRANSFER',
    reference_number: transferNumber,
    created_by: createdByUsername,
    inventory_cost: line.inventory_cost ?? null
  }));

  const allStockEntries = [...stockEntries, ...inProcessEntries];

  const { error: stockError } = await supabase
    .from("inventory_stock")
    .insert(allStockEntries);

  if (stockError) {
    console.error("Error creating inventory stock entries:", stockError);
    throw new Error(`Failed to create inventory stock entries: ${stockError.message}`);
  }

  return {
    ...transfer,
    created_on: new Date(transfer.created_on),
    updated_on: transfer.updated_on ? new Date(transfer.updated_on) : undefined,
  } as InventoryTransfer;
}

// Update inventory transfer (only tracking number for transfers in 'Transfer initiated' status)
async function updateInventoryTransfer(transferId: string, tracking_number?: string): Promise<void> {
  // Fetch username for updated_by (assume tracking_number update is by current user, pass as param if needed)
  let updatedByUsername = undefined;
  if (typeof tracking_number === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tracking_number)) {
    // If tracking_number is actually a userId, fetch username (for future extensibility)
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', tracking_number)
      .single();
    if (!userError && userProfile?.username) {
      updatedByUsername = userProfile.username;
    }
  }
  const updateObj: any = {
    tracking_number,
    updated_on: new Date().toISOString()
  };
  if (updatedByUsername) updateObj.updated_by = updatedByUsername;
  const { error } = await supabase
    .from("inventory_transfers")
    .update(updateObj)
    .eq("id", transferId)
    .eq("status", "Transfer initiated"); // Only allow updates for initiated transfers

  if (error) {
    console.error("Error updating inventory transfer:", error);
    throw new Error(`Failed to update inventory transfer: ${error.message}`);
  }
}

// Confirm inventory transfer
async function confirmInventoryTransfer(transferId: string, confirmedBy: string): Promise<void> {
  // Get transfer details
  const transfer = await getInventoryTransfer(transferId);
  
  if (transfer.status !== 'Transfer initiated') {
    throw new Error('Only transfers in "Transfer initiated" status can be confirmed');
  }

  // Fetch username for updated_by
  let updatedByUsername = confirmedBy;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(confirmedBy)) {
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', confirmedBy)
      .single();
    if (!userError && userProfile?.username) {
      updatedByUsername = userProfile.username;
    }
  }

  // Update transfer status
  const { error: updateError } = await supabase
    .from("inventory_transfers")
    .update({
      status: 'Transfer confirmed',
      updated_by: updatedByUsername,
      updated_on: new Date().toISOString()
    })
    .eq("id", transferId);

  if (updateError) {
    console.error("Error confirming transfer:", updateError);
    throw new Error(`Failed to confirm transfer: ${updateError.message}`);
  }

  // Fetch username for confirmedBy
  let confirmedByUsername = confirmedBy;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(confirmedBy)) {
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', confirmedBy)
      .single();
    if (!userError && userProfile?.username) {
      confirmedByUsername = userProfile.username;
    }
  }

  // --- Journal Posting Logic for Inventory Transfer ---
  try {
    // Lazy import to avoid circular deps
    const { accountingRulesService } = await import("@/services/accountingRulesService");
    const { journalService } = await import("@/services/journalService");

    // Fetch active accounting rules for Inventory Transfer, Transfer confirmed
    const rules = await accountingRulesService.getAccountingRules(transfer.organization_id);
    console.log('Available accounting rules:', rules);
    
    // Try to find matching rule with more flexible matching
    let matchingRule = rules.find(
      (rule) =>
        rule.transactionCategory === 'Inventory Transfer' &&
        rule.triggeringAction === 'Transfer confirmed' &&
        rule.status === 'Active' &&
        rule.divisionId === transfer.origin_division_id &&
        (rule.destinationDivisionId === transfer.destination_division_id || rule.destinationDivisionId === null)
    );

    // If no rule found with exact division match, try without destination division requirement
    if (!matchingRule) {
      matchingRule = rules.find(
        (rule) =>
          rule.transactionCategory === 'Inventory Transfer' &&
          rule.triggeringAction === 'Transfer confirmed' &&
          rule.status === 'Active' &&
          (rule.divisionId === transfer.origin_division_id || rule.divisionId === null)
      );
    }

    console.log('Matching accounting rule:', matchingRule);

    if (matchingRule && matchingRule.lines && matchingRule.lines.length > 0) {
      // Calculate total transfer value
      const totalTransferValue = (transfer.transfer_lines || []).reduce(
        (sum, l) => sum + (l.inventory_cost || 0) * (l.quantity_to_transfer || 1),
        0
      );

      console.log('Total transfer value:', totalTransferValue);

      // Build journal lines
      const journalLines = matchingRule.lines.map((line) => {
        let amount = 0;
        
        // Map amount source values
        if (line.amountSource === 'Item total price' || line.amountSource === 'Total transfer value') {
          amount = totalTransferValue;
        }

        const journalLine = {
          lineNumber: line.lineNumber,
          accountCode: line.debitAccountCode || line.creditAccountCode || '',
          debitAmount: line.debitAccountCode ? amount : undefined,
          creditAmount: line.creditAccountCode ? amount : undefined,
          narration: `Inventory transfer journal for transfer #${transfer.transfer_number}`,
        };

        console.log('Journal line created:', journalLine);
        return journalLine;
      }).filter(line => 
        // Only include lines with valid amounts
        (line.debitAmount && line.debitAmount > 0) || (line.creditAmount && line.creditAmount > 0)
      );

      console.log('Final journal lines:', journalLines);

      if (journalLines.length > 0) {
        // Prepare journal form data
        const journalData = {
          journalDate: new Date().toISOString().slice(0, 10),
          transactionType: 'Inventory transfer' as 'Inventory transfer',
          transactionReference: transfer.transfer_number,
          journalLines,
        };

        console.log('Creating journal with data:', journalData);

        // Create and post journal
        const journal = await journalService.createJournal(
          journalData,
          transfer.organization_id,
          confirmedByUsername
        );
        
        console.log('Journal created:', journal);
        
        await journalService.postJournal(journal.id, transfer.organization_id, confirmedByUsername);
        
        console.log('Journal posted successfully');
      } else {
        console.log('No valid journal lines to create');
      }
    } else {
      console.log('No matching accounting rule found for inventory transfer');
    }
  } catch (err) {
    console.error('Error posting journal for inventory transfer:', err);
    // Optionally: throw or continue
  }
  // For each transfer line, update the in-process entry for destination division:
  for (const line of transfer.transfer_lines || []) {
    // Find the in-process entry for this item/division/transfer
    const { data: stockRows, error: fetchError } = await supabase
      .from("inventory_stock")
      .select("id, available_quantity, in_process_quantity")
      .eq("organization_id", transfer.organization_id)
      .eq("item_id", line.item_id)
      .eq("division_id", transfer.destination_division_id)
      .eq("reference_number", transfer.transfer_number)
      .eq("transaction_type", "TRANSFER");
    if (fetchError) {
      console.error("Error fetching in-process stock entry:", fetchError);
      throw new Error(`Failed to fetch in-process stock entry: ${fetchError.message}`);
    }
    if (stockRows && stockRows.length > 0) {
      const stock = stockRows[0];
      const newAvailable = (stock.available_quantity || 0) + line.quantity_to_transfer;
      const newInProcess = (stock.in_process_quantity || 0) - line.quantity_to_transfer;
      const { error: updateError2 } = await supabase
        .from("inventory_stock")
        .update({
          available_quantity: newAvailable,
          in_process_quantity: newInProcess < 0 ? 0 : newInProcess,
          updated_by: confirmedByUsername,
          updated_on: new Date().toISOString(),
        })
        .eq("id", stock.id);
      if (updateError2) {
        console.error("Error updating in-process stock entry:", updateError2);
        throw new Error(`Failed to update in-process stock entry: ${updateError2.message}`);
      }
    } else {
      // If not found, fallback: create a new available entry (should not happen in normal flow)
      const { error: insertError } = await supabase
        .from("inventory_stock")
        .insert({
          organization_id: transfer.organization_id,
          item_id: line.item_id,
          division_id: transfer.destination_division_id,
          available_quantity: line.quantity_to_transfer,
          in_process_quantity: 0,
          uom: 'Unit',
          transaction_type: 'TRANSFER',
          reference_number: transfer.transfer_number,
          created_by: confirmedByUsername,
          updated_by: confirmedByUsername,
          updated_on: new Date().toISOString(),
        });
      if (insertError) {
        console.error("Error inserting fallback available stock entry:", insertError);
        throw new Error(`Failed to insert fallback available stock entry: ${insertError.message}`);
      }
    }
  }
}

export const inventoryTransferService = {
  getInventoryTransfers,
  getInventoryTransfer,
  createInventoryTransfer,
  updateInventoryTransfer,
  confirmInventoryTransfer,
  createOrPostJournalForTransfer,
};