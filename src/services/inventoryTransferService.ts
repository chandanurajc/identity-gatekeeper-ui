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
    quantity_to_transfer: line.quantity_to_transfer
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
    quantity: -line.quantity_to_transfer,
    uom: 'Unit', // Default UOM, should be fetched from item
    transaction_type: 'TRANSFER',
    reference_number: transferNumber,
    created_by: createdByUsername
  }));

  const { error: stockError } = await supabase
    .from("inventory_stock")
    .insert(stockEntries);

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
  const { error } = await supabase
    .from("inventory_transfers")
    .update({
      tracking_number,
      updated_on: new Date().toISOString()
    })
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

  // Update transfer status
  const { error: updateError } = await supabase
    .from("inventory_transfers")
    .update({
      status: 'Transfer confirmed',
      updated_by: confirmedBy,
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
  // Create positive inventory stock entries for destination division
  const stockEntries = transfer.transfer_lines?.map(line => ({
    organization_id: transfer.organization_id,
    item_id: line.item_id,
    division_id: transfer.destination_division_id,
    quantity: line.quantity_to_transfer,
    uom: 'Unit', // Default UOM, should be fetched from item
    transaction_type: 'TRANSFER',
    reference_number: transfer.transfer_number,
    created_by: confirmedByUsername
  })) || [];

  const { error: stockError } = await supabase
    .from("inventory_stock")
    .insert(stockEntries);

  if (stockError) {
    console.error("Error creating destination inventory stock entries:", stockError);
    throw new Error(`Failed to create destination inventory stock entries: ${stockError.message}`);
  }
}

export const inventoryTransferService = {
  getInventoryTransfers,
  getInventoryTransfer,
  createInventoryTransfer,
  updateInventoryTransfer,
  confirmInventoryTransfer,
};