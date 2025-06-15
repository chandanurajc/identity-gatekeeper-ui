import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData, POReceiveLineData } from "@/types/purchaseOrder";
import { InventoryStock } from "@/types/inventory";
import { getUserNameById } from "@/lib/userUtils";
import { getPurchaseOrderById } from "./queries";
import { invoiceService } from "@/services/invoiceService";

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
    const lineData = formData.lines.map(line => ({
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
      organization_id: organizationId,
      created_by: createdByUsername
    }));

    console.log("[PO] Inserting PO lines:", lineData);

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
      ship_to_country: formData.shipToCountry,
      ship_to_phone: formData.shipToPhone,
      ship_to_email: formData.shipToEmail,
      payment_terms: formData.paymentTerms,
      notes: formData.notes,
      tracking_number: formData.trackingNumber,
      updated_by: updatedByUsername,
      updated_on: new Date().toISOString()
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

  // Create new purchase order lines
  if (formData.lines.length > 0) {
    const lineData = formData.lines.map(line => ({
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
      organization_id: organizationId,
      created_by: updatedByUsername // Should this be the original creator or updater? Using updater for now.
    }));

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

export async function cancelPurchaseOrder(id: string, userId: string): Promise<void> {
  const updatedByUsername = await getUserNameById(userId);

  const { error } = await supabase
    .from('purchase_order')
    .update({ 
      status: 'Cancelled',
      updated_by: updatedByUsername,
      updated_on: new Date().toISOString()
    })
    .eq('id', id)
    .eq('status', 'Created');

  if (error) {
    console.error("Error cancelling purchase order:", error);
    throw new Error(`Failed to cancel purchase order: ${error.message}`);
  }
}

export async function receivePurchaseOrder(
  poId: string,
  linesToReceive: POReceiveLineData[],
  organizationId: string,
  userId: string
): Promise<void> {
  console.log("Starting PO Receive process for PO:", poId);

  const po = await getPurchaseOrderById(poId);
  if (!po) {
    throw new Error("Purchase Order not found.");
  }

  // 1. Validation
  for (const line of linesToReceive) {
    if (line.quantityToReceive > 0) {
      const poLine = po.lines?.find(l => l.id === line.purchaseOrderLineId);
      if (!poLine) {
        throw new Error(`Line item ${line.itemId} not found on PO.`);
      }
      const remainingQty = poLine.quantity - (poLine.receivedQuantity || 0);
      if (line.quantityToReceive > remainingQty) {
        throw new Error(`Quantity to receive for item ${line.itemId} exceeds remaining quantity.`);
      }
    }
  }

  const receiveTransactions = [];
  const inventoryStockEntries = [];
  const lineUpdates = [];

  const createdByUsername = await getUserNameById(userId);

  // 2. Prepare DB operations
  for (const line of linesToReceive) {
    if (line.quantityToReceive > 0) {
      // a. PO Receive Transaction
      receiveTransactions.push({
        organization_id: organizationId,
        purchase_order_id: poId,
        purchase_order_line_id: line.purchaseOrderLineId,
        item_id: line.itemId,
        quantity_received: line.quantityToReceive,
        uom: line.uom,
        received_by: userId,
      });

      // b. Inventory Stock Transaction
      inventoryStockEntries.push({
        organization_id: organizationId,
        item_id: line.itemId,
        division_id: po.divisionId,
        quantity: line.quantityToReceive,
        uom: line.uom,
        transaction_type: 'PO_RECEIVE',
        reference_number: po.poNumber,
        created_by: createdByUsername,
      });

      // c. PO Line Update
      const poLine = po.lines?.find(l => l.id === line.purchaseOrderLineId);
      const newReceivedQty = (poLine?.receivedQuantity || 0) + line.quantityToReceive;
      lineUpdates.push(
        supabase
          .from('purchase_order_line')
          .update({ received_quantity: newReceivedQty, updated_by: createdByUsername, updated_on: new Date().toISOString() })
          .eq('id', line.purchaseOrderLineId)
      );
    }
  }

  // 3. Execute DB operations
  if (receiveTransactions.length > 0) {
    const { error: receiveError } = await supabase.from('po_receive_transaction').insert(receiveTransactions);
    if (receiveError) {
      console.error("Error creating PO receive transactions:", receiveError);
      throw new Error(`Failed to create PO receive transactions: ${receiveError.message}`);
    }
  }

  if (inventoryStockEntries.length > 0) {
    const { error: stockError } = await supabase.from('inventory_stock').insert(inventoryStockEntries);
    if (stockError) {
      console.error("Error creating inventory stock entries:", stockError);
      // Here we should ideally roll back the receive transactions
      throw new Error(`Failed to create inventory stock entries: ${stockError.message}`);
    }
  }

  if (lineUpdates.length > 0) {
    const results = await Promise.all(lineUpdates);
    const updateError = results.find(res => res.error);
    if (updateError) {
      console.error("Error updating PO lines:", updateError.error);
      throw new Error(`Failed to update PO lines: ${updateError.error.message}`);
    }
  }

  // 4. Update PO Status
  const updatedPO = await getPurchaseOrderById(poId);
  if (!updatedPO?.lines) {
    throw new Error("Could not refetch PO to update status.");
  }
  
  const allLinesFullyReceived = updatedPO.lines.every(line => (line.receivedQuantity || 0) >= line.quantity);
  const anyLinePartiallyReceived = updatedPO.lines.some(line => (line.receivedQuantity || 0) > 0);

  let newStatus: PurchaseOrder['status'] = po.status;
  if (allLinesFullyReceived) {
    newStatus = 'Received';
  } else if (anyLinePartiallyReceived) {
    newStatus = 'Partially Received';
  }

  if (newStatus !== po.status) {
    const updatedByUsername = await getUserNameById(userId);
    const { error: poStatusError } = await supabase
      .from('purchase_order')
      .update({ status: newStatus, updated_by: updatedByUsername, updated_on: new Date().toISOString() })
      .eq('id', poId);

    if (poStatusError) {
      console.error("Error updating PO status:", poStatusError);
      throw new Error(`Failed to update PO status: ${poStatusError.message}`);
    }

    if (newStatus === 'Received') {
      try {
        console.log(`[PO Receive] PO ${poId} is fully received. Triggering invoice creation...`);
        await invoiceService.createInvoiceFromReceivedPO(poId, organizationId, userId, updatedByUsername);
        console.log(`[PO Receive] Successfully triggered invoice creation for PO ${poId}`);
      } catch (invoiceError: any) {
        // Log the error but don't fail the entire receive process, as the items are already in stock.
        // This could be enhanced with a retry mechanism or a background job queue.
        console.error(`[PO Receive] Failed to create invoice for PO ${poId}. This may need to be done manually. Error:`, invoiceError.message);
        // We could potentially throw a specific warning to be caught by the UI here.
      }
    }
  }

  console.log("PO Receive process completed for PO:", poId);
}
