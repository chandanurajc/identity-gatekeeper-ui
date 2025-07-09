import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData } from "@/types/purchaseOrder";
import { getUserNameById } from "@/lib/userUtils";
import { getPurchaseOrderById } from "./queries";
import { getSupplierStateCode } from './queries';

export async function updatePurchaseOrder(id: string, formData: PurchaseOrderFormData, organizationId: string, userId: string): Promise<PurchaseOrder> {
  const poDate = formData.poDate;
  if (!poDate) {
    throw new Error("[PO] Invalid PO Date provided for update.");
  }

  const updatedByUsername = await getUserNameById(userId);

  // Get supplier state code
  let supplierStateCode = null;
  if (formData.supplierId) {
    supplierStateCode = await getSupplierStateCode(formData.supplierId);
  }

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
      supplier_state_code: supplierStateCode,
      updated_by: updatedByUsername,
      updated_on: new Date().toISOString(),
      po_type: formData.poType
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
  }

  return await getPurchaseOrderById(id) as PurchaseOrder;
}
