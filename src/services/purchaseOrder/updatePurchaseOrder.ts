import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderLine, PurchaseOrderGSTBreakdown } from "@/types/purchaseOrder";
import { getUserNameById } from "@/lib/userUtils";
import { getPurchaseOrderById } from "./queries";

const calculateGSTBreakdown = (lines: PurchaseOrderLine[], billToStateCode?: number, remitToStateCode?: number): PurchaseOrderGSTBreakdown[] => {
  console.log("=== GST Calculation Debug (Update) ===");
  console.log("billToStateCode:", billToStateCode);
  console.log("remitToStateCode:", remitToStateCode);
  
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
    // Check if both state codes exist and are the same (intra-state)
    const isIntraState = billToStateCode && remitToStateCode && billToStateCode === remitToStateCode;
    
    console.log(`GST ${gstPercentage}%: isIntraState =`, isIntraState);
    console.log(`Comparison: ${billToStateCode} === ${remitToStateCode} = ${billToStateCode === remitToStateCode}`);
    
    breakdown.push({
      gstPercentage,
      taxableAmount: value.taxableAmount,
      cgstPercentage: isIntraState ? gstPercentage / 2 : 0,
      cgstAmount: isIntraState ? value.gstValue / 2 : 0,
      sgstPercentage: isIntraState ? gstPercentage / 2 : 0,
      sgstAmount: isIntraState ? value.gstValue / 2 : 0,
      igstPercentage: isIntraState ? 0 : gstPercentage,
      igstAmount: isIntraState ? 0 : value.gstValue,
      totalGstAmount: value.gstValue
    });
  });

  console.log("Final GST breakdown:", breakdown);
  return breakdown;
};

export async function updatePurchaseOrder(id: string, formData: PurchaseOrderFormData, organizationId: string, userId: string): Promise<PurchaseOrder> {
  const poDate = formData.poDate;
  if (!poDate) {
    throw new Error("[PO] Invalid PO Date provided for update.");
  }

  const updatedByUsername = await getUserNameById(userId);

  const { error: poError } = await supabase
    .from('purchase_order')
    .update({
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
      updated_by: updatedByUsername,
      updated_on: new Date().toISOString(),
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
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (poError) {
    console.error("Error updating purchase order:", poError);
    throw new Error(`Failed to update purchase order: ${poError.message}`);
  }

  // Delete existing lines and recreate them
  const { error: deleteError } = await supabase
    .from('purchase_order_line')
    .delete()
    .eq('purchase_order_id', id);

  if (deleteError) {
    console.error("Error deleting purchase order lines:", deleteError);
    throw new Error(`Failed to delete purchase order lines: ${deleteError.message}`);
  }

  // Create new purchase order lines with weight calculations
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
        purchase_order_id: id,
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
        created_by: updatedByUsername // Should this be the original creator or updater? Using updater for now.
      };
    });

    const { error: lineError } = await supabase
      .from('purchase_order_line')
      .insert(lineData);

    if (lineError) {
      console.error("Error creating purchase order lines:", lineError);
      throw new Error(`Failed to create purchase order lines: ${lineError.message}`);
    }

    // Delete existing GST breakdown and recreate
    const { error: deleteGSTError } = await supabase
      .from('purchase_order_gst_breakdown')
      .delete()
      .eq('purchase_order_id', id);

    if (deleteGSTError) {
      console.error("Error deleting GST breakdown:", deleteGSTError);
      throw new Error(`Failed to delete GST breakdown: ${deleteGSTError.message}`);
    }

    // Calculate and save GST breakdown
    const gstBreakdown = calculateGSTBreakdown(formData.lines, formData.shipToStateCode, formData.remitToStateCode);
    if (gstBreakdown.length > 0) {
      const gstBreakdownData = gstBreakdown.map(breakdown => ({
        purchase_order_id: id,
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
        console.error("Error creating GST breakdown:", gstError);
        throw new Error(`Failed to create GST breakdown: ${gstError.message}`);
      }
    }
  }

  return await getPurchaseOrderById(id) as PurchaseOrder;
}
