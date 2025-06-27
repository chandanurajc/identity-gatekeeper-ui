
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceFormData, TaxMaster, ReferenceTransactionSearch, ReferenceTransaction, GSTPersistence } from '@/types/invoice';

export const invoiceService = {
  // Generate invoice number
  async generateInvoiceNumber(organizationId: string, invoiceType: 'Payable' | 'Receivable'): Promise<string> {
    const { data, error } = await supabase.rpc('generate_invoice_number_v2', {
      p_organization_id: organizationId,
      p_invoice_type: invoiceType
    });

    if (error) {
      console.error('Error generating invoice number:', error);
      throw new Error(`Failed to generate invoice number: ${error.message}`);
    }

    return data;
  },

  // Get tax master data
  async getTaxMaster(organizationId: string): Promise<TaxMaster[]> {
    const { data, error } = await supabase
      .from('tax_master')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('tax_percent');

    if (error) {
      console.error('Error fetching tax master:', error);
      throw new Error(`Failed to fetch tax rates: ${error.message}`);
    }

    return data.map(item => ({
      ...item,
      created_on: new Date(item.created_on),
      updated_on: item.updated_on ? new Date(item.updated_on) : undefined
    }));
  },

  // Search reference transactions
  async searchReferenceTransactions(organizationId: string, searchParams: ReferenceTransactionSearch): Promise<ReferenceTransaction[]> {
    let query = supabase.from('purchase_order').select(`
      id,
      po_number,
      po_date,
      status,
      supplier:organizations!supplier_id(name)
    `).eq('organization_id', organizationId);

    if (searchParams.transaction_number) {
      query = query.ilike('po_number', `%${searchParams.transaction_number}%`);
    }

    if (searchParams.transaction_date) {
      query = query.eq('po_date', searchParams.transaction_date);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error('Error searching reference transactions:', error);
      throw new Error(`Failed to search transactions: ${error.message}`);
    }

    return data.map(item => ({
      id: item.id,
      transaction_type: 'Purchase Order' as const,
      transaction_number: item.po_number,
      transaction_date: item.po_date,
      supplier_name: item.supplier?.name,
      status: item.status
    }));
  },

  // Calculate GST breakdown
  async calculateGSTBreakdown(billToStateCode: number, shipToStateCode: number, gstPercent: number, taxableAmount: number): Promise<GSTPersistence> {
    const { data, error } = await supabase.rpc('calculate_gst_breakdown', {
      p_bill_to_state_code: billToStateCode,
      p_ship_to_state_code: shipToStateCode,
      p_gst_percent: gstPercent,
      p_taxable_amount: taxableAmount
    });

    if (error) {
      console.error('Error calculating GST breakdown:', error);
      throw new Error(`Failed to calculate GST: ${error.message}`);
    }

    return data[0];
  },

  // Create invoice
  async createInvoice(invoiceData: InvoiceFormData, organizationId: string, userId: string): Promise<Invoice> {
    // Calculate totals
    let totalItemValue = 0;
    let totalGST = 0;
    const gstLines: any[] = [];

    for (const line of invoiceData.lines) {
      totalItemValue += line.total_item_cost;
      totalGST += line.gst_value;

      // Calculate GST breakdown for this line
      const gstBreakdown = await this.calculateGSTBreakdown(
        1, // Will be updated with actual state codes
        invoiceData.ship_to_state_code || 1,
        line.gst_percent,
        line.total_item_cost
      );

      // Add GST lines
      if (gstBreakdown.cgst_amount > 0) {
        gstLines.push({
          gst_type: 'CGST',
          gst_percent: gstBreakdown.cgst_percent,
          taxable_amount: line.total_item_cost,
          gst_amount: gstBreakdown.cgst_amount
        });
        gstLines.push({
          gst_type: 'SGST',
          gst_percent: gstBreakdown.sgst_percent,
          taxable_amount: line.total_item_cost,
          gst_amount: gstBreakdown.sgst_amount
        });
      } else {
        gstLines.push({
          gst_type: 'IGST',
          gst_percent: gstBreakdown.igst_percent,
          taxable_amount: line.total_item_cost,
          gst_amount: gstBreakdown.igst_amount
        });
      }
    }

    const totalInvoiceAmount = totalItemValue + totalGST;

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice')
      .insert({
        organization_id: organizationId,
        invoice_number: invoiceData.invoice_number,
        invoice_date: invoiceData.invoice_date,
        invoice_type: invoiceData.invoice_type,
        division_id: invoiceData.division_id,
        bill_to_organization_id: invoiceData.bill_to_organization_id,
        remit_to_organization_id: invoiceData.remit_to_organization_id,
        bill_to_contact_id: invoiceData.bill_to_contact_id,
        remit_to_contact_id: invoiceData.remit_to_contact_id,
        reference_transaction_type: invoiceData.reference_transaction_type,
        reference_transaction_id: invoiceData.reference_transaction_id,
        reference_transaction_number: invoiceData.reference_transaction_number,
        ship_to_same_as_division: invoiceData.ship_to_same_as_division,
        ship_to_name: invoiceData.ship_to_name,
        ship_to_address1: invoiceData.ship_to_address1,
        ship_to_address2: invoiceData.ship_to_address2,
        ship_to_postal_code: invoiceData.ship_to_postal_code,
        ship_to_city: invoiceData.ship_to_city,
        ship_to_state: invoiceData.ship_to_state,
        ship_to_state_code: invoiceData.ship_to_state_code,
        ship_to_country: invoiceData.ship_to_country,
        ship_to_phone: invoiceData.ship_to_phone,
        payment_terms: invoiceData.payment_terms,
        due_date: invoiceData.due_date,
        total_item_value: totalItemValue,
        total_gst: totalGST,
        total_invoice_amount: totalInvoiceAmount,
        status: 'Draft',
        created_by: userId
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Create invoice lines
    const invoiceLines = invoiceData.lines.map((line, index) => ({
      invoice_id: invoice.id,
      organization_id: organizationId,
      line_number: line.line_number,
      item_id: line.item_id,
      quantity: line.quantity,
      uom: line.uom,
      unit_cost: line.unit_cost,
      total_item_cost: line.total_item_cost,
      gst_percent: line.gst_percent,
      gst_value: line.gst_value,
      line_total: line.line_total,
      weight_per_unit: line.weight_per_unit,
      weight_uom: line.weight_uom,
      total_weight: line.total_weight,
      created_by: userId
    }));

    const { error: linesError } = await supabase
      .from('invoice_line')
      .insert(invoiceLines);

    if (linesError) {
      console.error('Error creating invoice lines:', linesError);
      throw new Error(`Failed to create invoice lines: ${linesError.message}`);
    }

    // Create GST lines
    const invoiceGSTLines = gstLines.map(gstLine => ({
      invoice_id: invoice.id,
      organization_id: organizationId,
      ...gstLine,
      created_by: userId
    }));

    const { error: gstError } = await supabase
      .from('invoice_gst_lines')
      .insert(invoiceGSTLines);

    if (gstError) {
      console.error('Error creating GST lines:', gstError);
      throw new Error(`Failed to create GST lines: ${gstError.message}`);
    }

    // Create status history
    const { error: statusError } = await supabase
      .from('invoice_status_history')
      .insert({
        invoice_id: invoice.id,
        organization_id: organizationId,
        status: 'Draft',
        changed_by: userId,
        comments: 'Invoice created'
      });

    if (statusError) {
      console.error('Error creating status history:', statusError);
    }

    return {
      ...invoice,
      created_on: new Date(invoice.created_on),
      updated_on: invoice.updated_on ? new Date(invoice.updated_on) : undefined
    } as Invoice;
  },

  // Get all invoices
  async getInvoices(organizationId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoice')
      .select(`
        *,
        division:divisions(name, code),
        bill_to_org:organizations!bill_to_organization_id(name, code),
        remit_to_org:organizations!remit_to_organization_id(name, code)
      `)
      .eq('organization_id', organizationId)
      .order('created_on', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data.map(invoice => ({
      ...invoice,
      created_on: new Date(invoice.created_on),
      updated_on: invoice.updated_on ? new Date(invoice.updated_on) : undefined,
      division: invoice.division ? { name: invoice.division.name, code: invoice.division.code } : undefined,
      billToOrganization: invoice.bill_to_org ? { name: invoice.bill_to_org.name, code: invoice.bill_to_org.code } : undefined,
      remitToOrganization: invoice.remit_to_org ? { name: invoice.remit_to_org.name, code: invoice.remit_to_org.code } : undefined
    })) as Invoice[];
  },

  // Get invoice by ID
  async getInvoiceById(invoiceId: string, organizationId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoice')
      .select(`
        *,
        lines:invoice_line(*),
        gst_lines:invoice_gst_lines(*),
        status_history:invoice_status_history(*),
        division:divisions(name, code),
        bill_to_org:organizations!bill_to_organization_id(name, code),
        remit_to_org:organizations!remit_to_organization_id(name, code)
      `)
      .eq('id', invoiceId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    if (!data) return null;

    return {
      ...data,
      created_on: new Date(data.created_on),
      updated_on: data.updated_on ? new Date(data.updated_on) : undefined,
      lines: data.lines?.map(line => ({
        ...line,
        created_on: line.created_on ? new Date(line.created_on) : undefined,
        updated_on: line.updated_on ? new Date(line.updated_on) : undefined
      })),
      gstLines: data.gst_lines?.map(gst => ({
        ...gst,
        created_on: new Date(gst.created_on)
      })),
      statusHistory: data.status_history?.map(status => ({
        ...status,
        changed_on: new Date(status.changed_on)
      })),
      division: data.division ? { name: data.division.name, code: data.division.code } : undefined,
      billToOrganization: data.bill_to_org ? { name: data.bill_to_org.name, code: data.bill_to_org.code } : undefined,
      remitToOrganization: data.remit_to_org ? { name: data.remit_to_org.name, code: data.remit_to_org.code } : undefined
    } as Invoice;
  },

  // Update invoice status
  async updateInvoiceStatus(invoiceId: string, status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Cancelled', organizationId: string, userId: string, comments?: string): Promise<void> {
    const { error: invoiceError } = await supabase
      .from('invoice')
      .update({
        status: status,
        updated_by: userId,
        updated_on: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('organization_id', organizationId);

    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
      throw new Error(`Failed to update invoice status: ${invoiceError.message}`);
    }

    // Create status history entry
    const { error: statusError } = await supabase
      .from('invoice_status_history')
      .insert({
        invoice_id: invoiceId,
        organization_id: organizationId,
        status: status,
        changed_by: userId,
        comments: comments
      });

    if (statusError) {
      console.error('Error creating status history:', statusError);
    }
  }
};
