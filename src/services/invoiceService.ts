
import { supabase } from "@/integrations/supabase/client";
import type { Invoice, InvoiceFormData, ReferenceTransactionSearchParams, ReferenceTransactionResult, InvoiceStatus } from "@/types/invoice";

class InvoiceService {
  async getInvoices(organizationId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoice')
      .select(`
        *,
        invoice_line (*),
        invoice_gst_breakdown (*),
        invoice_audit_log (*)
      `)
      .eq('organization_id', organizationId)
      .order('created_on', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data?.map(this.transformInvoiceFromDb) || [];
  }

  async getInvoiceById(id: string, organizationId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoice')
      .select(`
        *,
        invoice_line (*),
        invoice_gst_breakdown (*),
        invoice_audit_log (*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    return data ? this.transformInvoiceFromDb(data) : null;
  }

  async createInvoice(invoiceData: InvoiceFormData, organizationId: string, createdBy: string): Promise<Invoice> {
    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number', { org_id: organizationId });

    if (numberError) {
      throw new Error(`Failed to generate invoice number: ${numberError.message}`);
    }

    // Calculate due date based on payment terms
    const invoiceDate = new Date(invoiceData.invoiceDate);
    const dueDate = this.calculateDueDate(invoiceDate, invoiceData.paymentTerms);

    // Calculate totals
    const { totalItemValue, totalGstValue, totalInvoiceValue } = this.calculateTotals(invoiceData.invoiceLines);

    const invoiceToCreate = {
      organization_id: organizationId,
      division_id: invoiceData.divisionId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceData.invoiceDate,
      invoice_type: invoiceData.invoiceType,
      bill_to_org_id: invoiceData.billToOrgId,
      remit_to_org_id: invoiceData.remitToOrgId,
      same_as_division_address: invoiceData.sameAsDivisionAddress,
      ship_to_name: invoiceData.shipToName,
      ship_to_address1: invoiceData.shipToAddress1,
      ship_to_address2: invoiceData.shipToAddress2,
      ship_to_postal_code: invoiceData.shipToPostalCode,
      ship_to_city: invoiceData.shipToCity,
      ship_to_state: invoiceData.shipToState,
      ship_to_state_code: invoiceData.shipToStateCode,
      ship_to_country: invoiceData.shipToCountry,
      ship_to_phone: invoiceData.shipToPhone,
      reference_transaction_type: invoiceData.referenceTransactionType,
      reference_transaction_number: invoiceData.referenceTransactionNumber,
      reference_transaction_date: invoiceData.referenceTransactionDate,
      payment_terms: invoiceData.paymentTerms,
      due_date: dueDate.toISOString().split('T')[0],
      total_item_value: totalItemValue,
      total_gst_value: totalGstValue,
      total_invoice_value: totalInvoiceValue,
      created_by: createdBy,
    };

    const { data: invoice, error } = await supabase
      .from('invoice')
      .insert(invoiceToCreate)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    // Create invoice lines
    if (invoiceData.invoiceLines.length > 0) {
      const linesToCreate = invoiceData.invoiceLines.map(line => ({
        invoice_id: invoice.id,
        line_number: line.lineNumber,
        item_id: line.itemId,
        item_description: line.itemDescription,
        quantity: line.quantity,
        uom: line.uom,
        weight_per_unit: line.weightPerUnit,
        weight_uom: line.weightUom,
        total_weight: line.totalWeight,
        unit_price: line.unitPrice,
        total_price: line.totalPrice,
        gst_percentage: line.gstPercentage,
        gst_value: line.gstValue,
        line_total: line.lineTotal,
      }));

      const { error: linesError } = await supabase
        .from('invoice_line')
        .insert(linesToCreate);

      if (linesError) {
        throw new Error(`Failed to create invoice lines: ${linesError.message}`);
      }
    }

    return this.getInvoiceById(invoice.id, organizationId) as Promise<Invoice>;
  }

  async updateInvoice(id: string, invoiceData: InvoiceFormData, organizationId: string, updatedBy: string): Promise<Invoice> {
    // Calculate due date based on payment terms
    const invoiceDate = new Date(invoiceData.invoiceDate);
    const dueDate = this.calculateDueDate(invoiceDate, invoiceData.paymentTerms);

    // Calculate totals
    const { totalItemValue, totalGstValue, totalInvoiceValue } = this.calculateTotals(invoiceData.invoiceLines);

    const invoiceToUpdate = {
      invoice_date: invoiceData.invoiceDate,
      invoice_type: invoiceData.invoiceType,
      bill_to_org_id: invoiceData.billToOrgId,
      remit_to_org_id: invoiceData.remitToOrgId,
      same_as_division_address: invoiceData.sameAsDivisionAddress,
      ship_to_name: invoiceData.shipToName,
      ship_to_address1: invoiceData.shipToAddress1,
      ship_to_address2: invoiceData.shipToAddress2,
      ship_to_postal_code: invoiceData.shipToPostalCode,
      ship_to_city: invoiceData.shipToCity,
      ship_to_state: invoiceData.shipToState,
      ship_to_state_code: invoiceData.shipToStateCode,
      ship_to_country: invoiceData.shipToCountry,
      ship_to_phone: invoiceData.shipToPhone,
      reference_transaction_type: invoiceData.referenceTransactionType,
      reference_transaction_number: invoiceData.referenceTransactionNumber,
      reference_transaction_date: invoiceData.referenceTransactionDate,
      payment_terms: invoiceData.paymentTerms,
      due_date: dueDate.toISOString().split('T')[0],
      total_item_value: totalItemValue,
      total_gst_value: totalGstValue,
      total_invoice_value: totalInvoiceValue,
      updated_by: updatedBy,
      updated_on: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('invoice')
      .update(invoiceToUpdate)
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    // Delete existing invoice lines and recreate them
    const { error: deleteError } = await supabase
      .from('invoice_line')
      .delete()
      .eq('invoice_id', id);

    if (deleteError) {
      throw new Error(`Failed to delete existing invoice lines: ${deleteError.message}`);
    }

    // Create new invoice lines
    if (invoiceData.invoiceLines.length > 0) {
      const linesToCreate = invoiceData.invoiceLines.map(line => ({
        invoice_id: id,
        line_number: line.lineNumber,
        item_id: line.itemId,
        item_description: line.itemDescription,
        quantity: line.quantity,
        uom: line.uom,
        weight_per_unit: line.weightPerUnit,
        weight_uom: line.weightUom,
        total_weight: line.totalWeight,
        unit_price: line.unitPrice,
        total_price: line.totalPrice,
        gst_percentage: line.gstPercentage,
        gst_value: line.gstValue,
        line_total: line.lineTotal,
      }));

      const { error: linesError } = await supabase
        .from('invoice_line')
        .insert(linesToCreate);

      if (linesError) {
        throw new Error(`Failed to create invoice lines: ${linesError.message}`);
      }
    }

    return this.getInvoiceById(id, organizationId) as Promise<Invoice>;
  }

  async updateInvoiceStatus(id: string, newStatus: InvoiceStatus, organizationId: string, changedBy: string, comments?: string): Promise<void> {
    // Get current invoice to track old status
    const currentInvoice = await this.getInvoiceById(id, organizationId);
    if (!currentInvoice) {
      throw new Error('Invoice not found');
    }

    // Update invoice status
    const { error } = await supabase
      .from('invoice')
      .update({ 
        status: newStatus, 
        updated_by: changedBy, 
        updated_on: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('invoice_audit_log')
      .insert({
        invoice_id: id,
        old_status: currentInvoice.status,
        new_status: newStatus,
        changed_by: changedBy,
        comments,
      });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
  }

  async generateInvoiceNumber(organizationId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('generate_invoice_number', { org_id: organizationId });

    if (error) {
      throw new Error(`Failed to generate invoice number: ${error.message}`);
    }

    return data;
  }

  async searchReferenceTransactions(params: ReferenceTransactionSearchParams, organizationId: string): Promise<ReferenceTransactionResult[]> {
    // This would typically search purchase orders or sales orders
    // For now, returning empty array as these tables may not exist yet
    console.log('Searching reference transactions:', params, organizationId);
    return [];
  }

  private transformInvoiceFromDb(dbInvoice: any): Invoice {
    return {
      id: dbInvoice.id,
      organizationId: dbInvoice.organization_id,
      divisionId: dbInvoice.division_id,
      invoiceNumber: dbInvoice.invoice_number,
      invoiceDate: dbInvoice.invoice_date,
      invoiceType: dbInvoice.invoice_type,
      status: dbInvoice.status,
      billToOrgId: dbInvoice.bill_to_org_id,
      billToName: dbInvoice.bill_to_name,
      billToAddress1: dbInvoice.bill_to_address1,
      billToAddress2: dbInvoice.bill_to_address2,
      billToPostalCode: dbInvoice.bill_to_postal_code,
      billToCity: dbInvoice.bill_to_city,
      billToState: dbInvoice.bill_to_state,
      billToStateCode: dbInvoice.bill_to_state_code,
      billToCountry: dbInvoice.bill_to_country,
      billToEmail: dbInvoice.bill_to_email,
      billToPhone: dbInvoice.bill_to_phone,
      billToGstin: dbInvoice.bill_to_gstin,
      billToCin: dbInvoice.bill_to_cin,
      remitToOrgId: dbInvoice.remit_to_org_id,
      remitToName: dbInvoice.remit_to_name,
      remitToAddress1: dbInvoice.remit_to_address1,
      remitToAddress2: dbInvoice.remit_to_address2,
      remitToPostalCode: dbInvoice.remit_to_postal_code,
      remitToCity: dbInvoice.remit_to_city,
      remitToState: dbInvoice.remit_to_state,
      remitToStateCode: dbInvoice.remit_to_state_code,
      remitToCountry: dbInvoice.remit_to_country,
      remitToEmail: dbInvoice.remit_to_email,
      remitToPhone: dbInvoice.remit_to_phone,
      remitToGstin: dbInvoice.remit_to_gstin,
      remitToCin: dbInvoice.remit_to_cin,
      sameAsDivisionAddress: dbInvoice.same_as_division_address,
      shipToName: dbInvoice.ship_to_name,
      shipToAddress1: dbInvoice.ship_to_address1,
      shipToAddress2: dbInvoice.ship_to_address2,
      shipToPostalCode: dbInvoice.ship_to_postal_code,
      shipToCity: dbInvoice.ship_to_city,
      shipToState: dbInvoice.ship_to_state,
      shipToStateCode: dbInvoice.ship_to_state_code,
      shipToCountry: dbInvoice.ship_to_country,
      shipToPhone: dbInvoice.ship_to_phone,
      referenceTransactionType: dbInvoice.reference_transaction_type,
      referenceTransactionNumber: dbInvoice.reference_transaction_number,
      referenceTransactionDate: dbInvoice.reference_transaction_date,
      paymentTerms: dbInvoice.payment_terms,
      dueDate: dbInvoice.due_date,
      totalItemValue: parseFloat(dbInvoice.total_item_value || 0),
      totalGstValue: parseFloat(dbInvoice.total_gst_value || 0),
      totalInvoiceValue: parseFloat(dbInvoice.total_invoice_value || 0),
      createdOn: new Date(dbInvoice.created_on),
      updatedOn: dbInvoice.updated_on ? new Date(dbInvoice.updated_on) : undefined,
      createdBy: dbInvoice.created_by,
      updatedBy: dbInvoice.updated_by,
      invoiceLines: dbInvoice.invoice_line?.map((line: any) => ({
        id: line.id,
        invoiceId: line.invoice_id,
        lineNumber: line.line_number,
        itemId: line.item_id,
        itemDescription: line.item_description,
        quantity: parseFloat(line.quantity),
        uom: line.uom,
        weightPerUnit: line.weight_per_unit ? parseFloat(line.weight_per_unit) : undefined,
        weightUom: line.weight_uom,
        totalWeight: line.total_weight ? parseFloat(line.total_weight) : undefined,
        unitPrice: parseFloat(line.unit_price),
        totalPrice: parseFloat(line.total_price),
        gstPercentage: parseFloat(line.gst_percentage),
        gstValue: parseFloat(line.gst_value),
        lineTotal: parseFloat(line.line_total),
        createdOn: new Date(line.created_on),
        updatedOn: line.updated_on ? new Date(line.updated_on) : undefined,
      })) || [],
      gstBreakdown: dbInvoice.invoice_gst_breakdown?.map((breakdown: any) => ({
        id: breakdown.id,
        invoiceId: breakdown.invoice_id,
        gstPercentage: parseFloat(breakdown.gst_percentage),
        taxableAmount: parseFloat(breakdown.taxable_amount),
        cgstPercentage: parseFloat(breakdown.cgst_percentage),
        cgstAmount: parseFloat(breakdown.cgst_amount),
        sgstPercentage: parseFloat(breakdown.sgst_percentage),
        sgstAmount: parseFloat(breakdown.sgst_amount),
        igstPercentage: parseFloat(breakdown.igst_percentage),
        igstAmount: parseFloat(breakdown.igst_amount),
        totalGstAmount: parseFloat(breakdown.total_gst_amount),
      })) || [],
      auditLog: dbInvoice.invoice_audit_log?.map((log: any) => ({
        id: log.id,
        invoiceId: log.invoice_id,
        oldStatus: log.old_status,
        newStatus: log.new_status,
        changedBy: log.changed_by,
        changedOn: new Date(log.changed_on),
        comments: log.comments,
      })) || [],
    };
  }

  private calculateDueDate(invoiceDate: Date, paymentTerms: string): Date {
    const dueDate = new Date(invoiceDate);
    
    switch (paymentTerms) {
      case 'Net 30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Net 60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'Net 90':
        dueDate.setDate(dueDate.getDate() + 90);
        break;
      case 'Due on Receipt':
      default:
        // Due date remains the same as invoice date
        break;
    }
    
    return dueDate;
  }

  private calculateTotals(invoiceLines: any[]) {
    const totalItemValue = invoiceLines.reduce((sum, line) => sum + (line.totalPrice || 0), 0);
    const totalGstValue = invoiceLines.reduce((sum, line) => sum + (line.gstValue || 0), 0);
    const totalInvoiceValue = totalItemValue + totalGstValue;

    return {
      totalItemValue,
      totalGstValue,
      totalInvoiceValue,
    };
  }
}

export const invoiceService = new InvoiceService();
