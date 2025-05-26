
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationFormData } from "@/types/organization";

export const organizationService = {
  async getOrganizations(): Promise<Organization[]> {
    console.log("Fetching organizations...");
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching organizations:", error);
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    console.log("Organizations fetched successfully:", data);
    return data || [];
  },

  async getOrganizationById(id: string): Promise<Organization | null> {
    console.log("Fetching organization by ID:", id);
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching organization:", error);
      if (error.code === 'PGRST116') {
        return null; // Organization not found
      }
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }

    console.log("Organization fetched successfully:", data);
    return data;
  },

  async createOrganization(organizationData: OrganizationFormData, createdBy: string): Promise<Organization> {
    console.log("Creating organization with data:", organizationData);
    
    const newOrganization = {
      ...organizationData,
      created_by: createdBy,
      updated_by: createdBy,
    };

    const { data, error } = await supabase
      .from('organizations')
      .insert([newOrganization])
      .select()
      .single();

    if (error) {
      console.error("Error creating organization:", error);
      throw new Error(`Failed to create organization: ${error.message}`);
    }

    console.log("Organization created successfully:", data);
    return data;
  },

  async updateOrganization(id: string, organizationData: OrganizationFormData, updatedBy: string): Promise<Organization> {
    console.log("Updating organization:", id, "with data:", organizationData);
    
    const updateData = {
      ...organizationData,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating organization:", error);
      throw new Error(`Failed to update organization: ${error.message}`);
    }

    console.log("Organization updated successfully:", data);
    return data;
  },

  async deleteOrganization(id: string): Promise<void> {
    console.log("Deleting organization:", id);
    
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting organization:", error);
      throw new Error(`Failed to delete organization: ${error.message}`);
    }

    console.log("Organization deleted successfully");
  }
};
