
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData } from "@/types/purchaseOrder";
import { getUserNameById } from "@/lib/userUtils";

export async function createPurchaseOrder(formData: PurchaseOrderFormData, organizationId: string, userId: string): Promise<PurchaseOrder> {
  const poDate = formData.poDate;
  if (!poDate) {
    throw new Error("PO Date is required.");
  }
  
  const createdByUsername = await getUserNameById(userId);

  const poHeader = {
    po_number: formData.poNumber,
    division_id: formData.divisionId ? formData.divisionId : null,
    supplier_id: formData.supplierId ? formData.supplierId : null,
    po_date: poDate,
    requested_delivery_date: formData.requestedDeliveryDate || null,
    ship_to_address_1: formData.shipToAddress1,
    ship_to_address_2: formData.shipToAddress2,
    ship_to_postal_code: formData.shipToPostalCode,
    ship_to_city: formData.shipToCity,
    ship_to_state: formData.shipToState,
    ship_to_country: formData.shipToCountry,
    ship_to_phone: formData.shipToPhone,
    ship_to_email: formData.shipToEmail,
    payment_terms: formData.paymentTerms,
    notes: formData.notes,
    tracking_number: formData.trackingNumber,
    organization_id: organizationId,
    created_by: createdByUsername
  };

  const { data: poData, error: poError } = await supabase
    .from('purchase_order')
    .insert(poHeader)
    .select()
    .single();

  if (poError) {
    console.error("[PO] Error creating purchase order (header):", poError);
    if (poError.code === '23503') { // Foreign key violation
      if (poError.message.includes('division_id')) {
        throw new Error("Invalid Division selected. Please choose an existing Division.");
      } else if (poError.message.includes('supplier_id')) {
        throw new Error("Invalid Supplier selected. Please choose an existing Supplier.");
      } else {
        throw new Error(`Foreign key error: ${poError.message}`);
      }
    } else if (poError.code === '23505' && poError.message.includes('purchase_order_po_number_key')) {
      throw new Error(`Purchase Order number '${formData.poNumber}' already exists. Please refresh the page to get a new number.`);
    }
    throw new Error(`Failed to create purchase order: ${poError.message}`);
  }

  if (!poData?.id) {
    console.error("[PO] PO header insert did not return an ID", poData);
    throw new Error("Purchase order header creation failed: No ID returned.");
  }

  if (formData.lines.length > 0) {
    // Fetch item details for weight calculations
    const itemIds = [...new Set(formData.lines.map(line => line.itemId))];
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('id, weight, weight_uom')
      .in('id', itemIds);

    if (itemsError) {
      console.error("[PO] Error fetching item weight data:", itemsError);
      throw new Error(`Failed to fetch item weight data: ${itemsError.message}`);
    }

    const itemWeightMap = new Map(itemsData?.map(item => [item.id, { weight: item.weight, weightUom: item.weight_uom }]) || []);

    const lineData = formData.lines.map(line => {
      const itemWeight = itemWeightMap.get(line.itemId);
      const itemWeightPerUnit = itemWeight?.weight || 0;
      const itemWeightUom = itemWeight?.weightUom || 'kg';
      const totalLineWeight = itemWeightPerUnit * line.quantity;

      return {
        purchase_order_id: poData.id,
        line_number: line.lineNumber,
        item_id: line.itemId,
        quantity: line.quantity,
        uom: line.uom,
        unit_price: line.unitPrice,
        total_unit_price: line.totalUnitPrice,
        gst_percent: line.gstPercent,
        gst_value: line.gstValue,
        line_total: line.lineTotal,
        item_weight_per_unit: itemWeightPerUnit,
        item_weight_uom: itemWeightUom,
        total_line_weight: totalLineWeight,
        organization_id: organizationId,
        created_by: createdByUsername
      };
    });

    console.log("[PO] Inserting PO lines with weight data:", lineData);

    const { error: lineError } = await supabase
      .from('purchase_order_line')
      .insert(lineData);

    if (lineError) {
      console.error("[PO] Error creating purchase order lines:", lineError);
      // Note: This leaves an orphaned PO header. A transaction would be ideal here.
      throw new Error(`Failed to create purchase order lines: ${lineError.message}`);
    }
  }

  const createdPO: PurchaseOrder = {
    id: poData.id,
    poNumber: poData.po_number,
    divisionId: poData.division_id,
    supplierId: poData.supplier_id,
    poDate: poData.po_date,
    requestedDeliveryDate: poData.requested_delivery_date || undefined,
    shipToAddress1: poData.ship_to_address_1,
    shipToAddress2: poData.ship_to_address_2,
    shipToPostalCode: poData.ship_to_postal_code,
    shipToCity: poData.ship_to_city,
    shipToState: poData.ship_to_state,
    shipToCountry: poData.ship_to_country,
    shipToPhone: poData.ship_to_phone,
    shipToEmail: poData.ship_to_email,
    paymentTerms: poData.payment_terms,
    notes: poData.notes,
    trackingNumber: poData.tracking_number,
    status: poData.status as 'Created' | 'Approved' | 'Received',
    organizationId: poData.organization_id,
    createdBy: poData.created_by,
    createdOn: new Date(poData.created_on),
    lines: formData.lines.map(line => ({ ...line, purchaseOrderId: poData.id }))
  };
  
  return createdPO;
}
