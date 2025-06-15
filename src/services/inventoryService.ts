
import { supabase } from "@/integrations/supabase/client";
import { InventoryStockLedgerItem } from "@/types/inventory";

async function getInventoryStock(organizationId: string): Promise<InventoryStockLedgerItem[]> {
  const { data: stockData, error: stockError } = await supabase
    .from('inventory_stock')
    .select(`
      *,
      item:items (description),
      division:divisions (name)
    `)
    .eq('organization_id', organizationId)
    .order('created_on', { ascending: false });

  if (stockError) {
    console.error("Error fetching inventory stock:", stockError);
    throw new Error(`Failed to fetch inventory stock: ${stockError.message}`);
  }

  if (!stockData || stockData.length === 0) {
    return [];
  }

  // User IDs are UUIDs stored as strings in created_by
  const userIds = [...new Set(stockData.map(item => item.created_by).filter(Boolean))];
  
  if (userIds.length === 0) {
      return stockData as any;
  }

  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name')
    .in('id', userIds);

  if (usersError) {
    console.error("Error fetching users for stock ledger:", usersError);
    // Fail gracefully, return data without user names
    return stockData as any;
  }

  const usersMap = new Map(usersData.map(user => [user.id, user]));

  const enrichedStockData = stockData.map(item => {
    const user = usersMap.get(item.created_by);
    const userName = user 
        ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) 
        : item.created_by;
        
    return {
      ...item,
      createdBy: userName,
    };
  });

  return enrichedStockData as any;
}

export const inventoryService = {
  getInventoryStock,
};
