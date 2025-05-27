
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationFormData, Reference, Contact } from "@/types/organization";

export const organizationService = {
  async getOrganizations(): Promise<Organization[]> {
    console.log("Fetching organizations from Supabase...");
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_references!inner(*),
          organization_contacts!inner(*)
        `)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching organizations:", error);
        throw new Error(`Failed to fetch organizations: ${error.message}`);
      }

      console.log("Raw organizations data from Supabase:", data);
      
      if (!data) {
        console.log("No organizations data returned");
        return [];
      }

      // Transform database data to match Organization interface
      const transformedData = data.map(org => {
        console.log("Transforming organization:", org);
        
        return {
          id: org.id,
          name: org.name,
          code: org.code,
          alias: org.description,
          type: org.type as Organization['type'],
          status: org.status as 'active' | 'inactive',
          references: (org.organization_references || []).map((ref: any) => ({
            id: ref.id,
            type: ref.reference_type as 'GST' | 'CIN' | 'PAN',
            value: ref.reference_value,
          })),
          contacts: (org.organization_contacts || []).map((contact: any) => ({
            id: contact.id,
            type: contact.contact_type,
            firstName: contact.first_name,
            lastName: contact.last_name,
            address1: contact.address1,
            address2: contact.address2,
            postalCode: contact.postal_code,
            city: contact.city,
            state: contact.state,
            country: contact.country,
            phoneNumber: contact.phone_number,
            email: contact.email,
            website: contact.website,
          })),
          createdBy: org.created_by,
          createdOn: org.created_on ? new Date(org.created_on) : undefined,
          updatedBy: org.updated_by,
          updatedOn: org.updated_on ? new Date(org.updated_on) : undefined,
        };
      });

      console.log("Transformed organizations data:", transformedData);
      return transformedData;
      
    } catch (error) {
      console.error("Service error fetching organizations:", error);
      throw error;
    }
  },

  // Alias for backward compatibility
  async getAllOrganizations(): Promise<Organization[]> {
    return this.getOrganizations();
  },

  async getOrganizationById(id: string): Promise<Organization | null> {
    console.log("Fetching organization by ID:", id);
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_references(*),
          organization_contacts(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching organization:", error);
        throw new Error(`Failed to fetch organization: ${error.message}`);
      }

      if (!data) {
        console.log("Organization not found");
        return null;
      }

      console.log("Organization fetched successfully:", data);
      
      return {
        id: data.id,
        name: data.name,
        code: data.code,
        alias: data.description,
        type: data.type as Organization['type'],
        status: data.status as 'active' | 'inactive',
        references: (data.organization_references || []).map((ref: any) => ({
          id: ref.id,
          type: ref.reference_type as 'GST' | 'CIN' | 'PAN',
          value: ref.reference_value,
        })),
        contacts: (data.organization_contacts || []).map((contact: any) => ({
          id: contact.id,
          type: contact.contact_type,
          firstName: contact.first_name,
          lastName: contact.last_name,
          address1: contact.address1,
          address2: contact.address2,
          postalCode: contact.postal_code,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          phoneNumber: contact.phone_number,
          email: contact.email,
          website: contact.website,
        })),
        createdBy: data.created_by,
        createdOn: data.created_on ? new Date(data.created_on) : undefined,
        updatedBy: data.updated_by,
        updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Service error fetching organization:", error);
      throw error;
    }
  },

  async createOrganization(organizationData: OrganizationFormData, createdBy: string): Promise<Organization> {
    console.log("Creating organization with data:", organizationData);
    
    try {
      // First create the organization
      const newOrganization = {
        name: organizationData.name,
        code: organizationData.code,
        description: organizationData.alias || null,
        type: organizationData.type,
        status: organizationData.status,
        created_by: createdBy,
        updated_by: createdBy,
      };

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert(newOrganization)
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      // Create references in the dedicated table
      if (organizationData.references && organizationData.references.length > 0) {
        const references = organizationData.references.map(ref => ({
          organization_id: orgData.id,
          reference_type: ref.type,
          reference_value: ref.value,
        }));

        const { error: refError } = await supabase
          .from('organization_references')
          .insert(references);

        if (refError) {
          console.error("Error creating references:", refError);
          throw new Error(`Failed to create references: ${refError.message}`);
        }
      }

      // Create contacts in the dedicated table
      if (organizationData.contacts && organizationData.contacts.length > 0) {
        const contacts = organizationData.contacts.map(contact => ({
          organization_id: orgData.id,
          contact_type: contact.type,
          first_name: contact.firstName,
          last_name: contact.lastName,
          address1: contact.address1,
          address2: contact.address2,
          postal_code: contact.postalCode,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          phone_number: contact.phoneNumber,
          email: contact.email,
          website: contact.website,
        }));

        const { error: contactError } = await supabase
          .from('organization_contacts')
          .insert(contacts);

        if (contactError) {
          console.error("Error creating contacts:", contactError);
          throw new Error(`Failed to create contacts: ${contactError.message}`);
        }
      }

      console.log("Organization created successfully:", orgData);
      
      return {
        id: orgData.id,
        name: orgData.name,
        code: orgData.code,
        alias: orgData.description,
        type: orgData.type as Organization['type'],
        status: orgData.status as 'active' | 'inactive',
        references: organizationData.references,
        contacts: organizationData.contacts,
        createdBy: orgData.created_by,
        createdOn: orgData.created_on ? new Date(orgData.created_on) : undefined,
        updatedBy: orgData.updated_by,
        updatedOn: orgData.updated_on ? new Date(orgData.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Service error creating organization:", error);
      throw error;
    }
  },

  async updateOrganization(id: string, organizationData: OrganizationFormData, updatedBy: string): Promise<Organization> {
    console.log("Updating organization:", id, "with data:", organizationData);
    
    try {
      // Update the organization
      const updateData = {
        name: organizationData.name,
        code: organizationData.code,
        description: organizationData.alias || null,
        type: organizationData.type,
        status: organizationData.status,
        updated_by: updatedBy,
        updated_on: new Date().toISOString(),
      };

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (orgError) {
        console.error("Error updating organization:", orgError);
        throw new Error(`Failed to update organization: ${orgError.message}`);
      }

      // Delete existing references and contacts
      await supabase.from('organization_references').delete().eq('organization_id', id);
      await supabase.from('organization_contacts').delete().eq('organization_id', id);

      // Create new references
      if (organizationData.references && organizationData.references.length > 0) {
        const references = organizationData.references.map(ref => ({
          organization_id: id,
          reference_type: ref.type,
          reference_value: ref.value,
        }));

        const { error: refError } = await supabase
          .from('organization_references')
          .insert(references);

        if (refError) {
          console.error("Error updating references:", refError);
          throw new Error(`Failed to update references: ${refError.message}`);
        }
      }

      // Create new contacts
      if (organizationData.contacts && organizationData.contacts.length > 0) {
        const contacts = organizationData.contacts.map(contact => ({
          organization_id: id,
          contact_type: contact.type,
          first_name: contact.firstName,
          last_name: contact.lastName,
          address1: contact.address1,
          address2: contact.address2,
          postal_code: contact.postalCode,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          phone_number: contact.phoneNumber,
          email: contact.email,
          website: contact.website,
        }));

        const { error: contactError } = await supabase
          .from('organization_contacts')
          .insert(contacts);

        if (contactError) {
          console.error("Error updating contacts:", contactError);
          throw new Error(`Failed to update contacts: ${contactError.message}`);
        }
      }

      console.log("Organization updated successfully:", orgData);
      
      return {
        id: orgData.id,
        name: orgData.name,
        code: orgData.code,
        alias: orgData.description,
        type: orgData.type as Organization['type'],
        status: orgData.status as 'active' | 'inactive',
        references: organizationData.references,
        contacts: organizationData.contacts,
        createdBy: orgData.created_by,
        createdOn: orgData.created_on ? new Date(orgData.created_on) : undefined,
        updatedBy: orgData.updated_by,
        updatedOn: orgData.updated_on ? new Date(orgData.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Service error updating organization:", error);
      throw error;
    }
  },

  async deleteOrganization(id: string): Promise<void> {
    console.log("Deleting organization:", id);
    
    try {
      // Delete references and contacts first (due to foreign key constraints)
      await supabase.from('organization_references').delete().eq('organization_id', id);
      await supabase.from('organization_contacts').delete().eq('organization_id', id);
      
      // Then delete the organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting organization:", error);
        throw new Error(`Failed to delete organization: ${error.message}`);
      }

      console.log("Organization deleted successfully");
    } catch (error) {
      console.error("Service error deleting organization:", error);
      throw error;
    }
  }
};
