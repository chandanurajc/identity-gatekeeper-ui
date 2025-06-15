
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
            supplier:organizations!supplier_id(*, contacts:organization_contacts(*), references:organization_references(*)),
            organization:organizations!organization_id(*, contacts:organization_contacts(*), references:organization_references(*))
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

    const billToPan = poResult.organization?.references?.find(r => r.reference_type === 'PAN')?.reference_value;
    const billToCin = poResult.organization?.references?.find(r => r.reference_type === 'CIN')?.reference_value;
    const remitToPan = poResult.supplier?.references?.find(r => r.reference_type === 'PAN')?.reference_value;
    const remitToCin = poResult.supplier?.references?.find(r => r.reference_type === 'CIN')?.reference_value;
    console.log(`[Invoice] Bill To PAN: ${billToPan}, CIN: ${billToCin}`);
    console.log(`[Invoice] Remit To PAN: ${remitToPan}, CIN: ${remitToCin}`);

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
            payment_terms: poResult.payment_terms,
            status: 'Created',
            bill_to_organization_id: poResult.organization_id,
            remit_to_organization_id: poResult.supplier_id,
            bill_to_name: billToContact?.first_name,
            bill_to_address1: billToContact?.address1,
            bill_to_address2: billToContact?.address2,
            bill_to_city: billToContact?.city,
            bill_to_state: billToContact?.state,
            bill_to_country: billToContact?.country,
            bill_to_postal_code: billToContact?.postal_code,
            bill_to_phone: billToContact?.phone_number,
            bill_to_email: billToContact?.email,
            bill_to_pan: billToPan,
            bill_to_cin: billToCin,
            remit_to_name: remitToContact?.first_name,
            remit_to_address1: remitToContact?.address1,
            remit_to_address2: remitToContact?.address2,
            remit_to_city: remitToContact?.city,
            remit_to_state: remitToContact?.state,
            remit_to_country: remitToContact?.country,
            remit_to_postal_code: remitToContact?.postal_code,
            remit_to_phone: remitToContact?.phone_number,
            remit_to_email: remitToContact?.email,
            remit_to_pan: remitToPan,
            remit_to_cin: remitToCin,
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
        .select(`
            *,
            bill_to_org:organizations!bill_to_organization_id(*, contacts:organization_contacts(*)),
            remit_to_org:organizations!remit_to_organization_id(*, contacts:organization_contacts(*))
        `)
        .eq('id', invoiceId)
        .eq('organization_id', organizationId)
        .single();
    
    if (fetchError || !currentInvoice) {
        throw new Error(`Invoice not found: ${fetchError?.message}`);
    }

    if (currentInvoice.status === 'Approved') {
        throw new Error('Invoice is already approved.');
    }
    
    const { count: lineCount, error: lineCountError } = await supabase
        .from('invoice_line')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_id', invoiceId);
    
    if (lineCountError || lineCount === 0) {
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

    if (currentInvoice.bill_to_organization_id && currentInvoice.remit_to_organization_id && currentInvoice.bill_to_org && currentInvoice.remit_to_org) {
        const billToContact = currentInvoice.bill_to_org.contacts?.find(c => c.contact_type === 'Bill To') || currentInvoice.bill_to_org.contacts?.[0];
        const remitToContact = currentInvoice.remit_to_org.contacts?.find(c => c.contact_type === 'Remit To') || currentInvoice.remit_to_org.contacts?.[0];

        const { error: glError } = await supabase.from('general_ledger').insert({
            bill_to_orgid: currentInvoice.bill_to_organization_id,
            remit_to_orgid: currentInvoice.remit_to_organization_id,
            transaction_type: 'Payable Invoice',
            transaction_date: new Date().toISOString().split('T')[0],
            reference_number: currentInvoice.invoice_number,
            amount: -currentInvoice.total_invoice_amount,
            created_by: userName,
            bill_to_name: currentInvoice.bill_to_org.name,
            bill_to_address1: billToContact?.address1,
            bill_to_address2: billToContact?.address2,
            bill_to_city: billToContact?.city,
            bill_to_state: billToContact?.state,
            bill_to_country: billToContact?.country,
            bill_to_postal_code: billToContact?.postal_code,
            bill_to_email: billToContact?.email,
            bill_to_phone: billToContact?.phone_number,
            remit_to_name: currentInvoice.remit_to_org.name,
            remit_to_address1: remitToContact?.address1,
            remit_to_address2: remitToContact?.address2,
            remit_to_city: remitToContact?.city,
            remit_to_state: remitToContact?.state,
            remit_to_country: remitToContact?.country,
            remit_to_postal_code: remitToContact?.postal_code,
            remit_to_email: remitToContact?.email,
            remit_to_phone: remitToContact?.phone_number,
        });

        if (glError) {
            console.error('Failed to post to General Ledger. Invoice was approved, but GL entry failed. Manual correction may be needed.', glError);
        }
    } else {
        console.warn(`Skipping GL posting for invoice ${invoiceId}: missing bill_to_organization_id, remit_to_organization_id, or organization details.`);
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
