import { supabase } from "@/integrations/supabase/client";
import { GeneralLedgerEntry, RecordPaymentFormData } from "@/types/generalLedger";
import { Organization } from "@/types/organization";

export const generalLedgerService = {
  async recordPayment(
    paymentData: RecordPaymentFormData,
    billToOrg: Organization,
    remitToOrg: Organization,
    createdBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('general_ledger')
      .insert({
        bill_to_orgid: billToOrg.id,
        remit_to_orgid: remitToOrg.id,
        transaction_type: 'Payment',
        transaction_date: paymentData.paymentDate.toISOString().split('T')[0],
        amount: paymentData.amount,
        reference_number: paymentData.referenceNumber || '',
        notes: paymentData.notes,
        payment_method: paymentData.paymentMethod,
        created_by: createdBy
      });

    if (error) {
      throw new Error(`Failed to record payment: ${error.message}`);
    }
  },

  async getLedgerEntries(billToOrgId: string, remitToOrgId: string): Promise<GeneralLedgerEntry[]> {
    return this.getGeneralLedgerEntries(billToOrgId, remitToOrgId);
  },

  async getGeneralLedgerEntries(billToOrgId: string, remitToOrgId: string): Promise<GeneralLedgerEntry[]> {
    const { data, error } = await supabase
      .from('general_ledger')
      .select('*')
      .eq('bill_to_orgid', billToOrgId)
      .eq('remit_to_orgid', remitToOrgId)
      .order('created_on', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch general ledger entries: ${error.message}`);
    }

    return data.map(entry => ({
      id: entry.id,
      billToOrgId: entry.bill_to_orgid,
      remitToOrgId: entry.remit_to_orgid,
      transactionType: entry.transaction_type,
      transactionDate: new Date(entry.transaction_date),
      amount: entry.amount,
      referenceNumber: entry.reference_number,
      notes: entry.notes,
      paymentMethod: entry.payment_method,
      createdOn: new Date(entry.created_on),
      createdBy: entry.created_by
    }));
  }
};