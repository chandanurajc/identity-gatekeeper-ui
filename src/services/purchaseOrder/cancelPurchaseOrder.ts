
import { supabase } from "@/integrations/supabase/client";
import { getUserNameById } from "@/lib/userUtils";

export async function cancelPurchaseOrder(id: string, userId: string): Promise<void> {
  const updatedByUsername = await getUserNameById(userId);

  const { error } = await supabase
    .from('purchase_order')
    .update({ 
      status: 'Cancelled',
      updated_by: updatedByUsername,
      updated_on: new Date().toISOString()
    })
    .eq('id', id)
    .eq('status', 'Created');

  if (error) {
    console.error("Error cancelling purchase order:", error);
    throw new Error(`Failed to cancel purchase order: ${error.message}`);
  }
}
