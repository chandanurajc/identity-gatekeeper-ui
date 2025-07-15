import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderLine, PurchaseOrderGSTBreakdown } from "@/types/purchaseOrder";
import { getUserNameById } from "@/lib/userUtils";

const calculateGSTBreakdown = (lines: PurchaseOrderLine[], billToStateCode?: number, remitToStateCode?: number): PurchaseOrderGSTBreakdown[] => {
  const gstGroups = new Map<number, { taxableAmount: number; gstValue: number }>();
  
  lines.forEach(line => {
    const existing = gstGroups.get(line.gstPercent) || { taxableAmount: 0, gstValue: 0 };
    gstGroups.set(line.gstPercent, {
      taxableAmount: existing.taxableAmount + line.totalUnitPrice,
      gstValue: existing.gstValue + line.gstValue
    });
  });

  const breakdown: PurchaseOrderGSTBreakdown[] = [];
  gstGroups.forEach((value, gstPercentage) => {
    const isSameState = billToStateCode === remitToStateCode;
    
    breakdown.push({
      gstPercentage,
      taxableAmount: value.taxableAmount,
      cgstPercentage: isSameState ? gstPercentage / 2 : 0,
      cgstAmount: isSameState ? value.gstValue / 2 : 0,
      sgstPercentage: isSameState ? gstPercentage / 2 : 0,
      sgstAmount: isSameState ? value.gstValue / 2 : 0,
      igstPercentage: isSameState ? 0 : gstPercentage,
      igstAmount: isSameState ? 0 : value.gstValue,
      totalGstAmount: value.gstValue
    });
  });

  return breakdown;
};

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
    ship_to_state_code: formData.shipToStateCode || null,
    ship_to_country: formData.shipToCountry,
    ship_to_phone: formData.shipToPhone,
    ship_to_email: formData.shipToEmail,
    payment_terms: formData.paymentTerms,
    notes: formData.notes,
    tracking_number: formData.trackingNumber,
    organization_id: organizationId,
    created_by: createdByUsername,
    po_type: formData.poType as "Consumables" | "Assets" | "Finished goods" | "Raw materials" | null,
    // Bill To fields
    bill_to_org_id: formData.billToOrgId || null,
    bill_to_name: formData.billToName || null,
    bill_to_address1: formData.billToAddress1 || null,
    bill_to_address2: formData.billToAddress2 || null,
    bill_to_city: formData.billToCity || null,
    bill_to_state: formData.billToState || null,
    bill_to_state_code: formData.billToStateCode || null,
    bill_to_country: formData.billToCountry || null,
    bill_to_postal_code: formData.billToPostalCode || null,
    bill_to_email: formData.billToEmail || null,
    bill_to_phone: formData.billToPhone || null,
    bill_to_gstin: formData.billToGstin || null,
    bill_to_cin: formData.billToCin || null,
    // Remit To fields
    remit_to_org_id: formData.remitToOrgId || null,
    remit_to_name: formData.remitToName || null,
    remit_to_address1: formData.remitToAddress1 || null,
    remit_to_address2: formData.remitToAddress2 || null,
    remit_to_city: formData.remitToCity || null,
    remit_to_state: formData.remitToState || null,
    remit_to_state_code: formData.remitToStateCode || null,
    remit_to_country: formData.remitToCountry || null,
    remit_to_postal_code: formData.remitToPostalCode || null,
    remit_to_email: formData.remitToEmail || null,
    remit_to_phone: formData.remitToPhone || null,
    remit_to_gstin: formData.remitToGstin || null,
    remit_to_cin: formData.remitToCin || null
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

    // Calculate and save GST breakdown
    const gstBreakdown = calculateGSTBreakdown(formData.lines, formData.billToStateCode, formData.remitToStateCode);
    if (gstBreakdown.length > 0) {
      const gstBreakdownData = gstBreakdown.map(breakdown => ({
        purchase_order_id: poData.id,
        gst_percentage: breakdown.gstPercentage,
        taxable_amount: breakdown.taxableAmount,
        cgst_percentage: breakdown.cgstPercentage || 0,
        cgst_amount: breakdown.cgstAmount || 0,
        sgst_percentage: breakdown.sgstPercentage || 0,
        sgst_amount: breakdown.sgstAmount || 0,
        igst_percentage: breakdown.igstPercentage || 0,
        igst_amount: breakdown.igstAmount || 0,
        total_gst_amount: breakdown.totalGstAmount
      }));

      const { error: gstError } = await supabase
        .from('purchase_order_gst_breakdown')
        .insert(gstBreakdownData);

      if (gstError) {
        console.error("[PO] Error creating GST breakdown:", gstError);
        throw new Error(`Failed to create GST breakdown: ${gstError.message}`);
      }
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
    shipToStateCode: poData.ship_to_state_code,
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
