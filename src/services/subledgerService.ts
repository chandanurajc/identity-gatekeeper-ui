import { supabase } from "@/integrations/supabase/client";
import type { Subledger } from "@/types/subledger";

class SubledgerService {
  async getSubledgers(organizationId: string): Promise<Subledger[]> {
    const { data, error } = await supabase
      .from('subledger')
      .select(`
        *,
        organizations!party_org_id(name),
        organization_contacts!party_contact_id(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_on', { ascending: false });

    if (error) {
      console.error('Error fetching subledgers:', error);
      throw new Error(`Failed to fetch subledgers: ${error.message}`);
    }

    return data?.map(this.transformFromDb) || [];
  }

  async getSubledgersByParty(organizationId: string, partyOrgId: string): Promise<Subledger[]> {
    const { data, error } = await supabase
      .from('subledger')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('party_org_id', partyOrgId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching party subledgers:', error);
      throw new Error(`Failed to fetch party subledgers: ${error.message}`);
    }

    return data?.map(this.transformFromDb) || [];
  }

  async getPartyBalance(organizationId: string, partyOrgId: string): Promise<number> {
    const { data, error } = await supabase
      .from('subledger')
      .select('debit_amount, credit_amount')
      .eq('organization_id', organizationId)
      .eq('party_org_id', partyOrgId);

    if (error) {
      console.error('Error calculating party balance:', error);
      throw new Error(`Failed to calculate party balance: ${error.message}`);
    }

    return data?.reduce((sum, record) => {
      const debit = record.debit_amount || 0;
      const credit = record.credit_amount || 0;
      return sum + debit - credit;
    }, 0) || 0;
  }

  async createSubledgerEntry(subledgerData: Omit<Subledger, 'id' | 'createdOn' | 'updatedOn'>): Promise<Subledger> {
    const { data, error } = await supabase
      .from('subledger')
      .insert({
        organization_id: subledgerData.organizationId,
        journal_id: subledgerData.journalId,
        party_org_id: subledgerData.partyOrgId,
        party_contact_id: subledgerData.partyContactId,
        transaction_date: subledgerData.transactionDate,
        debit_amount: subledgerData.debitAmount,
        credit_amount: subledgerData.creditAmount,
        source_reference: subledgerData.sourceReference,
        transaction_category: subledgerData.transactionCategory,
        triggering_action: subledgerData.triggeringAction,
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
      partyContactId: dbSubledger.party_contact_id,
      transactionDate: dbSubledger.transaction_date,
      debitAmount: dbSubledger.debit_amount ? parseFloat(dbSubledger.debit_amount) : undefined,
      creditAmount: dbSubledger.credit_amount ? parseFloat(dbSubledger.credit_amount) : undefined,
      sourceReference: dbSubledger.source_reference,
      transactionCategory: dbSubledger.transaction_category,
      triggeringAction: dbSubledger.triggering_action,
      createdOn: new Date(dbSubledger.created_on),
      updatedOn: dbSubledger.updated_on ? new Date(dbSubledger.updated_on) : undefined,
      createdBy: dbSubledger.created_by,
      updatedBy: dbSubledger.updated_by,
      // Add organization and contact name for UI
      organizationName: dbSubledger.organizations?.name,
      contactName: dbSubledger.organization_contacts ? 
        `${dbSubledger.organization_contacts.first_name} ${dbSubledger.organization_contacts.last_name || ''}`.trim() 
        : undefined,
    };
  }
}

export const subledgerService = new SubledgerService();