
import { supabase } from '@/integrations/supabase/client';
import { GeneralLedgerEntry } from '@/types/generalLedger';

export const generalLedgerService = {
  getLedgerEntries: async (billToOrgId: string, remitToOrgId: string): Promise<GeneralLedgerEntry[]> => {
    const { data, error } = await supabase
      .from('general_ledger')
      .select('*')
      .eq('bill_to_orgid', billToOrgId)
      .eq('remit_to_orgid', remitToOrgId)
      .order('transaction_date', { ascending: true })
      .order('created_on', { ascending: true });

    if (error) {
      console.error('Error fetching general ledger entries:', error);
      throw new Error(error.message);
    }
    return data.map(d => ({ ...d, created_on: new Date(d.created_on) })) as GeneralLedgerEntry[];
  },
};
