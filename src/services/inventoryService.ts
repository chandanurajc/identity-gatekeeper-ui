import { supabase } from "@/integrations/supabase/client";
import { InventoryStockSummaryItem, InventoryStockLedgerItem } from "@/types/inventory";

async function getInventoryStockSummary(organizationId: string, includeZeroStock: boolean): Promise<InventoryStockSummaryItem[]> {
  const { data, error } = await supabase.rpc('get_inventory_stock_summary', {
    p_organization_id: organizationId,
    p_include_zero_stock: includeZeroStock,
  });

  if (error) {
    console.error("Error fetching inventory stock summary:", error);
    throw new Error(`Failed to fetch inventory stock summary: ${error.message}`);
  }

  return (data || []) as InventoryStockSummaryItem[];
}

async function getInventoryStockLedger(organizationId: string): Promise<InventoryStockLedgerItem[]> {
  const { data, error } = await supabase
    .from("inventory_stock")
    .select(`
      *,
      item:items(description),
      division:divisions(name)
    `)
    .eq("organization_id", organizationId)
    .order("created_on", { ascending: false });

  if (error) {
    console.error("Error fetching inventory stock ledger:", error);
    throw new Error(`Failed to fetch inventory stock ledger: ${error.message}`);
  }

  return (data || []) as unknown as InventoryStockLedgerItem[];
}

export const inventoryService = {
  getInventoryStockSummary,
  getInventoryStockLedger,
};
