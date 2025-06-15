
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
    supplier: po.supplier
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
  const { data, error } = await supabase
    .from('purchase_order')
    .select('po_number')
    .order('created_on', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error getting latest PO number:", error);
    throw new Error(`Failed to generate PO number: ${error.message}`);
  }

  if (!data?.po_number) {
    return 'PO000001';
  }
  
  const latestPoNumberStr = data.po_number.replace('PO', '');
  const latestPoNumber = parseInt(latestPoNumberStr, 10);

  if (isNaN(latestPoNumber)) {
    console.error("Failed to parse PO number, falling back to count", data.po_number);
    const { count, error: countError } = await supabase
        .from('purchase_order')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        throw new Error(`Failed to generate PO number on fallback: ${countError.message}`);
    }
    return `PO${String((count || 0) + 1).padStart(6, '0')}`;
  }

  const nextNumber = latestPoNumber + 1;
  return `PO${String(nextNumber).padStart(6, '0')}`;
}

export async function getDivisionShippingAddress(divisionId: string): Promise<any> {
  console.log("Fetching division shipping address (from division_contacts):", divisionId);

  // Fetch ALL shipping contacts, not just one
  const { data, error } = await supabase
    .from('division_contacts')
    .select('*')
    .eq('division_id', divisionId)
    .eq('contact_type', 'Shipping');

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching division shipping address (division_contacts):", error);
    throw new Error(`Failed to fetch division shipping address: ${error.message}`);
  }
  // If multiple shipping contacts, pick the first (if any)
  if (data && data.length > 0) {
    // Prefer contacts with valid address1 field
    const sorted = [...data].sort((a, b) => {
      // entries with non-empty address1 should come first
      if (a.address1 && !b.address1) return -1;
      if (!a.address1 && b.address1) return 1;
      return 0;
    });
    return sorted[0];
  }
  // Return null if none found
  return null;
}
