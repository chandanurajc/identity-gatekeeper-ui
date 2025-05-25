
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
  }) as unknown as Reference[];
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
  }) as unknown as Contact[];
};

export const organizationService = {
  getAllOrganizations: async (): Promise<Organization[]> => {
    try {
      console.log("OrganizationService: Starting getAllOrganizations...");
      
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("OrganizationService: Current user:", user?.id, "Auth error:", authError);
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_on', { ascending: false });

      console.log("OrganizationService: Raw supabase response:", { data, error });
      console.log("OrganizationService: Query executed successfully, data length:", data?.length || 0);

      if (error) {
        console.error("OrganizationService: Supabase error:", error);
        throw new Error(`Failed to fetch organizations: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log("OrganizationService: No organizations found in database");
        console.log("OrganizationService: This could mean:");
        console.log("1. No organizations have been created yet");
        console.log("2. RLS policies are blocking access");
        console.log("3. User doesn't have proper permissions");
        return [];
      }

      console.log("OrganizationService: Processing", data.length, "organizations");

      const processedOrgs = data.map(org => {
        console.log("OrganizationService: Processing org:", org);
        return {
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
        };
      });

      console.log("OrganizationService: Processed organizations:", processedOrgs);
      return processedOrgs;
    } catch (error) {
      console.error("OrganizationService: Error in getAllOrganizations:", error);
      throw error; // Re-throw to let caller handle
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
        console.error("OrganizationService: Error fetching organization:", error);
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
      console.error("OrganizationService: Error in getOrganizationById:", error);
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
        console.error("OrganizationService: Error fetching organization by code:", error);
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
      console.error("OrganizationService: Error in getOrganizationByCode:", error);
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
        console.error("OrganizationService: Error validating organization code:", error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error("OrganizationService: Error in validateOrganizationCode:", error);
      return false;
    }
  },

  createOrganization: async (organization: OrganizationFormData, createdBy: string): Promise<Organization> => {
    try {
      console.log("OrganizationService: Creating organization:", organization);
      const { data: { user } } = await supabase.auth.getUser();
      console.log("OrganizationService: Current user for creation:", user?.id);
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Validate organization code format
      if (!validateOrganizationCode(organization.code)) {
        throw new Error("Organization code must be exactly 4 alphanumeric characters");
      }

      // Check if code already exists
      const isCodeValid = await organizationService.validateOrganizationCode(organization.code);
      if (!isCodeValid) {
        throw new Error(`Organization code '${organization.code}' already exists`);
      }

      console.log("OrganizationService: Validation passed, inserting data...");
      
      const insertData = {
        name: organization.name,
        code: organization.code.toUpperCase(),
        description: organization.alias,
        status: organization.status,
        contacts: JSON.parse(JSON.stringify(organization.contacts)) as Json,
        organization_references: JSON.parse(JSON.stringify(organization.references)) as Json,
        created_by: user.id
      };

      console.log("OrganizationService: Insert data:", insertData);
      
      const { data, error } = await supabase
        .from('organizations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("OrganizationService: Error creating organization:", error);
        console.error("OrganizationService: Error details:", error.message, error.code, error.details);
        throw new Error(`Failed to create organization: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned after organization creation");
      }

      console.log("OrganizationService: Organization created successfully:", data);

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
      console.error("OrganizationService: Error in createOrganization:", error);
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
        console.error("OrganizationService: Error updating organization:", error);
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
      console.error("OrganizationService: Error in updateOrganization:", error);
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
        console.error("OrganizationService: Error deleting organization:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("OrganizationService: Error in deleteOrganization:", error);
      return false;
    }
  }
};
