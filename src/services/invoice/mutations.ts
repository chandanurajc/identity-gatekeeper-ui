
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { add } from 'date-fns';

export const createInvoiceFromReceivedPO = async (poId: string, organizationId: string, userId: string, userName: string): Promise<Invoice> => {
    const { data: poResult, error: poError } = await supabase
        .from('purchase_order')
        .select(`
            *,
            lines:purchase_order_line(*, item:items(*, itemGroup:item_groups(*))),
            supplier:supplier_id(*, contacts:organization_contacts(*)),
            organization:organization_id(*, contacts:organization_contacts(*))
        `)
        .eq('id', poId)
        .eq('organization_id', organizationId)
        .single();
    
    if (poError || !poResult) {
        throw new Error(`Failed to fetch Purchase Order with ID ${poId}: ${poError?.message}`);
    }

    // Cast to our camelCase type
    const poData = poResult as unknown as PurchaseOrder;

    // This check is removed because the calling function `receivePurchaseOrder` is responsible
    // for ensuring this is only called for 'Received' POs, and there could be replication lag.

    const { data: existingInvoice, error: existingInvoiceError } = await supabase
        .from('invoice')
        .select('id')
        .eq('po_id', poId)
        .maybeSingle();

    if (existingInvoiceError) {
        throw new Error(`Error checking for existing invoice: ${existingInvoiceError.message}`);
    }
    if (existingInvoice) {
        throw new Error(`An invoice already exists for Purchase Order ${poData.poNumber}.`);
    }

    const billToContact = poData.organization?.contacts?.find(c => c.type === 'Bill To');
    const remitToContact = poData.supplier?.contacts?.find(c => c.type === 'Remit To');

    const { data: invoiceNumber, error: invoiceNumberError } = await supabase.rpc('generate_invoice_number', {
        p_organization_id: organizationId
    });
    if (invoiceNumberError || !invoiceNumber) {
        throw new Error(`Failed to generate invoice number: ${invoiceNumberError.message}`);
    }

    const paymentTermsDays = parseInt(poData.paymentTerms?.match(/\d+/)?.[0] || '30', 10);
    const dueDate = add(new Date(poData.poDate), { days: paymentTermsDays });

    let totalItemCost = 0;
    let totalGst = 0;
    const invoiceLinesToInsert = poData.lines?.map(poLine => {
        totalItemCost += poLine.totalUnitPrice;
        totalGst += poLine.gstValue;
        return {
            organization_id: organizationId,
            line_number: poLine.lineNumber,
            item_id: poLine.itemId,
            item_description: poLine.item?.description,
            item_group_name: poLine.item?.itemGroup?.name,
            classification: poLine.item?.classification,
            sub_classification: poLine.item?.subClassification,
            quantity: poLine.quantity,
            uom: poLine.uom,
            unit_cost: poLine.unitPrice,
            total_item_cost: poLine.totalUnitPrice,
            gst_percent: poLine.gstPercent,
            gst_value: poLine.gstValue,
            line_total: poLine.lineTotal,
            created_by: userName,
        };
    }) || [];

    const totalInvoiceAmount = totalItemCost + totalGst;

    const { data: newInvoiceData, error: createInvoiceError } = await supabase
        .from('invoice')
        .insert({
            organization_id: organizationId,
            po_id: poId,
            po_number: poData.poNumber,
            invoice_number: invoiceNumber,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'Created',
            bill_to_name: billToContact?.firstName,
            bill_to_address1: billToContact?.address1,
            bill_to_address2: billToContact?.address2,
            bill_to_city: billToContact?.city,
            bill_to_state: billToContact?.state,
            bill_to_country: billToContact?.country,
            bill_to_postal_code: billToContact?.postalCode,
            bill_to_phone: billToContact?.phoneNumber,
            bill_to_email: billToContact?.email,
            remit_to_name: remitToContact?.firstName,
            remit_to_address1: remitToContact?.address1,
            remit_to_address2: remitToContact?.address2,
            remit_to_city: remitToContact?.city,
            remit_to_state: remitToContact?.state,
            remit_to_country: remitToContact?.country,
            remit_to_postal_code: remitToContact?.postalCode,
            remit_to_phone: remitToContact?.phoneNumber,
            remit_to_email: remitToContact?.email,
            total_item_cost: totalItemCost,
            total_gst: totalGst,
            total_invoice_amount: totalInvoiceAmount,
            created_by: userName,
        })
        .select()
        .single();
    
    if (createInvoiceError || !newInvoiceData) {
        throw new Error(`Failed to create invoice: ${createInvoiceError.message}`);
    }

    const linesWithInvoiceId = invoiceLinesToInsert.map(line => ({ ...line, invoice_id: newInvoiceData.id }));
    const { error: linesInsertError } = await supabase.from('invoice_line').insert(linesWithInvoiceId);

    if (linesInsertError) {
        await supabase.from('invoice').delete().eq('id', newInvoiceData.id);
        throw new Error(`Failed to insert invoice lines: ${linesInsertError.message}`);
    }

    return { 
        ...newInvoiceData, 
        lines: linesWithInvoiceId,
        created_on: new Date(newInvoiceData.created_on),
        updated_on: new Date(newInvoiceData.updated_on) ? new Date(newInvoiceData.updated_on) : undefined,
    } as unknown as Invoice;
};


export const approveInvoice = async (invoiceId: string, organizationId: string, userId: string, userName: string): Promise<Invoice> => {
    const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoice')
        .select('status, invoice_line(id)')
        .eq('id', invoiceId)
        .eq('organization_id', organizationId)
        .single();
    
    if (fetchError || !currentInvoice) {
        throw new Error(`Invoice not found: ${fetchError?.message}`);
    }

    if (currentInvoice.status === 'Approved') {
        throw new Error('Invoice is already approved.');
    }
    
    // The select on line 140 was changed to use a join which supabase returns as an array
    if (!currentInvoice.invoice_line || (Array.isArray(currentInvoice.invoice_line) && currentInvoice.invoice_line.length === 0)) {
        throw new Error('Cannot approve an invoice with no line items.');
    }

    const { data: updatedInvoiceData, error: updateError } = await supabase
        .from('invoice')
        .update({
            status: 'Approved',
            updated_by: userName,
            updated_on: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

    if (updateError || !updatedInvoiceData) {
        throw new Error(`Failed to approve invoice: ${updateError.message}`);
    }

    await supabase.from('invoice_audit_log').insert({
        invoice_id: invoiceId,
        organization_id: organizationId,
        user_id: userId,
        event_description: 'Invoice Approved',
        change_details: {
            from_status: 'Created',
            to_status: 'Approved',
        },
    });

    return {
        ...updatedInvoiceData,
        created_on: new Date(updatedInvoiceData.created_on),
        updated_on: updatedInvoiceData.updated_on ? new Date(updatedInvoiceData.updated_on) : undefined,
    } as unknown as Invoice;
};
