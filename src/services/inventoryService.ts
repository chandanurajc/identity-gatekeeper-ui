
import { supabase } from "@/integrations/supabase/client";
import { InventoryStockSummaryItem } from "@/types/inventory";

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

export const inventoryService = {
  getInventoryStockSummary,
};
