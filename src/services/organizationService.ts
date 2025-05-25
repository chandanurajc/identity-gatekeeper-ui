
import { Organization, OrganizationFormData, Reference, Contact } from "@/types/organization";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

const validateOrganizationCode = (code: string): boolean => {
  // Check if code is exactly 4 characters and alphanumeric
  return /^[A-Za-z0-9]{4}$/.test(code);
};

// Helper functions to safely convert Json to typed arrays
const parseReferences = (data: Json | null): Reference[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.filter((item: any): item is Reference => {
    return (
      typeof item === 'object' && 
      item !== null && 
      typeof item.id === 'string' &&
      typeof item.type === 'string' && 
      typeof item.value === 'string' &&
      ['GST', 'CIN', 'PAN'].includes(item.type)
    );
  });
};

const parseContacts = (data: Json | null): Contact[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.filter((item: any): item is Contact => {
    return (
      typeof item === 'object' && 
      item !== null && 
      typeof item.id === 'string' &&
      typeof item.type === 'string' && 
      typeof item.firstName === 'string' &&
      ['Registered location', 'Billing', 'Shipping', 'Owner'].includes(item.type)
    );
  });
};

export const organizationService = {
  getAllOrganizations: async (): Promise<Organization[]> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Error fetching organizations:", error);
        throw error;
      }

      return data?.map(org => ({
        id: org.id,
        name: org.name,
        code: org.code,
        alias: org.description || "",
        type: "Supplier" as const,
        status: org.status as "active" | "inactive",
        references: parseReferences(org.organization_references),
        contacts: parseContacts(org.contacts),
        createdBy: org.created_by || "System",
        createdOn: new Date(org.created_on),
        updatedBy: org.updated_by,
        updatedOn: org.updated_on ? new Date(org.updated_on) : undefined,
      })) || [];
    } catch (error) {
      console.error("Error in getAllOrganizations:", error);
      return [];
    }
  },

  getOrganizationById: async (id: string): Promise<Organization | undefined> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching organization:", error);
        return undefined;
      }

      if (!data) return undefined;

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        alias: data.description || "",
        type: "Supplier" as const,
        status: data.status as "active" | "inactive",
        references: parseReferences(data.organization_references),
        contacts: parseContacts(data.contacts),
        createdBy: data.created_by || "System",
        createdOn: new Date(data.created_on),
        updatedBy: data.updated_by,
        updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Error in getOrganizationById:", error);
      return undefined;
    }
  },

  getOrganizationByCode: async (code: string): Promise<Organization | undefined> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error) {
        console.error("Error fetching organization by code:", error);
        return undefined;
      }

      if (!data) return undefined;

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        alias: data.description || "",
        type: "Supplier" as const,
        status: data.status as "active" | "inactive",
        references: parseReferences(data.organization_references),
        contacts: parseContacts(data.contacts),
        createdBy: data.created_by || "System",
        createdOn: new Date(data.created_on),
        updatedBy: data.updated_by,
        updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Error in getOrganizationByCode:", error);
      return undefined;
    }
  },

  validateOrganizationCode: async (code: string, excludeId?: string): Promise<boolean> => {
    if (!validateOrganizationCode(code)) {
      return false;
    }

    try {
      let query = supabase
        .from('organizations')
        .select('id')
        .eq('code', code.toUpperCase());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error validating organization code:", error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error("Error in validateOrganizationCode:", error);
      return false;
    }
  },

  createOrganization: async (organization: OrganizationFormData, createdBy: string): Promise<Organization> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: organization.name,
          code: organization.code.toUpperCase(),
          description: organization.alias,
          status: organization.status,
          contacts: JSON.parse(JSON.stringify(organization.contacts)) as Json,
          organization_references: JSON.parse(JSON.stringify(organization.references)) as Json,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating organization:", error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        alias: data.description || "",
        type: "Supplier" as const,
        status: data.status as "active" | "inactive",
        references: parseReferences(data.organization_references),
        contacts: parseContacts(data.contacts),
        createdBy: data.created_by || "System",
        createdOn: new Date(data.created_on),
      };
    } catch (error) {
      console.error("Error in createOrganization:", error);
      throw error;
    }
  },

  updateOrganization: async (id: string, organizationData: Partial<OrganizationFormData>, updatedBy: string): Promise<Organization | undefined> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        updated_by: user?.id,
        updated_on: new Date().toISOString()
      };

      if (organizationData.name !== undefined) {
        updateData.name = organizationData.name;
      }
      if (organizationData.code !== undefined) {
        updateData.code = organizationData.code.toUpperCase();
      }
      if (organizationData.alias !== undefined) {
        updateData.description = organizationData.alias;
      }
      if (organizationData.status !== undefined) {
        updateData.status = organizationData.status;
      }
      if (organizationData.contacts !== undefined) {
        updateData.contacts = JSON.parse(JSON.stringify(organizationData.contacts)) as Json;
      }
      if (organizationData.references !== undefined) {
        updateData.organization_references = JSON.parse(JSON.stringify(organizationData.references)) as Json;
      }
      
      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating organization:", error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        alias: data.description || "",
        type: "Supplier" as const,
        status: data.status as "active" | "inactive",
        references: parseReferences(data.organization_references),
        contacts: parseContacts(data.contacts),
        createdBy: data.created_by || "System",
        createdOn: new Date(data.created_on),
        updatedBy: data.updated_by,
        updatedOn: new Date(data.updated_on),
      };
    } catch (error) {
      console.error("Error in updateOrganization:", error);
      return undefined;
    }
  },

  deleteOrganization: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting organization:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteOrganization:", error);
      return false;
    }
  }
};
