
import { supabase } from "@/integrations/supabase/client";

export function isUUID(str: string | null | undefined): str is string {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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
