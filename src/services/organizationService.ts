
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationFormData, Contact, Reference } from "@/types/organization";

const transformSupabaseOrg = (org: any): Organization => {
  if (!org) return org;
  return {
    id: org.id,
    code: org.code,
    name: org.name,
    description: org.description,
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
      stateCode: contact.state_code,
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
};

export const organizationService = {
  async getOrganizations(): Promise<Organization[]> {
    console.log("Fetching organizations from Supabase");
    
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

      const transformedData = data.map(transformSupabaseOrg);
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

      console.log("Organization fetched successfully:", data);
      
      return transformSupabaseOrg(data);
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
        code: organizationData.code,
        name: organizationData.name,
        description: organizationData.description,
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

        const { error: refError } = await supabase
          .from('organization_references')
          .insert(references);

        if (refError) {
          console.error("Error creating references:", refError);
          throw new Error(`Failed to create references: ${refError.message}`);
        }
      }

      // Create contacts in the dedicated table with state_code
      if (organizationData.contacts && organizationData.contacts.length > 0) {
        const contacts = organizationData.contacts.map(contact => ({
          organization_id: orgData.id,
          contact_type: contact.type,
          first_name: contact.firstName?.trim() || '',
          last_name: contact.lastName?.trim() || null,
          address1: contact.address1?.trim() || null,
          address2: contact.address2?.trim() || null,
          postal_code: contact.postalCode?.trim() || null,
          city: contact.city?.trim() || null,
          state: contact.state?.trim() || null,
          state_code: contact.stateCode || null,
          country: contact.country?.trim() || null,
          phone_number: contact.phoneNumber?.trim() || null,
          email: contact.email?.trim() || null,
          website: contact.website?.trim() || null,
        }));

        console.log("Creating contacts with state codes:", contacts);

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
        code: orgData.code,
        name: orgData.name,
        description: orgData.description,
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
        description: organizationData.description?.trim() || null,
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

      // Create new references with validation
      if (organizationData.references && organizationData.references.length > 0) {
        console.log("OrganizationService: Creating new references:", organizationData.references);
        
        const allowedReferenceTypes = ['GST', 'CIN', 'PAN'];
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
            reference_type: ref.type,
            reference_value: ref.value.trim(),
          }));

          console.log("OrganizationService: Reference data to insert:", references);

          const { error: refError } = await supabase
            .from('organization_references')
            .insert(references);

          if (refError) {
            console.error("OrganizationService: Error creating references:", refError);
            throw new Error(`Failed to create references: ${refError.message}`);
          }
          console.log("OrganizationService: References created successfully");
        }
      }

      // Create new contacts with validation and state_code
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
            state_code: contact.stateCode || null,
            country: contact.country?.trim() || null,
            phone_number: contact.phoneNumber?.trim() || null,
            email: contact.email?.trim() || null,
            website: contact.website?.trim() || null,
          }));

          console.log("OrganizationService: Contact data to insert with state codes:", contacts);

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
        code: orgData.code,
        name: orgData.name,
        description: orgData.description,
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
  },

  async getPartnerOrganizations(currentOrganizationId: string): Promise<Organization[]> {
    console.log("Fetching partner organizations for org:", currentOrganizationId);
    
    try {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          organization:organizations!partners_organization_id_fkey(
            id,
            code,
            name,
            type,
            status,
            description,
            created_by,
            created_on,
            updated_by,
            updated_on
          )
        `)
        .eq('current_organization_id', currentOrganizationId)
        .eq('status', 'active')
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching partner organizations:", error);
        throw new Error(`Failed to fetch partner organizations: ${error.message}`);
      }
      
      if (!data) {
        return [];
      }

      // Transform and filter partner organizations
      const partnerOrganizations: Organization[] = data
        .filter((partner): partner is typeof partner & { organization: any } => 
          partner.organization !== null && 
          partner.organization.status === 'active'
        )
        .map(partner => ({
          id: partner.organization.id,
          code: partner.organization.code,
          name: partner.organization.name,
          description: partner.organization.description,
          type: partner.organization.type as Organization['type'],
          status: partner.organization.status as 'active' | 'inactive',
          references: [], // Partner organizations don't include references in this query
          contacts: [], // Partner organizations don't include contacts in this query
          createdBy: partner.organization.created_by,
          createdOn: partner.organization.created_on ? new Date(partner.organization.created_on) : undefined,
          updatedBy: partner.organization.updated_by,
          updatedOn: partner.organization.updated_on ? new Date(partner.organization.updated_on) : undefined,
        }));

      console.log("Transformed partner organizations:", partnerOrganizations);
      return partnerOrganizations;
      
    } catch (error) {
      console.error("Service error fetching partner organizations:", error);
      throw error;
    }
  }
};
