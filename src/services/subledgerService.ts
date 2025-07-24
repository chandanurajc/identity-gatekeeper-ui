import { supabase } from "@/integrations/supabase/client";
import type { Subledger } from "@/types/subledger";

class SubledgerService {
  async getSubledgers(organizationId: string): Promise<Subledger[]> {
    const { data, error } = await supabase
      .from('subledger')
      .select('*')
      .eq('organization_id', organizationId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching subledgers:', error);
      throw new Error(`Failed to fetch subledgers: ${error.message}`);
    }

    return data?.map(this.transformFromDb) || [];
  }

  async getSubledgersByParty(organizationId: string, partyCode: string): Promise<Subledger[]> {
    const { data, error } = await supabase
      .from('subledger')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('party_code', partyCode)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching party subledgers:', error);
      throw new Error(`Failed to fetch party subledgers: ${error.message}`);
    }

    return data?.map(this.transformFromDb) || [];
  }

  async getPartyBalance(organizationId: string, partyCode: string): Promise<number> {
    const { data, error } = await supabase
      .from('subledger')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('party_code', partyCode)
      .eq('status', 'Open');

    if (error) {
      console.error('Error calculating party balance:', error);
      throw new Error(`Failed to calculate party balance: ${error.message}`);
    }

    return data?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
  }

  async createSubledgerEntry(subledgerData: Omit<Subledger, 'id' | 'createdOn' | 'updatedOn'>): Promise<Subledger> {
    const { data, error } = await supabase
      .from('subledger')
      .insert({
        organization_id: subledgerData.organizationId,
        journal_id: subledgerData.journalId,
        party_org_id: subledgerData.partyOrgId,
        party_name: subledgerData.partyName,
        party_code: subledgerData.partyCode,
        party_contact_id: subledgerData.partyContactId,
        transaction_date: subledgerData.transactionDate,
        amount: subledgerData.amount,
        source_reference: subledgerData.sourceReference,
        status: subledgerData.status,
        created_by: subledgerData.createdBy,
        updated_by: subledgerData.updatedBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subledger entry:', error);
      throw new Error(`Failed to create subledger entry: ${error.message}`);
    }

    return this.transformFromDb(data);
  }

  private transformFromDb(dbSubledger: any): Subledger {
    return {
      id: dbSubledger.id,
      organizationId: dbSubledger.organization_id,
      journalId: dbSubledger.journal_id,
      partyOrgId: dbSubledger.party_org_id,
      partyName: dbSubledger.party_name,
      partyCode: dbSubledger.party_code,
      partyContactId: dbSubledger.party_contact_id,
      transactionDate: dbSubledger.transaction_date,
      amount: parseFloat(dbSubledger.amount),
      sourceReference: dbSubledger.source_reference,
      status: dbSubledger.status,
      createdOn: new Date(dbSubledger.created_on),
      updatedOn: dbSubledger.updated_on ? new Date(dbSubledger.updated_on) : undefined,
      createdBy: dbSubledger.created_by,
      updatedBy: dbSubledger.updated_by,
    };
  }
}

export const subledgerService = new SubledgerService();