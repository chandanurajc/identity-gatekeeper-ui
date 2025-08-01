import { supabase } from "@/integrations/supabase/client";
import type { Invoice, InvoiceFormData, ReferenceTransactionSearchParams, ReferenceTransactionResult, InvoiceStatus, TransactionType } from "@/types/invoice";

class InvoiceService {
  async getInvoicesPendingApprovalCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('invoice')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'Awaiting Approval');
    if (error) {
      throw new Error(`Failed to fetch pending approval invoices count: ${error.message}`);
    }
    return count || 0;
  }
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

    // Calculate GST breakdown based on state codes
    const gstBreakdown = this.calculateGstBreakdown(invoiceData.invoiceLines, invoiceData.remitToStateCode, invoiceData.shipToStateCode);

    const invoiceToCreate = {
      organization_id: organizationId,
      division_id: invoiceData.divisionId,
      invoice_number: invoiceNumber,
      supplier_invoice_number: invoiceData.supplierInvoiceNumber,
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
      notes: invoiceData.notes,
      total_item_value: totalItemValue,
      total_gst_value: totalGstValue,
      total_invoice_value: totalInvoiceValue,
      created_by: createdBy,
      // Bill To
      bill_to_name: invoiceData.billToName,
      bill_to_address1: invoiceData.billToAddress1,
      bill_to_address2: invoiceData.billToAddress2,
      bill_to_city: invoiceData.billToCity,
      bill_to_state: invoiceData.billToState,
      bill_to_state_code: invoiceData.billToStateCode,
      bill_to_country: invoiceData.billToCountry,
      bill_to_postal_code: invoiceData.billToPostalCode,
      bill_to_email: invoiceData.billToEmail,
      bill_to_phone: invoiceData.billToPhone,
      bill_to_gstin: invoiceData.billToGstin,
      bill_to_cin: invoiceData.billToCin,
      // Remit To
      remit_to_contact_id: invoiceData.remitToContactId,
      remit_to_name: invoiceData.remitToName,
      remit_to_address1: invoiceData.remitToAddress1,
      remit_to_address2: invoiceData.remitToAddress2,
      remit_to_city: invoiceData.remitToCity,
      remit_to_state: invoiceData.remitToState,
      remit_to_state_code: invoiceData.remitToStateCode,
      remit_to_country: invoiceData.remitToCountry,
      remit_to_postal_code: invoiceData.remitToPostalCode,
      remit_to_email: invoiceData.remitToEmail,
      remit_to_phone: invoiceData.remitToPhone,
      remit_to_gstin: invoiceData.remitToGstin,
      remit_to_cin: invoiceData.remitToCin,
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

  // Create GST breakdown entries
  if (gstBreakdown.length > 0) {
    const { error: gstError } = await supabase
      .from('invoice_gst_breakdown')
      .insert(gstBreakdown.map(breakdown => ({
        invoice_id: invoice.id,
        ...breakdown
      })));

    if (gstError) {
      throw new Error(`Failed to create GST breakdown: ${gstError.message}`);
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

    // Calculate GST breakdown based on state codes
    const gstBreakdown = this.calculateGstBreakdown(invoiceData.invoiceLines, invoiceData.remitToStateCode, invoiceData.shipToStateCode);

    const invoiceToUpdate = {
      division_id: invoiceData.divisionId,
      invoice_date: invoiceData.invoiceDate,
      invoice_type: invoiceData.invoiceType,
      supplier_invoice_number: invoiceData.supplierInvoiceNumber,
      bill_to_org_id: invoiceData.billToOrgId,
      remit_to_org_id: invoiceData.remitToOrgId,
      same_as_division_address: invoiceData.sameAsDivisionAddress,
      // Bill To fields
      bill_to_name: invoiceData.billToName,
      bill_to_address1: invoiceData.billToAddress1,
      bill_to_address2: invoiceData.billToAddress2,
      bill_to_city: invoiceData.billToCity,
      bill_to_state: invoiceData.billToState,
      bill_to_state_code: invoiceData.billToStateCode,
      bill_to_country: invoiceData.billToCountry,
      bill_to_postal_code: invoiceData.billToPostalCode,
      bill_to_email: invoiceData.billToEmail,
      bill_to_phone: invoiceData.billToPhone,
      bill_to_gstin: invoiceData.billToGstin,
      bill_to_cin: invoiceData.billToCin,
      // Remit To fields
      remit_to_contact_id: invoiceData.remitToContactId,
      remit_to_name: invoiceData.remitToName,
      remit_to_address1: invoiceData.remitToAddress1,
      remit_to_address2: invoiceData.remitToAddress2,
      remit_to_city: invoiceData.remitToCity,
      remit_to_state: invoiceData.remitToState,
      remit_to_state_code: invoiceData.remitToStateCode,
      remit_to_country: invoiceData.remitToCountry,
      remit_to_postal_code: invoiceData.remitToPostalCode,
      remit_to_email: invoiceData.remitToEmail,
      remit_to_phone: invoiceData.remitToPhone,
      remit_to_gstin: invoiceData.remitToGstin,
      remit_to_cin: invoiceData.remitToCin,
      // Ship To fields
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
      notes: invoiceData.notes,
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

  // Delete existing GST breakdown and recreate
  const { error: deleteGstError } = await supabase
    .from('invoice_gst_breakdown')
    .delete()
    .eq('invoice_id', id);

  if (deleteGstError) {
    throw new Error(`Failed to delete existing GST breakdown: ${deleteGstError.message}`);
  }

  // Create new GST breakdown entries
  if (gstBreakdown.length > 0) {
    const { error: gstError } = await supabase
      .from('invoice_gst_breakdown')
      .insert(gstBreakdown.map(breakdown => ({
        invoice_id: id,
        ...breakdown
      })));

    if (gstError) {
      throw new Error(`Failed to create GST breakdown: ${gstError.message}`);
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

    // --- Auto Journal Posting Logic for Invoice Approval ---
    if (newStatus === 'Approved') {
      // Lazy import to avoid circular deps
      const { accountingRulesService } = await import('./accountingRulesService');
      const { journalService } = await import('./journalService');
      // Fetch the latest invoice with lines and GST breakdown
      const invoice = await this.getInvoiceById(id, organizationId);
      if (!invoice) throw new Error('Invoice not found for journal posting');

      // Fetch matching accounting rules
      const rules = await accountingRulesService.getAccountingRules(organizationId);
      const matchingRules = rules.filter(rule =>
        rule.transactionCategory === 'Invoice' &&
        rule.triggeringAction === 'Invoice Approved' &&
        rule.transactionType === invoice.invoiceType &&
        rule.status === 'Active' &&
        (!rule.divisionId || rule.divisionId === invoice.divisionId)
      );

      // Calculate GST breakdown totals
      const gstBreakdown = invoice.gstBreakdown || [];
      const totalCGST = gstBreakdown.reduce((sum, b) => sum + (b.cgstAmount || 0), 0);
      const totalSGST = gstBreakdown.reduce((sum, b) => sum + (b.sgstAmount || 0), 0);
      const totalIGST = gstBreakdown.reduce((sum, b) => sum + (b.igstAmount || 0), 0);

      for (const rule of matchingRules) {
        if (!rule.lines || rule.lines.length === 0) continue;

        const allJournalLines = [];
        for (const line of rule.lines) {
          let amount = 0;
          if (line.amountSource === 'Total GST value') {
            amount = invoice.totalGstValue || 0;
          } else if (line.amountSource === 'Total invoice value') {
            amount = invoice.totalInvoiceValue || 0;
          } else if (line.amountSource === 'Total item value') {
            amount = invoice.totalItemValue || 0;
          } else if (line.amountSource === 'CGST Amount') {
            amount = totalCGST;
          } else if (line.amountSource === 'SGST Amount') {
            amount = totalSGST;
          } else if (line.amountSource === 'IGST Amount') {
            amount = totalIGST;
          }

          if (!amount || amount === 0) continue;
          if (!line.debitAccountCode && !line.creditAccountCode) continue;

          if (line.debitAccountCode) {
            allJournalLines.push({
              lineNumber: (line.lineNumber * 2) - 1,
              accountCode: line.debitAccountCode,
              debitAmount: amount,
              creditAmount: null,
              narration: `Invoice Approved - Debit - Line ${line.lineNumber} - ${line.amountSource}`,
            });
          }
          if (line.creditAccountCode) {
            allJournalLines.push({
              lineNumber: line.lineNumber * 2,
              accountCode: line.creditAccountCode,
              debitAmount: null,
              creditAmount: amount,
              narration: `Invoice Approved - Credit - Line ${line.lineNumber} - ${line.amountSource}`,
            });
          }
        }

        if (allJournalLines.length === 0) continue;

        const createdJournal = await journalService.createJournal({
          journalDate: new Date().toISOString().split('T')[0],
          transactionType: 'Invoice',
          transactionReference: invoice.invoiceNumber,
          journalLines: allJournalLines,
        }, organizationId, changedBy);

        if (createdJournal && createdJournal.id) {
          await journalService.postJournal(createdJournal.id, organizationId, changedBy);
          
          // Create subledger entries for lines that have enable_subledger = true
          const { subledgerService } = await import('./subledgerService');
          const subledgerLines = rule.lines.filter(line => line.enableSubledger);
          
          for (const line of subledgerLines) {
            try {
              let amount = 0;
              if (line.amountSource === 'Total GST value') {
                amount = invoice.totalGstValue || 0;
              } else if (line.amountSource === 'Total invoice value') {
                amount = invoice.totalInvoiceValue || 0;
              } else if (line.amountSource === 'Total item value') {
                amount = invoice.totalItemValue || 0;
              } else if (line.amountSource === 'CGST Amount') {
                amount = totalCGST;
              } else if (line.amountSource === 'SGST Amount') {
                amount = totalSGST;
              } else if (line.amountSource === 'IGST Amount') {
                amount = totalIGST;
              }
              
              if (!amount || amount === 0) continue;
              
              const debitAmount = line.debitAccountCode ? amount : undefined;
              const creditAmount = line.creditAccountCode ? amount : undefined;
              
              await subledgerService.createSubledgerEntry({
                organizationId: invoice.organizationId,
                journalId: createdJournal.id,
                partyOrgId: invoice.remitToOrgId,
                partyContactId: invoice.remitToContactId,
                transactionDate: invoice.invoiceDate,
                debitAmount,
                creditAmount,
                sourceReference: invoice.invoiceNumber,
                transactionCategory: 'Invoice',
                triggeringAction: 'Invoice Approved',
                createdBy: changedBy,
                updatedBy: changedBy,
              });
            } catch (error) {
              console.error(`Failed to create subledger entry for line ${line.lineNumber}:`, error);
            }
          }
        }
      }
    }
    // --- End Auto Journal Posting Logic ---
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
    // For now, only implement for Purchase Order
    if (params.transactionType === 'Purchase Order') {
      let query = supabase
        .from('purchase_order')
        .select('id, po_number, po_date, supplier:organizations!purchase_order_supplier_id_fkey(name)')
        .eq('organization_id', organizationId);

      if (params.transactionNumber) {
        query = query.ilike('po_number', `%${params.transactionNumber}%`);
      }
      if (params.transactionDate) {
        query = query.eq('po_date', params.transactionDate);
      }
      if (params.supplierName) {
        query = query.ilike('supplier.name', `%${params.supplierName}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error searching purchase orders:', error);
        return [];
      }

      // Get total values for each PO by summing line totals
      const results = await Promise.all((data || []).map(async (row: any) => {
        const { data: lineData, error: lineError } = await supabase
          .from('purchase_order_line')
          .select('line_total')
          .eq('purchase_order_id', row.id);

        if (lineError) {
          console.error('Error fetching PO line totals:', lineError);
          return {
            id: row.id,
            transactionType: 'Purchase Order' as TransactionType,
            transactionNumber: row.po_number,
            transactionDate: row.po_date,
            supplierName: row.supplier?.name || '',
            totalValue: 0,
          };
        }

        const totalValue = (lineData || []).reduce((sum: number, line: any) => sum + (parseFloat(line.line_total) || 0), 0);

        return {
          id: row.id,
          transactionType: 'Purchase Order' as TransactionType,
          transactionNumber: row.po_number,
          transactionDate: row.po_date,
          supplierName: row.supplier?.name || '',
          totalValue,
        };
      }));

      return results;
    }
    // TODO: Implement for Sales Order if/when available
    return [];
  }

  private transformInvoiceFromDb(dbInvoice: any): Invoice {
    return {
      id: dbInvoice.id,
      organizationId: dbInvoice.organization_id,
      divisionId: dbInvoice.division_id,
      invoiceNumber: dbInvoice.invoice_number,
      supplierInvoiceNumber: dbInvoice.supplier_invoice_number,
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
      remitToContactId: dbInvoice.remit_to_contact_id,
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
      notes: dbInvoice.notes,
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

  private calculateGstBreakdown(invoiceLines: any[], remitToStateCode?: number, shipToStateCode?: number) {
    // Group lines by GST percentage
    const gstGroups = invoiceLines.reduce((groups: Record<number, { taxableAmount: number; gstValue: number }>, line: any) => {
      const gstPercentage = line.gstPercentage || 0;
      if (!groups[gstPercentage]) {
        groups[gstPercentage] = {
          taxableAmount: 0,
          gstValue: 0
        };
      }
      groups[gstPercentage].taxableAmount += line.totalPrice || 0;
      groups[gstPercentage].gstValue += line.gstValue || 0;
      return groups;
    }, {});

    // Calculate breakdown for each GST group
    return Object.entries(gstGroups).map(([gstPercentageStr, group]: [string, { taxableAmount: number; gstValue: number }]) => {
      const gstPercentage = parseFloat(gstPercentageStr);
      const isIntraState = remitToStateCode && shipToStateCode && remitToStateCode === shipToStateCode;
      
      if (isIntraState) {
        // Intra-state: Split GST into CGST and SGST (equal halves)
        const cgstPercentage = gstPercentage / 2;
        const sgstPercentage = gstPercentage / 2;
        const cgstAmount = group.gstValue / 2;
        const sgstAmount = group.gstValue / 2;
        
        return {
          gst_percentage: gstPercentage,
          taxable_amount: group.taxableAmount,
          cgst_percentage: cgstPercentage,
          cgst_amount: cgstAmount,
          sgst_percentage: sgstPercentage,
          sgst_amount: sgstAmount,
          igst_percentage: 0,
          igst_amount: 0,
          total_gst_amount: group.gstValue
        };
      } else {
        // Inter-state: All GST as IGST
        return {
          gst_percentage: gstPercentage,
          taxable_amount: group.taxableAmount,
          cgst_percentage: 0,
          cgst_amount: 0,
          sgst_percentage: 0,
          sgst_amount: 0,
          igst_percentage: gstPercentage,
          igst_amount: group.gstValue,
          total_gst_amount: group.gstValue
        };
      }
    }).filter(breakdown => breakdown.gst_percentage > 0); // Only include non-zero GST
  }
}

export const invoiceService = new InvoiceService();
export const getInvoicesPendingApprovalCount = (orgId: string) => invoiceService.getInvoicesPendingApprovalCount(orgId);
