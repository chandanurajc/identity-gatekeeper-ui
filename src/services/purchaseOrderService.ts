import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData, ShippingAddress, POReceiveLineData } from "@/types/purchaseOrder";

export const purchaseOrderService = {
  async generatePONumber(): Promise<string> {
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
  },

  async getDivisionShippingAddress(divisionId: string): Promise<ShippingAddress | null> {
    console.log("Fetching division shipping address for division:", divisionId);
    
    try {
      const { data, error } = await supabase
        .from('division_contacts')
        .select('*')
        .eq('division_id', divisionId)
        .eq('contact_type', 'Registered location')
        .maybeSingle();

      if (error) {
        console.error("Error fetching division address:", error);
        throw new Error(`Failed to fetch division address: ${error.message}`);
      }

      if (!data) {
        console.log("No registered location contact found for division");
        return null;
      }

      return {
        address1: data.address1 || "",
        address2: data.address2 || "",
        postalCode: data.postal_code || "",
        city: data.city || "",
        state: data.state || "",
        stateCode: data.state_code || null,
        country: data.country || "",
        phoneNumber: data.phone_number || "",
        email: data.email || ""
      };
    } catch (error) {
      console.error("Service error fetching division address:", error);
      throw error;
    }
  },

  async createPurchaseOrder(data: PurchaseOrderFormData, organizationId: string, createdBy: string): Promise<PurchaseOrder> {
    console.log("Creating purchase order with data:", data);
    
    try {
      // Create the purchase order with state code
      const poData = {
        organization_id: organizationId,
        po_number: data.poNumber,
        division_id: data.divisionId,
        supplier_id: data.supplierId,
        po_date: data.poDate,
        requested_delivery_date: data.requestedDeliveryDate || null,
        ship_to_address_1: data.shipToAddress1,
        ship_to_address_2: data.shipToAddress2,
        ship_to_postal_code: data.shipToPostalCode,
        ship_to_city: data.shipToCity,
        ship_to_state: data.shipToState,
        ship_to_state_code: data.shipToStateCode || null,
        ship_to_country: data.shipToCountry,
        ship_to_phone: data.shipToPhone,
        ship_to_email: data.shipToEmail,
        payment_terms: data.paymentTerms,
        notes: data.notes,
        tracking_number: data.trackingNumber,
        status: 'Created',
        created_by: createdBy,
        updated_by: createdBy,
      };

      console.log("PO data to insert with state code:", poData);

      const { data: purchaseOrderData, error: poError } = await supabase
        .from('purchase_order')
        .insert(poData)
        .select()
        .single();

      if (poError) {
        console.error("Error creating purchase order:", poError);
        throw new Error(`Failed to create purchase order: ${poError.message}`);
      }

      // Create purchase order lines
      if (data.lines && data.lines.length > 0) {
        const lineData = data.lines.map(line => ({
          purchase_order_id: purchaseOrderData.id,
          organization_id: organizationId,
          line_number: line.lineNumber,
          item_id: line.itemId,
          quantity: line.quantity,
          uom: line.uom,
          unit_price: line.unitPrice,
          total_unit_price: line.totalUnitPrice,
          gst_percent: line.gstPercent,
          gst_value: line.gstValue,
          line_total: line.lineTotal,
          item_weight_per_unit: line.itemWeightPerUnit || 0,
          item_weight_uom: line.itemWeightUom || 'kg',
          total_line_weight: line.totalLineWeight || 0,
          created_by: createdBy,
          updated_by: createdBy,
        }));

        const { error: lineError } = await supabase
          .from('purchase_order_line')
          .insert(lineData);

        if (lineError) {
          console.error("Error creating purchase order lines:", lineError);
          throw new Error(`Failed to create purchase order lines: ${lineError.message}`);
        }
      }

      console.log("Purchase order created successfully:", purchaseOrderData);
      
      return {
        id: purchaseOrderData.id,
        poNumber: purchaseOrderData.po_number,
        divisionId: purchaseOrderData.division_id,
        supplierId: purchaseOrderData.supplier_id,
        poDate: purchaseOrderData.po_date,
        requestedDeliveryDate: purchaseOrderData.requested_delivery_date,
        shipToAddress1: purchaseOrderData.ship_to_address_1,
        shipToAddress2: purchaseOrderData.ship_to_address_2,
        shipToPostalCode: purchaseOrderData.ship_to_postal_code,
        shipToCity: purchaseOrderData.ship_to_city,
        shipToState: purchaseOrderData.ship_to_state,
        shipToStateCode: purchaseOrderData.ship_to_state_code,
        shipToCountry: purchaseOrderData.ship_to_country,
        shipToPhone: purchaseOrderData.ship_to_phone,
        shipToEmail: purchaseOrderData.ship_to_email,
        paymentTerms: purchaseOrderData.payment_terms,
        notes: purchaseOrderData.notes,
        trackingNumber: purchaseOrderData.tracking_number,
        status: purchaseOrderData.status as PurchaseOrder['status'],
        organizationId: purchaseOrderData.organization_id,
        createdBy: purchaseOrderData.created_by,
        createdOn: new Date(purchaseOrderData.created_on),
        updatedBy: purchaseOrderData.updated_by,
        updatedOn: purchaseOrderData.updated_on ? new Date(purchaseOrderData.updated_on) : undefined,
        lines: data.lines
      };
    } catch (error) {
      console.error("Service error creating purchase order:", error);
      throw error;
    }
  },

  async getAllPurchaseOrders(organizationId: string): Promise<PurchaseOrder[]> {
    console.log("Fetching all purchase orders for organization:", organizationId);
    
    try {
      const { data, error } = await supabase
        .from('purchase_order')
        .select(`
          *,
          divisions:division_id(id, name, code),
          supplier_org:organizations!purchase_order_supplier_id_fkey(id, name, code)
        `)
        .eq('organization_id', organizationId)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Error fetching purchase orders:", error);
        throw new Error(`Failed to fetch purchase orders: ${error.message}`);
      }

      return (data || []).map(po => ({
        id: po.id,
        poNumber: po.po_number,
        divisionId: po.division_id,
        supplierId: po.supplier_id,
        poDate: po.po_date,
        requestedDeliveryDate: po.requested_delivery_date,
        shipToAddress1: po.ship_to_address_1,
        shipToAddress2: po.ship_to_address_2,
        shipToPostalCode: po.ship_to_postal_code,
        shipToCity: po.ship_to_city,
        shipToState: po.ship_to_state,
        shipToStateCode: po.ship_to_state_code,
        shipToCountry: po.ship_to_country,
        shipToPhone: po.ship_to_phone,
        shipToEmail: po.ship_to_email,
        paymentTerms: po.payment_terms,
        notes: po.notes,
        trackingNumber: po.tracking_number,
        status: po.status as PurchaseOrder['status'],
        organizationId: po.organization_id,
        createdBy: po.created_by,
        createdOn: new Date(po.created_on),
        updatedBy: po.updated_by,
        updatedOn: po.updated_on ? new Date(po.updated_on) : undefined,
        division: po.divisions ? { name: po.divisions.name, code: po.divisions.code } : undefined,
        supplier: po.supplier_org ? { name: po.supplier_org.name, code: po.supplier_org.code } : undefined
      }));
    } catch (error) {
      console.error("Service error fetching purchase orders:", error);
      throw error;
    }
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    console.log("Fetching purchase order by ID:", id);
    
    try {
      const { data, error } = await supabase
        .from('purchase_order')
        .select(`
          *,
          divisions:division_id(id, name, code),
          supplier_org:organizations!purchase_order_supplier_id_fkey(id, name, code),
          purchase_order_line(
            *,
            items:item_id(id, description, classification, sub_classification, weight, weight_uom, item_group_id, item_groups:item_group_id(name, classification, sub_classification))
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching purchase order:", error);
        throw new Error(`Failed to fetch purchase order: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
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
        notes: data.notes,
        trackingNumber: data.tracking_number,
        status: data.status as PurchaseOrder['status'],
        organizationId: data.organization_id,
        createdBy: data.created_by,
        createdOn: new Date(data.created_on),
        updatedBy: data.updated_by,
        updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
        division: data.divisions ? { name: data.divisions.name, code: data.divisions.code } : undefined,
        supplier: data.supplier_org ? { name: data.supplier_org.name } : undefined,
        lines: (data.purchase_order_line || []).map(line => ({
          id: line.id,
          purchaseOrderId: line.purchase_order_id,
          lineNumber: line.line_number,
          itemId: line.item_id,
          quantity: line.quantity,
          receivedQuantity: line.received_quantity,
          uom: line.uom,
          unitPrice: line.unit_price,
          totalUnitPrice: line.total_unit_price,
          gstPercent: line.gst_percent,
          gstValue: line.gst_value,
          lineTotal: line.line_total,
          itemWeightPerUnit: line.item_weight_per_unit,
          itemWeightUom: line.item_weight_uom,
          totalLineWeight: line.total_line_weight,
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
            weight: line.items.weight,
            weightUom: line.items.weight_uom,
            itemGroupId: line.items.item_group_id,
            itemGroup: line.items.item_groups ? {
              name: line.items.item_groups.name,
              classification: line.items.item_groups.classification,
              subClassification: line.items.item_groups.sub_classification
            } : undefined
          } : undefined
        }))
      };
    } catch (error) {
      console.error("Service error fetching purchase order:", error);
      throw error;
    }
  },

  async updatePurchaseOrder(id: string, data: PurchaseOrderFormData, organizationId: string, updatedBy: string): Promise<PurchaseOrder> {
    console.log("Updating purchase order:", id);
    
    try {
      const updateData = {
        po_number: data.poNumber,
        division_id: data.divisionId,
        supplier_id: data.supplierId,
        po_date: data.poDate,
        requested_delivery_date: data.requestedDeliveryDate || null,
        ship_to_address_1: data.shipToAddress1,
        ship_to_address_2: data.shipToAddress2,
        ship_to_postal_code: data.shipToPostalCode,
        ship_to_city: data.shipToCity,
        ship_to_state: data.shipToState,
        ship_to_state_code: data.shipToStateCode || null,
        ship_to_country: data.shipToCountry,
        ship_to_phone: data.shipToPhone,
        ship_to_email: data.shipToEmail,
        payment_terms: data.paymentTerms,
        notes: data.notes,
        tracking_number: data.trackingNumber,
        updated_by: updatedBy,
        updated_on: new Date().toISOString(),
      };

      const { data: purchaseOrderData, error: poError } = await supabase
        .from('purchase_order')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (poError) {
        console.error("Error updating purchase order:", poError);
        throw new Error(`Failed to update purchase order: ${poError.message}`);
      }

      return {
        id: purchaseOrderData.id,
        poNumber: purchaseOrderData.po_number,
        divisionId: purchaseOrderData.division_id,
        supplierId: purchaseOrderData.supplier_id,
        poDate: purchaseOrderData.po_date,
        requestedDeliveryDate: purchaseOrderData.requested_delivery_date,
        shipToAddress1: purchaseOrderData.ship_to_address_1,
        shipToAddress2: purchaseOrderData.ship_to_address_2,
        shipToPostalCode: purchaseOrderData.ship_to_postal_code,
        shipToCity: purchaseOrderData.ship_to_city,
        shipToState: purchaseOrderData.ship_to_state,
        shipToStateCode: purchaseOrderData.ship_to_state_code,
        shipToCountry: purchaseOrderData.ship_to_country,
        shipToPhone: purchaseOrderData.ship_to_phone,
        shipToEmail: purchaseOrderData.ship_to_email,
        paymentTerms: purchaseOrderData.payment_terms,
        notes: purchaseOrderData.notes,
        trackingNumber: purchaseOrderData.tracking_number,
        status: purchaseOrderData.status as PurchaseOrder['status'],
        organizationId: purchaseOrderData.organization_id,
        createdBy: purchaseOrderData.created_by,
        createdOn: new Date(purchaseOrderData.created_on),
        updatedBy: purchaseOrderData.updated_by,
        updatedOn: purchaseOrderData.updated_on ? new Date(purchaseOrderData.updated_on) : undefined,
        lines: data.lines
      };
    } catch (error) {
      console.error("Service error updating purchase order:", error);
      throw error;
    }
  },

  async cancelPurchaseOrder(id: string, userId: string): Promise<void> {
    console.log("Cancelling purchase order:", id);
    
    try {
      const { error } = await supabase
        .from('purchase_order')
        .update({ 
          status: 'Cancelled',
          updated_by: userId,
          updated_on: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'Created');

      if (error) {
        console.error("Error cancelling purchase order:", error);
        throw new Error(`Failed to cancel purchase order: ${error.message}`);
      }
    } catch (error) {
      console.error("Service error cancelling purchase order:", error);
      throw error;
    }
  },

  async receivePurchaseOrder(poId: string, linesToReceive: POReceiveLineData[], organizationId: string, userId: string): Promise<{ warning?: string }> {
    console.log("Receiving purchase order:", poId);
    
    try {
      // Create receive transactions
      const receiveTransactions = linesToReceive.map(line => ({
        organization_id: organizationId,
        purchase_order_id: poId,
        purchase_order_line_id: line.purchaseOrderLineId,
        item_id: line.itemId,
        quantity_received: line.quantityToReceive,
        uom: line.uom,
        received_by: userId,
      }));

      const { error: receiveError } = await supabase
        .from('po_receive_transaction')
        .insert(receiveTransactions);

      if (receiveError) {
        console.error("Error creating receive transactions:", receiveError);
        throw new Error(`Failed to create receive transactions: ${receiveError.message}`);
      }

      // Update received quantities on purchase order lines
      for (const line of linesToReceive) {
        const { error: updateError } = await supabase
          .from('purchase_order_line')
          .update({
            received_quantity: line.totalReceivedQuantity + line.quantityToReceive
          })
          .eq('id', line.purchaseOrderLineId);

        if (updateError) {
          console.error("Error updating line received quantity:", updateError);
          throw new Error(`Failed to update line received quantity: ${updateError.message}`);
        }
      }

      // Check if PO is fully received and update status
      const { data: poLines, error: linesError } = await supabase
        .from('purchase_order_line')
        .select('quantity, received_quantity')
        .eq('purchase_order_id', poId);

      if (linesError) {
        console.error("Error fetching PO lines for status update:", linesError);
        throw new Error(`Failed to fetch PO lines: ${linesError.message}`);
      }

      const allFullyReceived = poLines?.every(line => line.received_quantity >= line.quantity);
      const anyPartiallyReceived = poLines?.some(line => line.received_quantity > 0);

      let newStatus = 'Created';
      if (allFullyReceived) {
        newStatus = 'Received';
      } else if (anyPartiallyReceived) {
        newStatus = 'Partially Received';
      }

      const { error: statusError } = await supabase
        .from('purchase_order')
        .update({
          status: newStatus,
          updated_by: userId,
          updated_on: new Date().toISOString()
        })
        .eq('id', poId);

      if (statusError) {
        console.error("Error updating PO status:", statusError);
        throw new Error(`Failed to update PO status: ${statusError.message}`);
      }

      return {};
    } catch (error) {
      console.error("Service error receiving purchase order:", error);
      throw error;
    }
  }
};
