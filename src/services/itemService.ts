
import { supabase } from "@/integrations/supabase/client";
import { Item, ItemFormData } from "@/types/item";

export const itemService = {
  async getItems(): Promise<Item[]> {
    console.log("Fetching items from Supabase...");
    
    try {
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        console.log("No organization found for user");
        return [];
      }

      // Fetch items with costs as a nested select
      const { data, error } = await supabase
        .from('items')
        .select(`*, item_costs: item_costs(*)`)
        .eq('organization_id', profile.organization_id)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching items:", error);
        throw new Error(`Failed to fetch items: ${error.message}`);
      }

      if (!data) {
        console.log("No items data returned");
        return [];
      }

      // Map costs to ItemCost[]
      const transformedData = data.map(item => ({
        id: item.id,
        description: item.description,
        itemGroupId: item.item_group_id,
        classification: item.classification,
        subClassification: item.sub_classification,
        status: item.status as 'active' | 'inactive',
        barcode: item.barcode,
        gstPercentage: item.gst_percentage || 0,
        uom: item.uom || 'Unit',
        length: item.length,
        width: item.width,
        height: item.height,
        weight: item.weight,
        organizationId: item.organization_id,
        createdBy: item.created_by,
        createdOn: new Date(item.created_on),
        updatedBy: item.updated_by,
        updatedOn: item.updated_on ? new Date(item.updated_on) : undefined,
        costs: (item.item_costs || []).map((cost: any) => ({
          id: cost.id,
          itemId: cost.item_id,
          supplierId: cost.supplier_id || "",
          supplierName: cost.supplier_id ? undefined : 'Default Cost',
          cost: cost.price, // Using 'price' column from DB
          organizationId: cost.organization_id,
          createdBy: cost.created_by,
          createdOn: cost.created_on ? new Date(cost.created_on) : undefined,
          updatedBy: cost.updated_by,
          updatedOn: cost.updated_on ? new Date(cost.updated_on) : undefined,
        })),
      }));

      return transformedData;
    } catch (error) {
      console.error("Service error fetching items:", error);
      throw error;
    }
  },

  async generateItemId(): Promise<string> {
    console.log("ItemService: Starting generateItemId...");
    
    // Generate a 5-digit numerical ID
    const randomId = Math.floor(10000 + Math.random() * 90000).toString();
    console.log("ItemService: Generated potential ID:", randomId);
    
    // Check if ID already exists
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .eq('id', randomId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("ItemService: Error checking existing ID:", error);
      throw error;
    }
    
    // If exists, generate another one recursively
    if (data) {
      console.log("ItemService: ID already exists, generating new one...");
      return this.generateItemId();
    }
    
    console.log("ItemService: Final generated ID:", randomId);
    return randomId;
  },

  async generateGTIN14(itemId: string, organizationId: string): Promise<string> {
    console.log("ItemService: Generating GTIN-14 for item:", itemId, "organization:", organizationId);
    
    try {
      // Get GS1 Company code from organization references - use array query and handle multiple results
      console.log("ItemService: Fetching GS1 code for organization:", organizationId);
      
      const { data: orgRefList, error: refError } = await supabase
        .from('organization_references')
        .select('reference_value')
        .eq('organization_id', organizationId)
        .eq('reference_type', 'GS1Code'); // Note: using 'GS1Code' as per the database

      console.log("ItemService: Organization reference query result:", orgRefList, "Error:", refError);

      if (refError) {
        console.error("ItemService: Database error fetching GS1 code:", refError);
        throw new Error(`Failed to fetch GS1 code: ${refError.message}`);
      }

      if (!orgRefList || orgRefList.length === 0) {
        throw new Error("No GS1 Company code found for organization. Please configure GS1 code in organization references.");
      }

      // If multiple GS1 codes exist, use the first one
      const gs1Code = orgRefList[0].reference_value;
      if (!gs1Code) {
        throw new Error("GS1 Company code is empty. Please configure a valid GS1 code in organization references.");
      }

      console.log("ItemService: Found GS1 Company code:", gs1Code);
      
      // Use the actual GS1 company code (should be 7 digits)
      const companyPrefix = gs1Code.padStart(7, '0').substring(0, 7);
      const packagingIndicator = '0';
      const itemReference = itemId.padStart(5, '0');
      
      // Create the 13 digits without check digit
      const partial = packagingIndicator + companyPrefix + itemReference;
      console.log("ItemService: Partial GTIN (without check digit):", partial);
      
      // Calculate check digit using GTIN-14 algorithm
      let sum = 0;
      for (let i = 0; i < partial.length; i++) {
        const digit = parseInt(partial[i]);
        // Multiply by 3 for odd positions (1st, 3rd, 5th... from left), by 1 for even positions
        const multiplier = (i % 2 === 0) ? 3 : 1;
        sum += digit * multiplier;
      }
      
      const checkDigit = (10 - (sum % 10)) % 10;
      const gtin14 = partial + checkDigit.toString();
      
      console.log("ItemService: Generated GTIN-14 with GS1 code:", gtin14);
      return gtin14;
      
    } catch (error) {
      console.error("ItemService: Error generating GTIN-14:", error);
      throw error;
    }
  },

  async createItem(formData: ItemFormData, createdBy: string): Promise<void> {
    console.log("ItemService: Starting createItem...");
    
    try {
      // Get current user's organization
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error("No organization found for user");
      }

      // Generate item ID if not provided
      let itemId = formData.id;
      if (!itemId) {
        itemId = await this.generateItemId();
      }

      // Generate barcode if not provided
      let barcode = formData.barcode;
      if (!barcode) {
        barcode = await this.generateGTIN14(itemId, profile.organization_id);
      }

      // Insert main item record
      const itemInsert = {
        id: itemId,
        description: formData.description,
        item_group_id: formData.itemGroupId || null,
        classification: formData.classification,
        sub_classification: formData.subClassification,
        status: formData.status,
        barcode: barcode,
        gst_percentage: formData.gstPercentage,
        uom: formData.uom,
        length: formData.length || null,
        width: formData.width || null,
        height: formData.height || null,
        weight: formData.weight || null,
        organization_id: profile.organization_id,
        created_by: createdBy,
        updated_by: createdBy,
      };
      
      const { error: itemError } = await supabase
        .from('items')
        .insert(itemInsert);

      if (itemError) {
        throw new Error(`Failed to create item: ${itemError.message}`);
      }

      // Insert item costs - handle null/empty supplier IDs
      if (formData.costs && formData.costs.length > 0) {
        const costInserts = formData.costs
          .filter(cost => cost.cost !== undefined && cost.cost !== null && cost.cost > 0)
          .map(cost => ({
            item_id: itemId,
            supplier_id: cost.supplierId || null, // Allow null for default costs
            price: cost.cost, // Using 'price' column as per DB schema
            organization_id: profile.organization_id,
            created_by: createdBy,
            updated_by: createdBy,
          }));

        if (costInserts.length > 0) {
          const { error: costError } = await supabase
            .from('item_costs')
            .insert(costInserts);

          if (costError) {
            throw new Error(`Failed to create item costs: ${costError.message}`);
          }
        }
      }

      // Insert item prices using the item_prices table directly
      if (formData.prices && formData.prices.length > 0) {
        const priceInserts = formData.prices
          .filter(price => price.price !== undefined && price.price !== null && price.price > 0)
          .map(price => ({
            item_id: itemId,
            sales_channel_id: price.salesChannelId || null,
            price: price.price,
            organization_id: profile.organization_id,
            created_by: createdBy,
            updated_by: createdBy,
          }));

        if (priceInserts.length > 0) {
          const { error: priceError } = await supabase
            .from('item_prices')
            .insert(priceInserts);

          if (priceError) {
            throw new Error(`Failed to create item prices: ${priceError.message}`);
          }
        }
      }

      console.log("ItemService: Item creation completed successfully");
      
    } catch (error) {
      console.error("ItemService: Service error creating item:", error);
      throw error;
    }
  },

  async updateItem(itemId: string, formData: ItemFormData, updatedBy: string): Promise<void> {
    console.log("Updating item:", { itemId, formData, updatedBy });
    
    try {
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error("No organization found for user");
      }

      // Generate barcode if not provided
      let barcode = formData.barcode;
      if (!barcode) {
        barcode = await this.generateGTIN14(itemId, profile.organization_id);
      }

      // Update main item record
      const { error: itemError } = await supabase
        .from('items')
        .update({
          description: formData.description,
          item_group_id: formData.itemGroupId,
          classification: formData.classification,
          sub_classification: formData.subClassification,
          status: formData.status,
          barcode: barcode,
          gst_percentage: formData.gstPercentage,
          uom: formData.uom,
          length: formData.length,
          width: formData.width,
          height: formData.height,
          weight: formData.weight,
          updated_by: updatedBy,
          updated_on: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (itemError) {
        throw new Error(`Failed to update item: ${itemError.message}`);
      }

      // Delete existing costs and recreate them
      await supabase.from('item_costs').delete().eq('item_id', itemId);

      // Insert new costs
      if (formData.costs && formData.costs.length > 0) {
        const costInserts = formData.costs
          .filter(cost => cost.cost !== undefined && cost.cost !== null && cost.cost > 0)
          .map(cost => ({
            item_id: itemId,
            supplier_id: cost.supplierId || null,
            price: cost.cost,
            organization_id: profile.organization_id,
            created_by: updatedBy,
            updated_by: updatedBy,
          }));

        if (costInserts.length > 0) {
          const { error: costError } = await supabase
            .from('item_costs')
            .insert(costInserts);

          if (costError) {
            throw new Error(`Failed to update item costs: ${costError.message}`);
          }
        }
      }

      // Delete existing prices and recreate them
      await supabase.from('item_prices').delete().eq('item_id', itemId);

      // Insert new prices
      if (formData.prices && formData.prices.length > 0) {
        const priceInserts = formData.prices
          .filter(price => price.price !== undefined && price.price !== null && price.price > 0)
          .map(price => ({
            item_id: itemId,
            sales_channel_id: price.salesChannelId || null,
            price: price.price,
            organization_id: profile.organization_id,
            created_by: updatedBy,
            updated_by: updatedBy,
          }));

        if (priceInserts.length > 0) {
          const { error: priceError } = await supabase
            .from('item_prices')
            .insert(priceInserts);

          if (priceError) {
            throw new Error(`Failed to update item prices: ${priceError.message}`);
          }
        }
      }

      console.log("Item updated successfully");
      
    } catch (error) {
      console.error("Service error updating item:", error);
      throw error;
    }
  },

  async getItemById(itemId: string): Promise<Item | null> {
    console.log("Fetching item by ID:", itemId);
    
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (itemError || !itemData) {
        console.error("Error fetching item:", itemError);
        return null;
      }

      // Fetch costs with supplier details
      const { data: costsData } = await supabase
        .from('item_costs')
        .select(`
          *,
          organizations!supplier_id (
            name,
            code
          )
        `)
        .eq('item_id', itemId);

      // Fetch prices with sales channel details
      const { data: pricesData } = await supabase
        .from('item_prices')
        .select(`
          *,
          sales_channels (
            name
          )
        `)
        .eq('item_id', itemId);

      const item: Item = {
        id: itemData.id,
        description: itemData.description,
        itemGroupId: itemData.item_group_id,
        classification: itemData.classification,
        subClassification: itemData.sub_classification,
        status: itemData.status as 'active' | 'inactive',
        barcode: itemData.barcode,
        gstPercentage: itemData.gst_percentage || 0,
        uom: itemData.uom || 'Unit',
        length: itemData.length,
        width: itemData.width,
        height: itemData.height,
        weight: itemData.weight,
        organizationId: itemData.organization_id,
        createdBy: itemData.created_by,
        createdOn: new Date(itemData.created_on),
        updatedBy: itemData.updated_by,
        updatedOn: itemData.updated_on ? new Date(itemData.updated_on) : undefined,
        costs: costsData?.map(cost => ({
          id: cost.id,
          itemId: cost.item_id,
          supplierId: cost.supplier_id || "",
          supplierName: cost.organizations?.name || (cost.supplier_id ? 'Unknown Supplier' : 'Default Cost'),
          cost: cost.price, // Using 'price' column from DB
          organizationId: cost.organization_id,
          createdBy: cost.created_by,
          createdOn: new Date(cost.created_on),
          updatedBy: cost.updated_by,
          updatedOn: cost.updated_on ? new Date(cost.updated_on) : undefined,
        })) || [],
        prices: pricesData?.map((price: any) => ({
          id: price.id,
          itemId: price.item_id,
          salesChannelId: price.sales_channel_id || "",
          salesChannelName: price.sales_channels?.name || (price.sales_channel_id ? 'Unknown Channel' : 'Default Price'),
          price: price.price,
          organizationId: price.organization_id,
          createdBy: price.created_by,
          createdOn: new Date(price.created_on),
          updatedBy: price.updated_by,
          updatedOn: price.updated_on ? new Date(price.updated_on) : undefined,
        })) || [],
      };

      console.log("Item fetched successfully:", item);
      return item;
      
    } catch (error) {
      console.error("Service error fetching item:", error);
      throw error;
    }
  }
};
