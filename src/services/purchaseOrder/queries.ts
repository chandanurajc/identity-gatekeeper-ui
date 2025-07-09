import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder } from "@/types/purchaseOrder";
import { isUUID } from "@/lib/userUtils";

export async function getAllPurchaseOrders(organizationId: string): Promise<PurchaseOrder[]> {
  console.log("Fetching purchase orders for organization:", organizationId);
  
  const { data, error } = await supabase
    .from('purchase_order')
    .select(`
      *,
      division:divisions(name, code),
      supplier:organizations!supplier_id(name, code)
    `)
    .eq('organization_id', organizationId)
    .order('created_on', { ascending: false });

  if (error) {
    console.error("Error fetching purchase orders:", error);
    throw new Error(`Failed to fetch purchase orders: ${error.message}`);
  }

  if (!data) return [];

  const userIdentifiers = new Set<string>();
  data.forEach(po => {
    if (isUUID(po.created_by)) userIdentifiers.add(po.created_by);
    if (po.updated_by && isUUID(po.updated_by)) userIdentifiers.add(po.updated_by);
  });

  const usernameMap = new Map<string, string>();
  if (userIdentifiers.size > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', Array.from(userIdentifiers));

    if (profileError) {
      console.error('Error fetching usernames for PO list:', profileError);
    } else {
      profiles?.forEach(p => usernameMap.set(p.id, p.username));
    }
  }

  return data.map(po => ({
    id: po.id,
    poNumber: po.po_number,
    divisionId: po.division_id,
    supplierId: po.supplier_id,
    poDate: po.po_date,
    requestedDeliveryDate: po.requested_delivery_date || undefined,
    shipToAddress1: po.ship_to_address_1,
    shipToAddress2: po.ship_to_address_2,
    shipToPostalCode: po.ship_to_postal_code,
    shipToCity: po.ship_to_city,
    shipToState: po.ship_to_state,
    shipToCountry: po.ship_to_country,
    shipToPhone: po.ship_to_phone,
    shipToEmail: po.ship_to_email,
    paymentTerms: po.payment_terms,
    notes: po.notes,
    trackingNumber: po.tracking_number,
    status: po.status as 'Created' | 'Approved' | 'Received',
    organizationId: po.organization_id,
    createdBy: usernameMap.get(po.created_by) || po.created_by,
    createdOn: new Date(po.created_on),
    updatedBy: (po.updated_by && (usernameMap.get(po.updated_by) || po.updated_by)) || undefined,
    updatedOn: po.updated_on ? new Date(po.updated_on) : undefined,
    division: po.division,
    supplier: po.supplier,
    poType: po.po_type
  }));
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  console.log("Fetching purchase order:", id);
  
  const { data, error } = await supabase
    .from('purchase_order')
    .select(`
      *,
      division:divisions(name, code),
      supplier:organizations!supplier_id(name, code),
      purchase_order_line (
        *,
        items (
          id,
          description,
          classification,
          sub_classification,
          item_group_id,
          item_groups (
            name,
            classification,
            sub_classification
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching purchase order:", error);
    return null;
  }

  if (!data) return null;

  const userIdentifiers = new Set<string>();
  if (isUUID(data.created_by)) userIdentifiers.add(data.created_by);
  if (data.updated_by && isUUID(data.updated_by)) userIdentifiers.add(data.updated_by);

  const usernameMap = new Map<string, string>();
  if (userIdentifiers.size > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', Array.from(userIdentifiers));

    if (profileError) {
      console.error(`Error fetching usernames for PO ${id}:`, profileError);
    } else {
      profiles?.forEach(p => usernameMap.set(p.id, p.username));
    }
  }

  return {
    id: data.id,
    poNumber: data.po_number,
    divisionId: data.division_id,
    supplierId: data.supplier_id,
    poDate: data.po_date,
    requestedDeliveryDate: data.requested_delivery_date || undefined,
    shipToAddress1: data.ship_to_address_1,
    shipToAddress2: data.ship_to_address_2,
    shipToPostalCode: data.ship_to_postal_code,
    shipToCity: data.ship_to_city,
    shipToState: data.ship_to_state,
    shipToCountry: data.ship_to_country,
    shipToPhone: data.ship_to_phone,
    shipToEmail: data.ship_to_email,
    paymentTerms: data.payment_terms,
    notes: data.notes,
    trackingNumber: data.tracking_number,
    status: data.status as 'Created' | 'Approved' | 'Received',
    organizationId: data.organization_id,
    createdBy: usernameMap.get(data.created_by) || data.created_by,
    createdOn: new Date(data.created_on),
    updatedBy: (data.updated_by && (usernameMap.get(data.updated_by) || data.updated_by)) || undefined,
    updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    division: data.division,
    supplier: data.supplier,
    poType: data.po_type,
    lines: data.purchase_order_line?.map((line: any) => ({
      id: line.id,
      purchaseOrderId: line.purchase_order_id,
      lineNumber: line.line_number,
      itemId: line.item_id,
      quantity: line.quantity,
      uom: line.uom,
      unitPrice: line.unit_price,
      totalUnitPrice: line.total_unit_price,
      gstPercent: line.gst_percent,
      gstValue: line.gst_value,
      lineTotal: line.line_total,
      receivedQuantity: line.received_quantity,
      organizationId: line.organization_id,
      createdBy: line.created_by,
      createdOn: new Date(line.created_on),
      updatedBy: line.updated_by,
      updatedOn: line.updated_on ? new Date(line.updated_on) : undefined,
      item: line.items ? {
        id: line.items.id,
        description: line.items.description,
        classification: line.items.classification,
        subClassification: line.items.sub_classification,
        itemGroupId: line.items.item_group_id,
        itemGroup: line.items.item_groups
      } : undefined
    })) || []
  };
}

export async function generatePONumber(): Promise<string> {
  try {
    console.log("Generating new PO number...");
    
    // Get the latest PO number to determine the next one
    const { data, error } = await supabase
      .from('purchase_order')
      .select('po_number')
      .order('created_on', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching latest PO number:", error);
      throw new Error(`Failed to generate PO number: ${error.message}`);
    }

    let nextNumber = 1;
    
    if (data && data.length > 0 && data[0].po_number) {
      // Extract the number part from the latest PO number (format: PO000001)
      const latestPoNumber = data[0].po_number;
      const numberPart = latestPoNumber.replace('PO', '');
      const currentNumber = parseInt(numberPart, 10);
      
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    const poNumber = `PO${String(nextNumber).padStart(6, '0')}`;
    console.log("Generated PO number:", poNumber);
    
    return poNumber;
  } catch (error) {
    console.error("Error in generatePONumber:", error);
    // Fallback to count-based generation
    const { count, error: countError } = await supabase
      .from('purchase_order')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to generate PO number: ${countError.message}`);
    }
    
    return `PO${String((count || 0) + 1).padStart(6, '0')}`;
  }
}

export async function getDivisionShippingAddress(divisionId: string): Promise<any> {
  try {
    // Fetch 'Registered location' contact instead of 'Shipping'
    const { data: contact, error } = await supabase
      .from('division_contacts')
      .select('*')
      .eq('division_id', divisionId)
      .eq('contact_type', 'Registered location')
      .single();

    if (error) {
      console.error('Error fetching division registered location contact:', error);
      return null;
    }

    // If no registered location contact found, try to get the first available contact
    if (!contact) {
      const { data: firstContact, error: firstError } = await supabase
        .from('division_contacts')
        .select('*')
        .eq('division_id', divisionId)
        .limit(1)
        .single();

      if (firstError || !firstContact) {
        console.error('Error fetching division contact:', firstError);
        return null;
      }

      return {
        address1: firstContact.address1,
        address2: firstContact.address2,
        postal_code: firstContact.postal_code,
        city: firstContact.city,
        state: firstContact.state,
        country: firstContact.country,
        phone_number: firstContact.phone_number,
        email: firstContact.email,
        state_code: firstContact.state_code
      };
    }

    return {
      address1: contact.address1,
      address2: contact.address2,
      postal_code: contact.postal_code,
      city: contact.city,
      state: contact.state,
      country: contact.country,
      phone_number: contact.phone_number,
      email: contact.email,
      state_code: contact.state_code
    };
  } catch (error) {
    console.error('Error in getDivisionShippingAddress:', error);
    return null;
  }
}

// Add function to get supplier state code
export async function getSupplierStateCode(supplierId: string): Promise<number | null> {
  try {
    const { data: contact, error } = await supabase
      .from('organization_contacts')  
      .select('state_code')
      .eq('organization_id', supplierId)
      .eq('contact_type', 'Registered location')
      .single();

    if (error) {
      console.error('Error fetching supplier registered location contact:', error);
      return null;
    }

    return contact?.state_code || null;
  } catch (error) {
    console.error('Error in getSupplierStateCode:', error);
    return null;
  }
}
