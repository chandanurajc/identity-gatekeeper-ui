import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, POReceiveLineData } from "@/types/purchaseOrder";
import { getUserNameById } from "@/lib/userUtils";
import { getPurchaseOrderById } from "./queries";
import { invoiceService } from "../invoiceService";

export async function receivePurchaseOrder(
  poId: string,
  linesToReceive: POReceiveLineData[],
  organizationId: string,
  userId: string
): Promise<{ warning?: string }> {
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
  
  console.log("Checking PO lines for status update:", updatedPO.lines.map(l => ({ 
    id: l.id, 
    qty: l.quantity, 
    received: l.receivedQuantity 
  })));
  
  const allLinesFullyReceived = updatedPO.lines.every(line => (line.receivedQuantity || 0) >= line.quantity);
  const anyLinePartiallyReceived = updatedPO.lines.some(line => (line.receivedQuantity || 0) > 0);

  console.log({ allLinesFullyReceived, anyLinePartiallyReceived });

  let newStatus: PurchaseOrder['status'] = po.status;
  if (allLinesFullyReceived) {
    newStatus = 'Received';
  } else if (anyLinePartiallyReceived) {
    newStatus = 'Partially Received';
  }

  console.log(`PO status determined as: ${newStatus}. Original status: ${po.status}`);

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
        return { warning: `PO received successfully, but automated invoice creation failed. Please create it manually. Error: ${invoiceError.message}` };
      }
    }
  }

  console.log("PO Receive process completed for PO:", poId);
  return {};
}
