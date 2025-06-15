
import { supabase } from "@/integrations/supabase/client";

export async function getUserNameById(userId: string): Promise<string> {
  if (!userId) return 'Unknown';
  const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

  if (error) {
      console.error(`Error fetching username for user ID ${userId}:`, error);
      return userId; // Fallback to userId if not found
  }
  return data?.username || userId;
}
