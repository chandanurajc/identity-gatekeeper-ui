
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderFormData, ShippingAddress } from '@/types/purchaseOrder';
import { receivePurchaseOrder } from './purchaseOrder/receivePurchaseOrder';
import { getAllPurchaseOrders, generatePONumber, getDivisionShippingAddress } from './purchaseOrder/queries';
import { createPurchaseOrder } from './purchaseOrder/createPurchaseOrder';

export { generatePONumber, getDivisionShippingAddress, createPurchaseOrder, getAllPurchaseOrders };

export const getPurchaseOrderById = async (poId: string, organizationId: string): Promise<PurchaseOrder> => {
  const { data, error } = await supabase
    .from('purchase_order')
    .select(`
      *,
      lines:purchase_order_line(
        *,
        item:items(id, description)
      ),
      supplier:organizations!supplier_id(*),
      division:divisions(*)
    `)
    .eq('id', poId)
    .single();

  if (error || !data) {
    console.error("Error fetching purchase order:", error);
    throw new Error("Failed to fetch purchase order");
  }

  return {
    ...data,
    poNumber: data.po_number,
    divisionId: data.division_id,
    supplierId: data.supplier_id,
    poDate: data.po_date,
    requestedDeliveryDate: data.requested_delivery_date,
    shipToAddress1: data.ship_to_address_1,
    shipToAddress2: data.ship_to_address_2,
    shipToPostalCode: data.ship_to_postal_code,
    shipToCity: data.ship_to_city,
    shipToState: data.ship_to_state,
    shipToStateCode: data.ship_to_state_code,
    shipToCountry: data.ship_to_country,
    shipToPhone: data.ship_to_phone,
    shipToEmail: data.ship_to_email,
    paymentTerms: data.payment_terms,
    trackingNumber: data.tracking_number,
    organizationId: data.organization_id,
    createdBy: data.created_by,
    createdOn: new Date(data.created_on),
    updatedBy: data.updated_by,
    updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    poType: data.po_type, // <-- add this line
    lines: data.lines?.map(line => ({
      ...line,
      lineNumber: line.line_number,
      itemId: line.item_id,
      unitPrice: line.unit_price,
      totalUnitPrice: line.total_unit_price,
      gstPercent: line.gst_percent,
      gstValue: line.gst_value,
      lineTotal: line.line_total,
      receivedQuantity: line.received_quantity,
      itemWeightPerUnit: line.item_weight_per_unit,
      totalLineWeight: line.total_line_weight,
      itemWeightUom: line.item_weight_uom,
      purchaseOrderId: line.purchase_order_id,
      organizationId: line.organization_id,
      createdBy: line.created_by,
      createdOn: line.created_on ? new Date(line.created_on) : undefined,
      updatedBy: line.updated_by,
      updatedOn: line.updated_on ? new Date(line.updated_on) : undefined,
    })),
  } as unknown as PurchaseOrder;
};

export const updatePurchaseOrder = async (
  poId: string,
  data: PurchaseOrderFormData,
  organizationId: string,
  updatedBy: string
): Promise<PurchaseOrder> => {
  const { data: poData, error: poError } = await supabase
    .from('purchase_order')
    .update({
      po_number: data.poNumber,
      division_id: data.divisionId,
      supplier_id: data.supplierId,
      po_date: data.poDate,
      requested_delivery_date: data.requestedDeliveryDate,
      ship_to_address_1: data.shipToAddress1,
      ship_to_address_2: data.shipToAddress2,
      ship_to_postal_code: data.shipToPostalCode,
      ship_to_city: data.shipToCity,
      ship_to_state: data.shipToState,
      ship_to_state_code: data.shipToStateCode,
      ship_to_country: data.shipToCountry,
      ship_to_phone: data.shipToPhone,
      ship_to_email: data.shipToEmail,
      payment_terms: data.paymentTerms,
      notes: data.notes,
      tracking_number: data.trackingNumber,
      updated_by: updatedBy,
      updated_on: new Date().toISOString(),
    })
    .eq('id', poId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (poError || !poData) {
    console.error("Error updating purchase order:", poError);
    throw new Error("Failed to update purchase order");
  }

  // Delete existing lines and insert new ones
  const { error: deleteError } = await supabase
    .from('purchase_order_line')
    .delete()
    .eq('purchase_order_id', poId);

  if (deleteError) {
    console.error("Error deleting existing purchase order lines:", deleteError);
    throw new Error("Failed to delete existing purchase order lines");
  }

  for (const line of data.lines) {
    const { error: lineError } = await supabase
      .from('purchase_order_line')
      .insert([
        {
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
          created_by: updatedBy,
        },
      ]);

    if (lineError) {
      console.error("Error creating purchase order line:", lineError);
      throw new Error("Failed to create purchase order line");
    }
  }

  return {
    ...poData,
    createdOn: new Date(poData.created_on),
    updatedOn: poData.updated_on ? new Date(poData.updated_on) : undefined,
  } as unknown as PurchaseOrder;
};

export const approvePurchaseOrder = async (
  poId: string,
  organizationId: string,
  approvedBy: string,
  approvedByName: string
): Promise<PurchaseOrder> => {
  console.log(`[PO Approve] Starting approval process for PO ${poId}`);

  const { data, error } = await supabase
    .from('purchase_order')
    .update({
      status: 'Approved',
      updated_by: approvedByName,
      updated_on: new Date().toISOString(),
    })
    .eq('id', poId)
    .eq('organization_id', organizationId)
    .select(`
      *,
      lines:purchase_order_line(*),
      supplier:organizations!supplier_id(*),
      division:divisions(*)
    `)
    .single();

  if (error || !data) {
    console.error(`[PO Approve] Error approving PO ${poId}:`, error);
    throw new Error(`Failed to approve purchase order: ${error?.message}`);
  }

  console.log(`[PO Approve] Successfully approved PO ${poId}`);

  return {
    ...data,
    createdOn: new Date(data.created_on),
    updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
  } as unknown as PurchaseOrder;
};

export const cancelPurchaseOrder = async (
  poId: string,
  organizationId: string
): Promise<PurchaseOrder> => {
  console.log(`[PO Cancel] Starting cancellation process for PO ${poId}`);

  const { data, error } = await supabase
    .from('purchase_order')
    .update({
      status: 'Cancelled',
      updated_on: new Date().toISOString(),
    })
    .eq('id', poId)
    .eq('organization_id', organizationId)
    .select(`
      *,
      lines:purchase_order_line(*),
      supplier:organizations!supplier_id(*),
      division:divisions(*)
    `)
    .single();

  if (error || !data) {
    console.error(`[PO Cancel] Error cancelling PO ${poId}:`, error);
    throw new Error(`Failed to cancel purchase order: ${error?.message}`);
  }

  console.log(`[PO Cancel] Successfully cancelled PO ${poId}`);

  return {
    ...data,
    createdOn: new Date(data.created_on),
    updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
  } as unknown as PurchaseOrder;
};

export const purchaseOrderService = {
  generatePONumber,
  getDivisionShippingAddress,
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  receivePurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
};
