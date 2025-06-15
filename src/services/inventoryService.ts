
import { supabase } from "@/integrations/supabase/client";
import { InventoryStockLedgerItem } from "@/types/inventory";

async function getInventoryStock(organizationId: string): Promise<InventoryStockLedgerItem[]> {
  const { data, error } = await supabase
    .from('inventory_stock')
    .select(`
      *,
      item:items (description),
      division:divisions (name)
    `)
    .eq('organization_id', organizationId)
    .order('created_on', { ascending: false });

  if (error) {
    console.error("Error fetching inventory stock:", error);
    throw new Error(`Failed to fetch inventory stock: ${error.message}`);
  }

  // The 'any' type is used here because Supabase typed response is not fully aware of the joined data structure.
  // We are manually ensuring the data conforms to InventoryStockLedgerItem.
  return data as any;
}

export const inventoryService = {
  getInventoryStock,
};
