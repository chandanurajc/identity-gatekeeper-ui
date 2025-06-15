
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';

export const getInvoices = async (organizationId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoice')
    .select(`
      *,
      purchase_order (
        supplier:supplier_id (
          name
        )
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_on', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error(error.message);
  }

  // The join gives us purchase_order: { supplier: { name: 'Supplier Name' } } which we flatten
  return data.map(invoice => {
    const supplierName = invoice.purchase_order?.supplier?.name || 'N/A';
    // a bit of gymnastics to remove the nested purchase_order object
    const { purchase_order, ...rest } = invoice;
    return {
      ...rest,
      supplier: { name: supplierName },
      created_on: new Date(rest.created_on),
      updated_on: rest.updated_on ? new Date(rest.updated_on) : undefined,
    };
  }) as unknown as Invoice[];
};

export const getInvoiceById = async (invoiceId: string, organizationId: string): Promise<Invoice | null> => {
  const { data, error } = await supabase
    .from('invoice')
    .select(`
      *,
      lines:invoice_line(*),
      purchase_order (
        supplier:supplier_id (
          name
        )
      )
    `)
    .eq('id', invoiceId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching invoice ${invoiceId}:`, error);
    throw new Error(error.message);
  }

  if (!data) return null;

  const supplierName = data.purchase_order?.supplier?.name || 'N/A';
  const { purchase_order, ...rest } = data;
  
  return {
    ...rest,
    supplier: { name: supplierName },
    created_on: new Date(rest.created_on),
    updated_on: rest.updated_on ? new Date(rest.updated_on) : undefined,
  } as unknown as Invoice;
};
