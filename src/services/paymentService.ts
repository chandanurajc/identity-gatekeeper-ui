import { supabase } from '@/integrations/supabase/client';
import { Payment, PaymentFormData, PaymentAuditLog, InvoiceSearchParams, InvoiceSearchResult } from '@/types/payment';
import { paymentJournalService } from './paymentJournalService';

export const paymentService = {
  // Get all payments for organization
  getPayments: async (organizationId: string): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_on', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw new Error(error.message);
    }

    return data.map(payment => ({
      id: payment.id,
      paymentNumber: payment.payment_number,
      paymentDate: payment.payment_date,
      paymentType: payment.payment_type,
      organizationId: payment.organization_id,
      divisionId: payment.division_id,
      payeeOrganizationId: payment.payee_organization_id,
      remitToContactId: (payment as any).remit_to_contact_id || null,
      paymentMode: payment.payment_mode,
      referenceNumber: payment.reference_number,
      amount: payment.amount,
      currency: payment.currency,
      linkedInvoiceId: payment.linked_invoice_id,
      notes: payment.notes,
      status: payment.status,
      createdBy: payment.created_by,
      createdOn: new Date(payment.created_on),
      updatedBy: payment.updated_by,
      updatedOn: payment.updated_on ? new Date(payment.updated_on) : undefined,
    }));
  },

  // Get payment by ID
  getPaymentById: async (id: string): Promise<Payment | null> => {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching payment:', error);
      throw new Error(error.message);
    }

    // Fetch related data separately
    const [payeeOrg, division, invoice, remitContact] = await Promise.all([
      // Fetch payee organization
      supabase
        .from('organizations')
        .select('id, name')
        .eq('id', payment.payee_organization_id)
        .single(),
      
      // Fetch division
      supabase
        .from('divisions')
        .select('id, name')
        .eq('id', payment.division_id)
        .single(),
      
      // Fetch linked invoice if exists
      payment.linked_invoice_id ? supabase
        .from('invoice')
        .select('id, invoice_number, invoice_date, total_invoice_value, remit_to_name, remit_to_org_id, bill_to_org_id, status')
        .eq('id', payment.linked_invoice_id)
        .single() : Promise.resolve({ data: null, error: null }),
      
      // Fetch remit to contact if exists
      (payment as any).remit_to_contact_id ? supabase
        .from('organization_contacts')
        .select('id, first_name, last_name')
        .eq('id', (payment as any).remit_to_contact_id)
        .single() : Promise.resolve({ data: null, error: null })
    ]);

    return {
      id: payment.id,
      paymentNumber: payment.payment_number,
      paymentDate: payment.payment_date,
      paymentType: payment.payment_type,
      organizationId: payment.organization_id,
      divisionId: payment.division_id,
      payeeOrganizationId: payment.payee_organization_id,
      remitToContactId: (payment as any).remit_to_contact_id || null,
      paymentMode: payment.payment_mode,
      referenceNumber: payment.reference_number,
      amount: payment.amount,
      currency: payment.currency,
      linkedInvoiceId: payment.linked_invoice_id,
      notes: payment.notes,
      status: payment.status,
      createdBy: payment.created_by,
      createdOn: new Date(payment.created_on),
      updatedBy: payment.updated_by,
      updatedOn: payment.updated_on ? new Date(payment.updated_on) : undefined,
      payeeOrganization: payeeOrg.data ? {
        id: payeeOrg.data.id,
        name: payeeOrg.data.name
      } : undefined,
      division: division.data ? {
        id: division.data.id,
        name: division.data.name
      } : undefined,
      linkedInvoice: invoice.data ? {
        id: invoice.data.id,
        invoiceNumber: invoice.data.invoice_number,
        invoiceDate: invoice.data.invoice_date,
        supplierOrganizationId: invoice.data.remit_to_org_id,
        supplierName: invoice.data.remit_to_name,
        totalInvoiceValue: invoice.data.total_invoice_value,
        billToOrgId: invoice.data.bill_to_org_id,
        remitToOrgId: invoice.data.remit_to_org_id,
        status: invoice.data.status,
      } : undefined,
      remitToContact: remitContact.data ? {
        id: remitContact.data.id,
        firstName: remitContact.data.first_name,
        lastName: remitContact.data.last_name
      } : undefined
    };
  },

  // Generate payment number
  generatePaymentNumber: async (organizationId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_payment_number', {
      org_id: organizationId
    });

    if (error) {
      console.error('Error generating payment number:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Create payment
  createPayment: async (
    paymentData: PaymentFormData,
    organizationId: string,
    createdBy: string
  ): Promise<Payment> => {
    const paymentNumber = paymentData.paymentNumber || await paymentService.generatePaymentNumber(organizationId);

    const newPayment = {
      payment_number: paymentNumber,
      payment_date: paymentData.paymentDate,
      payment_type: paymentData.paymentType,
      organization_id: organizationId,
      division_id: paymentData.divisionId,
      payee_organization_id: paymentData.payeeOrganizationId,
      remit_to_contact_id: paymentData.remitToContactId,
      payment_mode: paymentData.paymentMode,
      reference_number: paymentData.referenceNumber,
      amount: paymentData.amount,
      currency: 'INR',
      linked_invoice_id: paymentData.linkedInvoiceId,
      notes: paymentData.notes,
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([newPayment])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(error.message);
    }

    // Get the created payment with all related data
    const createdPayment = await paymentService.getPaymentById(data.id) as Payment;
    
    // Create journal entry for payment creation
    try {
      await paymentJournalService.createPaymentJournal(createdPayment, 'Created', createdBy);
    } catch (journalError) {
      console.error('Error creating payment journal:', journalError);
      // Don't throw here - payment creation should succeed even if journal fails
    }

    return createdPayment;
  },

  // Update payment
  updatePayment: async (
    id: string,
    paymentData: PaymentFormData,
    updatedBy: string
  ): Promise<Payment> => {
    const updateData = {
      payment_date: paymentData.paymentDate,
      payment_type: paymentData.paymentType,
      division_id: paymentData.divisionId,
      payee_organization_id: paymentData.payeeOrganizationId,
      remit_to_contact_id: paymentData.remitToContactId,
      payment_mode: paymentData.paymentMode,
      reference_number: paymentData.referenceNumber,
      amount: paymentData.amount,
      linked_invoice_id: paymentData.linkedInvoiceId,
      notes: paymentData.notes,
      updated_by: updatedBy,
      updated_on: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating payment:', error);
      throw new Error(error.message);
    }

    return paymentService.getPaymentById(id) as Promise<Payment>;
  },

  // Update payment status
  updatePaymentStatus: async (
    id: string,
    newStatus: 'Created' | 'Approved' | 'Rejected',
    changedBy: string,
    comments?: string
  ): Promise<void> => {
    // Get current payment for audit log
    const currentPayment = await paymentService.getPaymentById(id);
    if (!currentPayment) throw new Error('Payment not found');

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        updated_by: changedBy,
        updated_on: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      throw new Error(updateError.message);
    }

    // Create journal entry for status change
    try {
      await paymentJournalService.createPaymentJournal(currentPayment, newStatus, changedBy);
    } catch (journalError) {
      console.error('Error creating payment journal for status change:', journalError);
      // Don't throw here - status update should succeed even if journal fails
    }

    // Add audit log entry
    const { error: auditError } = await supabase
      .from('payment_audit_log')
      .insert({
        payment_id: id,
        old_status: currentPayment.status,
        new_status: newStatus,
        changed_by: changedBy,
        comments: comments,
      });

    if (auditError) {
      console.error('Error creating payment audit log:', auditError);
      throw new Error(auditError.message);
    }
  },

  // Search invoices for linking
  searchInvoices: async (
    organizationId: string,
    searchParams: InvoiceSearchParams
  ): Promise<InvoiceSearchResult[]> => {
    let query = supabase
      .from('invoice')
      .select(`
        id,
        invoice_number,
        invoice_date,
        remit_to_org_id,
        remit_to_name,
        total_invoice_value,
        bill_to_org_id,
        status
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'Approved'); // Only approved invoices can be linked

    if (searchParams.supplierOrgId) {
      query = query.eq('remit_to_org_id', searchParams.supplierOrgId);
    }

    if (searchParams.invoiceNumber) {
      query = query.ilike('invoice_number', `%${searchParams.invoiceNumber}%`);
    }

    if (searchParams.invoiceDateFrom) {
      query = query.gte('invoice_date', searchParams.invoiceDateFrom);
    }

    if (searchParams.invoiceDateTo) {
      query = query.lte('invoice_date', searchParams.invoiceDateTo);
    }

    const { data, error } = await query.order('invoice_date', { ascending: false });

    if (error) {
      console.error('Error searching invoices:', error);
      throw new Error(error.message);
    }

    return data.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      supplierOrganizationId: invoice.remit_to_org_id,
      supplierName: invoice.remit_to_name,
      totalInvoiceValue: invoice.total_invoice_value,
      billToOrgId: invoice.bill_to_org_id,
      remitToOrgId: invoice.remit_to_org_id,
      status: invoice.status,
    }));
  },

  // Get payment audit logs
  getPaymentAuditLogs: async (paymentId: string): Promise<PaymentAuditLog[]> => {
    const { data, error } = await supabase
      .from('payment_audit_log')
      .select('*')
      .eq('payment_id', paymentId)
      .order('changed_on', { ascending: false });

    if (error) {
      console.error('Error fetching payment audit logs:', error);
      throw new Error(error.message);
    }

    return data.map(log => ({
      id: log.id,
      paymentId: log.payment_id,
      oldStatus: log.old_status,
      newStatus: log.new_status,
      changedBy: log.changed_by,
      changedOn: new Date(log.changed_on),
      comments: log.comments,
    }));
  },
};