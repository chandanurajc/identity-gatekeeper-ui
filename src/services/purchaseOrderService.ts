import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderLine } from "@/types/purchaseOrder";

export const purchaseOrderService = {
  async getAllPurchaseOrders(organizationId: string): Promise<PurchaseOrder[]> {
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

    return data?.map(po => ({
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
      createdBy: po.created_by,
      createdOn: new Date(po.created_on),
      updatedBy: po.updated_by,
      updatedOn: po.updated_on ? new Date(po.updated_on) : undefined,
      division: po.division,
      supplier: po.supplier
    })) || [];
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
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
      createdBy: data.created_by,
      createdOn: new Date(data.created_on),
      updatedBy: data.updated_by,
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
  },

  async createPurchaseOrder(formData: PurchaseOrderFormData, organizationId: string, userId: string): Promise<PurchaseOrder> {
    const poDate = formData.poDate;
    if (!poDate) {
      throw new Error("PO Date is required.");
    }

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
      created_by: userId
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
        created_by: userId
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
  },

  async updatePurchaseOrder(id: string, formData: PurchaseOrderFormData, organizationId: string, userId: string): Promise<PurchaseOrder> {
    const poDate = formData.poDate;
    if (!poDate) {
      throw new Error("[PO] Invalid PO Date provided for update.");
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
        ship_to_country: formData.shipToCountry,
        ship_to_phone: formData.shipToPhone,
        ship_to_email: formData.shipToEmail,
        payment_terms: formData.paymentTerms,
        notes: formData.notes,
        tracking_number: formData.trackingNumber,
        updated_by: userId,
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
        created_by: userId
      }));

      const { error: lineError } = await supabase
        .from('purchase_order_line')
        .insert(lineData);

      if (lineError) {
        console.error("Error creating purchase order lines:", lineError);
        throw new Error(`Failed to create purchase order lines: ${lineError.message}`);
      }
    }

    return await this.getPurchaseOrderById(id) as PurchaseOrder;
  },

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

  async getDivisionShippingAddress(divisionId: string): Promise<any> {
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
};
