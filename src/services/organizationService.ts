
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationFormData } from "@/types/organization";

export const organizationService = {
  async getOrganizations(): Promise<Organization[]> {
    console.log("Fetching organizations...");
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_on', { ascending: false });

    if (error) {
      console.error("Error fetching organizations:", error);
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    console.log("Organizations fetched successfully:", data);
    
    // Transform database data to match Organization interface
    return (data || []).map(org => ({
      id: org.id,
      name: org.name,
      code: org.code,
      alias: org.description, // Map description to alias
      type: 'Admin' as const, // Default type since not in DB
      status: org.status as 'active' | 'inactive',
      references: Array.isArray(org.organization_references) ? org.organization_references : [],
      contacts: Array.isArray(org.contacts) ? org.contacts : [],
      createdBy: org.created_by,
      createdOn: org.created_on ? new Date(org.created_on) : undefined,
      updatedBy: org.updated_by,
      updatedOn: org.updated_on ? new Date(org.updated_on) : undefined,
    }));
  },

  // Alias for backward compatibility
  async getAllOrganizations(): Promise<Organization[]> {
    return this.getOrganizations();
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
        return null;
      }
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }

    console.log("Organization fetched successfully:", data);
    
    // Transform database data to match Organization interface
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      alias: data.description,
      type: 'Admin' as const,
      status: data.status as 'active' | 'inactive',
      references: Array.isArray(data.organization_references) ? data.organization_references : [],
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
      createdBy: data.created_by,
      createdOn: data.created_on ? new Date(data.created_on) : undefined,
      updatedBy: data.updated_by,
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    };
  },

  async createOrganization(organizationData: OrganizationFormData, createdBy: string): Promise<Organization> {
    console.log("Creating organization with data:", organizationData);
    
    // Transform form data to match database schema
    const newOrganization = {
      name: organizationData.name,
      code: organizationData.code,
      description: organizationData.alias || null,
      status: organizationData.status,
      organization_references: organizationData.references || [],
      contacts: organizationData.contacts || [],
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
    
    // Transform response back to Organization interface
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      alias: data.description,
      type: organizationData.type,
      status: data.status as 'active' | 'inactive',
      references: organizationData.references,
      contacts: organizationData.contacts,
      createdBy: data.created_by,
      createdOn: data.created_on ? new Date(data.created_on) : undefined,
      updatedBy: data.updated_by,
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    };
  },

  async updateOrganization(id: string, organizationData: OrganizationFormData, updatedBy: string): Promise<Organization> {
    console.log("Updating organization:", id, "with data:", organizationData);
    
    const updateData = {
      name: organizationData.name,
      code: organizationData.code,
      description: organizationData.alias || null,
      status: organizationData.status,
      organization_references: organizationData.references || [],
      contacts: organizationData.contacts || [],
      updated_by: updatedBy,
      updated_on: new Date().toISOString(),
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
    
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      alias: data.description,
      type: organizationData.type,
      status: data.status as 'active' | 'inactive',
      references: organizationData.references,
      contacts: organizationData.contacts,
      createdBy: data.created_by,
      createdOn: data.created_on ? new Date(data.created_on) : undefined,
      updatedBy: data.updated_by,
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    };
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
