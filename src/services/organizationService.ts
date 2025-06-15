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
          organization_references(*),
          organization_contacts(*)
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
            type: ref.reference_type as 'GST' | 'CIN' | 'PAN' | 'GS1Code',
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
          type: ref.reference_type as 'GST' | 'CIN' | 'PAN' | 'GS1Code',
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
        console.log("Creating references:", organizationData.references);
        const references = organizationData.references.map(ref => ({
          organization_id: orgData.id,
          reference_type: ref.type,
          reference_value: ref.value,
        }));

        console.log("Reference inserts:", references);

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
          first_name: contact.firstName || '',
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
    console.log("OrganizationService: updateOrganization called");
    console.log("OrganizationService: ID:", id);
    console.log("OrganizationService: Data:", JSON.stringify(organizationData, null, 2));
    console.log("OrganizationService: UpdatedBy:", updatedBy);
    
    try {
      // Validate input data
      if (!id) {
        throw new Error("Organization ID is required");
      }
      
      if (!organizationData.name || !organizationData.code || !organizationData.type) {
        throw new Error("Required fields (name, code, type) are missing");
      }

      // Start transaction-like operation
      console.log("OrganizationService: Starting update transaction");

      // Update the organization first
      const updateData = {
        name: organizationData.name.trim(),
        code: organizationData.code.trim().toUpperCase(),
        description: organizationData.alias?.trim() || null,
        type: organizationData.type,
        status: organizationData.status,
        updated_by: updatedBy,
        updated_on: new Date().toISOString(),
      };

      console.log("OrganizationService: Updating organization with data:", updateData);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (orgError) {
        console.error("OrganizationService: Error updating organization:", orgError);
        throw new Error(`Failed to update organization: ${orgError.message}`);
      }

      if (!orgData) {
        console.error("OrganizationService: No organization data returned after update");
        throw new Error("Organization not found or update failed");
      }

      console.log("OrganizationService: Organization updated successfully:", orgData);

      // Delete existing references and contacts
      console.log("OrganizationService: Deleting existing references");
      const { error: deleteRefsError } = await supabase
        .from('organization_references')
        .delete()
        .eq('organization_id', id);

      if (deleteRefsError) {
        console.error("OrganizationService: Error deleting references:", deleteRefsError);
        throw new Error(`Failed to delete existing references: ${deleteRefsError.message}`);
      }

      console.log("OrganizationService: Deleting existing contacts");
      const { error: deleteContactsError } = await supabase
        .from('organization_contacts')
        .delete()
        .eq('organization_id', id);

      if (deleteContactsError) {
        console.error("OrganizationService: Error deleting contacts:", deleteContactsError);
        throw new Error(`Failed to delete existing contacts: ${deleteContactsError.message}`);
      }

      // Create new references with exact constraint validation
      if (organizationData.references && organizationData.references.length > 0) {
        console.log("OrganizationService: Creating new references:", organizationData.references);
        
        // Validate reference types against database constraint - updated to use GS1Code
        const allowedReferenceTypes = ['GST', 'CIN', 'PAN', 'GS1Code'];
        
        const validReferences = organizationData.references.filter(ref => {
          const hasValue = ref.value && ref.value.trim();
          const validType = allowedReferenceTypes.includes(ref.type);
          
          if (!validType) {
            console.error("OrganizationService: Invalid reference type:", ref.type, "Allowed:", allowedReferenceTypes);
          }
          if (!hasValue) {
            console.error("OrganizationService: Empty reference value for:", ref.type);
          }
          
          return hasValue && validType;
        });
        
        if (validReferences.length > 0) {
          const references = validReferences.map(ref => ({
            organization_id: id,
            reference_type: ref.type, // Must match database constraint exactly
            reference_value: ref.value.trim(),
          }));

          console.log("OrganizationService: Reference data to insert:", references);

          const { error: refError } = await supabase
            .from('organization_references')
            .insert(references);

          if (refError) {
            console.error("OrganizationService: Error creating references:", refError);
            console.error("OrganizationService: Reference error details:", {
              message: refError.message,
              details: refError.details,
              hint: refError.hint,
              code: refError.code
            });
            throw new Error(`Failed to create references: ${refError.message}`);
          }
          console.log("OrganizationService: References created successfully");
        }
      }

      // Create new contacts with validation
      if (organizationData.contacts && organizationData.contacts.length > 0) {
        console.log("OrganizationService: Creating new contacts:", organizationData.contacts);
        
        const allowedContactTypes = ['Registered location', 'Billing', 'Shipping', 'Owner', 'Bill To', 'Remit To'];
        const validContacts = organizationData.contacts.filter(contact => {
          const validType = allowedContactTypes.includes(contact.type);
          
          if (!validType) {
            console.error("OrganizationService: Invalid contact type:", contact.type, "Allowed:", allowedContactTypes);
          }
          
          return validType;
        });
        
        if (validContacts.length > 0) {
          const contacts = validContacts.map(contact => ({
            organization_id: id,
            contact_type: contact.type,
            first_name: contact.firstName?.trim() || '',
            last_name: contact.lastName?.trim() || null,
            address1: contact.address1?.trim() || null,
            address2: contact.address2?.trim() || null,
            postal_code: contact.postalCode?.trim() || null,
            city: contact.city?.trim() || null,
            state: contact.state?.trim() || null,
            country: contact.country?.trim() || null,
            phone_number: contact.phoneNumber?.trim() || null,
            email: contact.email?.trim() || null,
            website: contact.website?.trim() || null,
          }));

          const { error: contactError } = await supabase
            .from('organization_contacts')
            .insert(contacts);

          if (contactError) {
            console.error("OrganizationService: Error creating contacts:", contactError);
            throw new Error(`Failed to create contacts: ${contactError.message}`);
          }
          console.log("OrganizationService: Contacts created successfully");
        }
      }

      console.log("OrganizationService: Update process completed successfully");
      
      // Return the updated organization with the new data
      const result: Organization = {
        id: orgData.id,
        name: orgData.name,
        code: orgData.code,
        alias: orgData.description,
        type: orgData.type as Organization['type'],
        status: orgData.status as 'active' | 'inactive',
        references: organizationData.references || [],
        contacts: organizationData.contacts || [],
        createdBy: orgData.created_by,
        createdOn: orgData.created_on ? new Date(orgData.created_on) : undefined,
        updatedBy: orgData.updated_by,
        updatedOn: orgData.updated_on ? new Date(orgData.updated_on) : undefined,
      };
      
      console.log("OrganizationService: Returning result:", result);
      return result;
    } catch (error) {
      console.error("OrganizationService: Error in updateOrganization:", error);
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
