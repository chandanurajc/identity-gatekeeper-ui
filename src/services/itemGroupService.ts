
import { supabase } from "@/integrations/supabase/client";
import { ItemGroup, ItemGroupFormData } from "@/types/itemGroup";

export const itemGroupService = {
  async getItemGroups(): Promise<ItemGroup[]> {
    console.log("Fetching item groups from Supabase...");
    
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

      const { data, error } = await supabase
        .from('item_groups')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching item groups:", error);
        throw new Error(`Failed to fetch item groups: ${error.message}`);
      }

      console.log("Raw item groups data from Supabase:", data);
      
      if (!data) {
        console.log("No item groups data returned");
        return [];
      }

      const transformedData = data.map(itemGroup => ({
        id: itemGroup.id,
        name: itemGroup.name,
        classification: itemGroup.classification,
        subClassification: itemGroup.sub_classification,
        status: itemGroup.status as 'active' | 'inactive',
        organizationId: itemGroup.organization_id,
        createdBy: itemGroup.created_by,
        createdOn: new Date(itemGroup.created_on),
        updatedBy: itemGroup.updated_by,
        updatedOn: itemGroup.updated_on ? new Date(itemGroup.updated_on) : undefined,
      }));

      console.log("Transformed item groups data:", transformedData);
      return transformedData;
      
    } catch (error) {
      console.error("Service error fetching item groups:", error);
      throw error;
    }
  },

  async createItemGroup(formData: ItemGroupFormData, createdBy: string): Promise<void> {
    console.log("Creating item group:", formData, "created by:", createdBy);
    
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

      const { error } = await supabase
        .from('item_groups')
        .insert({
          name: formData.name,
          classification: formData.classification,
          sub_classification: formData.subClassification,
          status: formData.status,
          organization_id: profile.organization_id,
          created_by: createdBy,
          updated_by: createdBy,
        });

      if (error) {
        console.error("Error creating item group:", error);
        throw new Error(`Failed to create item group: ${error.message}`);
      }

      console.log("Item group created successfully");
      
    } catch (error) {
      console.error("Service error creating item group:", error);
      throw error;
    }
  },

  async updateItemGroup(itemGroupId: string, formData: ItemGroupFormData, updatedBy: string): Promise<void> {
    console.log("Updating item group:", { itemGroupId, formData, updatedBy });
    
    try {
      const { error } = await supabase
        .from('item_groups')
        .update({
          name: formData.name,
          classification: formData.classification,
          sub_classification: formData.subClassification,
          status: formData.status,
          updated_by: updatedBy,
          updated_on: new Date().toISOString(),
        })
        .eq('id', itemGroupId);

      if (error) {
        console.error("Error updating item group:", error);
        throw new Error(`Failed to update item group: ${error.message}`);
      }

      console.log("Item group updated successfully");
      
    } catch (error) {
      console.error("Service error updating item group:", error);
      throw error;
    }
  },

  async updateItemGroupStatus(itemGroupId: string, status: 'active' | 'inactive', updatedBy: string): Promise<void> {
    console.log("Updating item group status:", { itemGroupId, status, updatedBy });
    
    try {
      const { error } = await supabase
        .from('item_groups')
        .update({
          status,
          updated_by: updatedBy,
          updated_on: new Date().toISOString(),
        })
        .eq('id', itemGroupId);

      if (error) {
        console.error("Error updating item group status:", error);
        throw new Error(`Failed to update item group status: ${error.message}`);
      }

      console.log("Item group status updated successfully");
      
    } catch (error) {
      console.error("Service error updating item group status:", error);
      throw error;
    }
  }
};
