
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData, ShippingAddress } from "@/types/purchaseOrder";

export const purchaseOrderService = {
  async generatePONumber(): Promise<string> {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${timestamp}-${randomSuffix}`;
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
        postal_code: data.postal_code || "",
        city: data.city || "",
        state: data.state || "",
        state_code: data.state_code || null,
        country: data.country || "",
        phone_number: data.phone_number || "",
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
  }
};
