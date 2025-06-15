import { supabase } from '@/integrations/supabase/client';
import { GeneralLedgerEntry, RecordPaymentFormData } from '@/types/generalLedger';
import { Organization } from '@/types/organization';

export const generalLedgerService = {
  getLedgerEntries: async (billToOrgId: string, remitToOrgId: string): Promise<GeneralLedgerEntry[]> => {
    const { data, error } = await supabase
      .from('general_ledger')
      .select('*')
      .eq('bill_to_orgid', billToOrgId)
      .eq('remit_to_orgid', remitToOrgId)
      .order('created_on', { ascending: false });

    if (error) {
      console.error('Error fetching general ledger entries:', error);
      throw new Error(error.message);
    }
    return data.map(d => ({ ...d, created_on: new Date(d.created_on) })) as GeneralLedgerEntry[];
  },

  recordPayment: async (
    paymentData: RecordPaymentFormData,
    billToOrg: Organization,
    remitToOrg: Organization,
    currentUserEmail: string
  ): Promise<void> => {
    const billToContact = billToOrg.contacts.find(c => c.type === 'Bill To') || billToOrg.contacts.find(c => c.type === 'Registered location') || billToOrg.contacts[0];
    const remitToContact = remitToOrg.contacts.find(c => c.type === 'Remit To') || remitToOrg.contacts.find(c => c.type === 'Registered location') || remitToOrg.contacts[0];
    
    const newEntry = {
        bill_to_orgid: billToOrg.id,
        remit_to_orgid: remitToOrg.id,
        transaction_type: 'Payment' as const,
        transaction_date: paymentData.paymentDate.toISOString().split('T')[0],
        amount: paymentData.amount, // Payments are positive (credit to the balance)
        reference_number: paymentData.referenceNumber || '',
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes,
        created_by: currentUserEmail,
        // Snapshot Bill To info
        bill_to_name: billToOrg.name,
        bill_to_address1: billToContact?.address1,
        bill_to_address2: billToContact?.address2,
        bill_to_city: billToContact?.city,
        bill_to_state: billToContact?.state,
        bill_to_country: billToContact?.country,
        bill_to_postal_code: billToContact?.postalCode,
        bill_to_email: billToContact?.email,
        bill_to_phone: billToContact?.phoneNumber,
        // Snapshot Remit To info
        remit_to_name: remitToOrg.name,
        remit_to_address1: remitToContact?.address1,
        remit_to_address2: remitToContact?.address2,
        remit_to_city: remitToContact?.city,
        remit_to_state: remitToContact?.state,
        remit_to_country: remitToContact?.country,
        remit_to_postal_code: remitToContact?.postalCode,
        remit_to_email: remitToContact?.email,
        remit_to_phone: remitToContact?.phoneNumber,
    };

    const { error } = await supabase.from('general_ledger').insert([newEntry]);

    if (error) {
        console.error('Error recording payment:', error);
        throw new Error(error.message);
    }
  },
};
