
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';

export const getInvoices = async (organizationId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoice')
    .select(`*`)
    .eq('organization_id', organizationId)
    .order('created_on', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error(error.message);
  }

  return data.map(invoice => {
    return {
      ...invoice,
      // For compatibility with column accessor 'supplier.name'
      supplier: { name: invoice.remit_to_name || 'N/A' },
      created_on: new Date(invoice.created_on),
      updated_on: invoice.updated_on ? new Date(invoice.updated_on) : undefined,
    };
  }) as unknown as Invoice[];
};

export const getInvoiceById = async (invoiceId: string, organizationId: string): Promise<Invoice | null> => {
  const { data, error } = await supabase
    .from('invoice')
    .select(`
      *,
      lines:invoice_line(*)
    `)
    .eq('id', invoiceId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching invoice ${invoiceId}:`, error);
    throw new Error(error.message);
  }

  if (!data) return null;
  
  return {
    ...data,
    supplier: { name: data.remit_to_name || 'N/A' },
    created_on: new Date(data.created_on),
    updated_on: data.updated_on ? new Date(data.updated_on) : undefined,
  } as unknown as Invoice;
};
