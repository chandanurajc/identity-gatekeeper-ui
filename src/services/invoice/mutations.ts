import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';
import { add } from 'date-fns';

const findContact = (contacts: any[] | undefined, preferredTypes: string[]) => {
    if (!contacts || contacts.length === 0) {
        console.log(`[Invoice] No contacts provided to search within.`);
        return undefined;
    }
    for (const type of preferredTypes) {
        const contact = contacts.find(c => c.contact_type === type);
        if (contact) {
            console.log(`[Invoice] Found contact of type '${type}'`);
            return contact;
        }
    }
    console.log(`[Invoice] No contact found for preferred types: ${preferredTypes.join(', ')}. Defaulting to the first available contact.`);
    return contacts[0];
};

export const createInvoiceFromReceivedPO = async (poId: string, organizationId: string, userId: string, userName: string): Promise<Invoice> => {
    console.log(`[Invoice] Starting invoice creation from PO ${poId}`);
    const { data: poResult, error: poError } = await supabase
        .from('purchase_order')
        .select(`
            *,
            lines:purchase_order_line(*, item:items(*, itemGroup:item_group_id(*))),
            supplier:organizations!supplier_id(*, contacts:organization_contacts(*)),
            organization:organizations!organization_id(*, contacts:organization_contacts(*))
        `)
        .eq('id', poId)
        .eq('organization_id', organizationId)
        .single();
    
    if (poError || !poResult) {
        console.error(`[Invoice] Error fetching PO ${poId}:`, poError);
        throw new Error(`Failed to fetch Purchase Order with ID ${poId}: ${poError?.message}`);
    }
    console.log(`[Invoice] Successfully fetched PO ${poId}`);

    // This check is removed because the calling function `receivePurchaseOrder` is responsible
    // for ensuring this is only called for 'Received' POs, and there could be replication lag.

    const { data: existingInvoice, error: existingInvoiceError } = await supabase
        .from('invoice')
        .select('id')
        .eq('po_id', poId)
        .maybeSingle();

    if (existingInvoiceError) {
        console.error(`[Invoice] Error checking for existing invoice for PO ${poId}:`, existingInvoiceError);
        throw new Error(`Error checking for existing invoice: ${existingInvoiceError.message}`);
    }
    if (existingInvoice) {
        console.log(`[Invoice] Invoice already exists for PO ${poResult.po_number}. Aborting.`);
        throw new Error(`An invoice already exists for Purchase Order ${poResult.po_number}.`);
    }
    console.log(`[Invoice] No existing invoice found for PO ${poId}. Proceeding.`);

    const { data: invoiceNumber, error: invoiceNumberError } = await supabase.rpc('generate_invoice_number', {
        p_organization_id: organizationId
    });
    if (invoiceNumberError || !invoiceNumber) {
        console.error(`[Invoice] Error generating invoice number for PO ${poId}:`, invoiceNumberError);
        throw new Error(`Failed to generate invoice number: ${invoiceNumberError.message}`);
    }
    console.log(`[Invoice] Generated invoice number ${invoiceNumber} for PO ${poId}`);

    const billToContact = poResult.organization?.contacts?.find(c => c.contact_type === 'Bill To');
    const remitToContact = poResult.supplier?.contacts?.find(c => c.contact_type === 'Remit To');
    console.log(`[Invoice] Bill To contact:`, billToContact ? `${billToContact.first_name} (type: ${billToContact.contact_type})` : 'Not found, strictly searching for "Bill To" type.');
    console.log(`[Invoice] Remit To contact:`, remitToContact ? `${remitToContact.first_name} (type: ${remitToContact.contact_type})` : 'Not found, strictly searching for "Remit To" type.');

    const paymentTermsDays = parseInt(poResult.payment_terms?.match(/\d+/)?.[0] || '30', 10);
    const dueDate = add(new Date(poResult.po_date), { days: paymentTermsDays });

    let totalItemCost = 0;
    let totalGst = 0;
    const invoiceLinesToInsert = poResult.lines?.map(poLine => {
        totalItemCost += poLine.total_unit_price;
        totalGst += poLine.gst_value;
        return {
            organization_id: organizationId,
            line_number: poLine.line_number,
            item_id: poLine.item_id,
            item_description: poLine.item?.description,
            item_group_name: poLine.item?.itemGroup?.name,
            classification: poLine.item?.classification,
            sub_classification: poLine.item?.sub_classification,
            quantity: poLine.quantity,
            uom: poLine.uom,
            unit_cost: poLine.unit_price,
            total_item_cost: poLine.total_unit_price,
            gst_percent: poLine.gst_percent,
            gst_value: poLine.gst_value,
            line_total: poLine.line_total,
            created_by: userName,
        };
    }) || [];

    const totalInvoiceAmount = totalItemCost + totalGst;

    const { data: newInvoiceData, error: createInvoiceError } = await supabase
        .from('invoice')
        .insert({
            organization_id: organizationId,
            po_id: poId,
            po_number: poResult.po_number,
            invoice_number: invoiceNumber,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'Created',
            bill_to_name: billToContact?.first_name,
            bill_to_address1: billToContact?.address1,
            bill_to_address2: billToContact?.address2,
            bill_to_city: billToContact?.city,
            bill_to_state: billToContact?.state,
            bill_to_country: billToContact?.country,
            bill_to_postal_code: billToContact?.postal_code,
            bill_to_phone: billToContact?.phone_number,
            bill_to_email: billToContact?.email,
            remit_to_name: remitToContact?.first_name,
            remit_to_address1: remitToContact?.address1,
            remit_to_address2: remitToContact?.address2,
            remit_to_city: remitToContact?.city,
            remit_to_state: remitToContact?.state,
            remit_to_country: remitToContact?.country,
            remit_to_postal_code: remitToContact?.postal_code,
            remit_to_phone: remitToContact?.phone_number,
            remit_to_email: remitToContact?.email,
            total_item_cost: totalItemCost,
            total_gst: totalGst,
            total_invoice_amount: totalInvoiceAmount,
            created_by: userName,
        })
        .select()
        .single();
    
    if (createInvoiceError || !newInvoiceData) {
        console.error(`[Invoice] Error inserting invoice record for PO ${poId}:`, createInvoiceError);
        throw new Error(`Failed to create invoice: ${createInvoiceError.message}`);
    }
    console.log(`[Invoice] Successfully created invoice header ${newInvoiceData.id} for PO ${poId}`);

    const linesWithInvoiceId = invoiceLinesToInsert.map(line => ({ ...line, invoice_id: newInvoiceData.id }));
    const { error: linesInsertError } = await supabase.from('invoice_line').insert(linesWithInvoiceId);

    if (linesInsertError) {
        console.error(`[Invoice] Error inserting invoice lines for invoice ${newInvoiceData.id}. Rolling back invoice creation. Error:`, linesInsertError);
        await supabase.from('invoice').delete().eq('id', newInvoiceData.id);
        throw new Error(`Failed to insert invoice lines: ${linesInsertError.message}`);
    }
    
    console.log(`[Invoice] Successfully created invoice lines for invoice ${newInvoiceData.id}`);
    console.log(`[Invoice] Finished invoice creation from PO ${poId}`);

    return { 
        ...newInvoiceData, 
        lines: linesWithInvoiceId,
        created_on: new Date(newInvoiceData.created_on),
        updated_on: newInvoiceData.updated_on ? new Date(newInvoiceData.updated_on) : undefined,
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
