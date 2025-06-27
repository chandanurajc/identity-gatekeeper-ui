
import { supabase } from "@/integrations/supabase/client";
import { Division, DivisionFormData, Reference, Contact } from "@/types/division";

// Helper function to transform Supabase data to the application's Division type
const transformSupabaseDiv = (div: any): Division => {
  if (!div) return div;
  return {
    id: div.id,
    code: div.code,
    name: div.name,
    organizationId: div.organization_id,
    organizationCode: div.organizations?.code || '',
    organizationName: div.organizations?.name || '',
    type: div.type as Division['type'],
    status: div.status as 'active' | 'inactive',
    references: (div.division_references || []).map((ref: any) => ({
      id: ref.id,
      type: ref.reference_type as 'GST' | 'CIN' | 'PAN',
      value: ref.reference_value,
    })),
    contacts: (div.division_contacts || []).map((contact: any) => ({
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
    createdBy: div.created_by,
    createdOn: div.created_on ? new Date(div.created_on) : undefined,
    updatedBy: div.updated_by,
    updatedOn: div.updated_on ? new Date(div.updated_on) : undefined,
  };
};

export const divisionService = {
  async getDivisions(organizationId: string): Promise<Division[]> {
    console.log("Fetching divisions from Supabase for organization:", organizationId);
    
    try {
      const { data, error } = await supabase
        .from('divisions')
        .select(`
          *,
          organizations(code, name),
          division_references(*),
          division_contacts(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching divisions:", error);
        throw new Error(`Failed to fetch divisions: ${error.message}`);
      }

      console.log("Raw divisions data from Supabase:", data);
      
      if (!data) {
        console.log("No divisions data returned");
        return [];
      }

      const transformedData = data.map(transformSupabaseDiv);
      console.log("Transformed divisions data:", transformedData);
      return transformedData;
      
    } catch (error) {
      console.error("Service error fetching divisions:", error);
      throw error;
    }
  },

  async getDivisionById(id: string): Promise<Division | null> {
    console.log("Fetching division by ID:", id);
    
    try {
      const { data, error } = await supabase
        .from('divisions')
        .select(`
          *,
          organizations(code, name),
          division_references(*),
          division_contacts(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching division:", error);
        throw new Error(`Failed to fetch division: ${error.message}`);
      }

      console.log("Division fetched successfully:", data);
      
      return transformSupabaseDiv(data);
    } catch (error) {
      console.error("Service error fetching division:", error);
      throw error;
    }
  },

  async createDivision(divisionData: DivisionFormData, organizationId: string, createdBy: string): Promise<Division> {
    console.log("Creating division with data:", divisionData);
    
    try {
      // First create the division
      const newDivision = {
        organization_id: organizationId,
        code: divisionData.userDefinedCode,
        name: divisionData.name,
        type: divisionData.type,
        status: divisionData.status,
        created_by: createdBy,
        updated_by: createdBy,
      };

      const { data: divData, error: divError } = await supabase
        .from('divisions')
        .insert(newDivision)
        .select()
        .single();

      if (divError) {
        console.error("Error creating division:", divError);
        throw new Error(`Failed to create division: ${divError.message}`);
      }

      // Create references in the dedicated table
      if (divisionData.references && divisionData.references.length > 0) {
        console.log("Creating references:", divisionData.references);
        const references = divisionData.references.map(ref => ({
          division_id: divData.id,
          reference_type: ref.type,
          reference_value: ref.value,
        }));

        const { error: refError } = await supabase
          .from('division_references')
          .insert(references);

        if (refError) {
          console.error("Error creating references:", refError);
          throw new Error(`Failed to create references: ${refError.message}`);
        }
      }

      // Create contacts in the dedicated table with state_code
      if (divisionData.contacts && divisionData.contacts.length > 0) {
        const contacts = divisionData.contacts.map(contact => ({
          division_id: divData.id,
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
          .from('division_contacts')
          .insert(contacts);

        if (contactError) {
          console.error("Error creating contacts:", contactError);
          throw new Error(`Failed to create contacts: ${contactError.message}`);
        }
      }

      console.log("Division created successfully:", divData);
      
      // Get organization info for the response
      const { data: orgData } = await supabase
        .from('organizations')
        .select('code, name')
        .eq('id', organizationId)
        .single();

      return {
        id: divData.id,
        code: divData.code,
        name: divData.name,
        organizationId: divData.organization_id,
        organizationCode: orgData?.code || '',
        organizationName: orgData?.name || '',
        type: divData.type as Division['type'],
        status: divData.status as 'active' | 'inactive',
        references: divisionData.references,
        contacts: divisionData.contacts,
        createdBy: divData.created_by,
        createdOn: divData.created_on ? new Date(divData.created_on) : undefined,
        updatedBy: divData.updated_by,
        updatedOn: divData.updated_on ? new Date(divData.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Service error creating division:", error);
      throw error;
    }
  },

  async updateDivision(id: string, divisionData: DivisionFormData, updatedBy: string): Promise<Division> {
    console.log("DivisionService: updateDivision called");
    console.log("DivisionService: ID:", id);
    console.log("DivisionService: Data:", JSON.stringify(divisionData, null, 2));
    console.log("DivisionService: UpdatedBy:", updatedBy);
    
    try {
      // Validate input data
      if (!id) {
        throw new Error("Division ID is required");
      }
      
      if (!divisionData.name || !divisionData.userDefinedCode || !divisionData.type) {
        throw new Error("Required fields (name, code, type) are missing");
      }

      // Start transaction-like operation
      console.log("DivisionService: Starting update transaction");

      // Update the division first
      const updateData = {
        name: divisionData.name.trim(),
        code: divisionData.userDefinedCode.trim().toUpperCase(),
        type: divisionData.type,
        status: divisionData.status,
        updated_by: updatedBy,
        updated_on: new Date().toISOString(),
      };

      console.log("DivisionService: Updating division with data:", updateData);

      const { data: divData, error: divError } = await supabase
        .from('divisions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          organizations(code, name)
        `)
        .single();

      if (divError) {
        console.error("DivisionService: Error updating division:", divError);
        throw new Error(`Failed to update division: ${divError.message}`);
      }

      if (!divData) {
        console.error("DivisionService: No division data returned after update");
        throw new Error("Division not found or update failed");
      }

      console.log("DivisionService: Division updated successfully:", divData);

      // Delete existing references and contacts
      console.log("DivisionService: Deleting existing references");
      const { error: deleteRefsError } = await supabase
        .from('division_references')
        .delete()
        .eq('division_id', id);

      if (deleteRefsError) {
        console.error("DivisionService: Error deleting references:", deleteRefsError);
        throw new Error(`Failed to delete existing references: ${deleteRefsError.message}`);
      }

      console.log("DivisionService: Deleting existing contacts");
      const { error: deleteContactsError } = await supabase
        .from('division_contacts')
        .delete()
        .eq('division_id', id);

      if (deleteContactsError) {
        console.error("DivisionService: Error deleting contacts:", deleteContactsError);
        throw new Error(`Failed to delete existing contacts: ${deleteContactsError.message}`);
      }

      // Create new references with validation
      if (divisionData.references && divisionData.references.length > 0) {
        console.log("DivisionService: Creating new references:", divisionData.references);
        
        const allowedReferenceTypes = ['GST', 'CIN', 'PAN'];
        const validReferences = divisionData.references.filter(ref => {
          const hasValue = ref.value && ref.value.trim();
          const validType = allowedReferenceTypes.includes(ref.type);
          
          if (!validType) {
            console.error("DivisionService: Invalid reference type:", ref.type, "Allowed:", allowedReferenceTypes);
          }
          if (!hasValue) {
            console.error("DivisionService: Empty reference value for:", ref.type);
          }
          
          return hasValue && validType;
        });
        
        if (validReferences.length > 0) {
          const references = validReferences.map(ref => ({
            division_id: id,
            reference_type: ref.type,
            reference_value: ref.value.trim(),
          }));

          console.log("DivisionService: Reference data to insert:", references);

          const { error: refError } = await supabase
            .from('division_references')
            .insert(references);

          if (refError) {
            console.error("DivisionService: Error creating references:", refError);
            throw new Error(`Failed to create references: ${refError.message}`);
          }
          console.log("DivisionService: References created successfully");
        }
      }

      // Create new contacts with validation and state_code
      if (divisionData.contacts && divisionData.contacts.length > 0) {
        console.log("DivisionService: Creating new contacts:", divisionData.contacts);
        
        const allowedContactTypes = ['Registered location', 'Billing', 'Shipping', 'Owner', 'Bill To', 'Remit To'];
        const validContacts = divisionData.contacts.filter(contact => {
          const validType = allowedContactTypes.includes(contact.type);
          
          if (!validType) {
            console.error("DivisionService: Invalid contact type:", contact.type, "Allowed:", allowedContactTypes);
          }
          
          return validType;
        });
        
        if (validContacts.length > 0) {
          const contacts = validContacts.map(contact => ({
            division_id: id,
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

          console.log("DivisionService: Contact data to insert with state codes:", contacts);

          const { error: contactError } = await supabase
            .from('division_contacts')
            .insert(contacts);

          if (contactError) {
            console.error("DivisionService: Error creating contacts:", contactError);
            throw new Error(`Failed to create contacts: ${contactError.message}`);
          }
          console.log("DivisionService: Contacts created successfully");
        }
      }

      console.log("DivisionService: Update process completed successfully");
      
      // Return the updated division with the new data
      const result: Division = {
        id: divData.id,
        code: divData.code,
        name: divData.name,
        organizationId: divData.organization_id,
        organizationCode: divData.organizations?.code || '',
        organizationName: divData.organizations?.name || '',
        type: divData.type as Division['type'],
        status: divData.status as 'active' | 'inactive',
        references: divisionData.references || [],
        contacts: divisionData.contacts || [],
        createdBy: divData.created_by,
        createdOn: divData.created_on ? new Date(divData.created_on) : undefined,
        updatedBy: divData.updated_by,
        updatedOn: divData.updated_on ? new Date(divData.updated_on) : undefined,
      };
      
      console.log("DivisionService: Returning result:", result);
      return result;
    } catch (error) {
      console.error("DivisionService: Error in updateDivision:", error);
      throw error;
    }
  },

  async deleteDivision(id: string): Promise<void> {
    console.log("Deleting division:", id);
    
    try {
      // Delete references and contacts first (due to foreign key constraints)
      await supabase.from('division_references').delete().eq('division_id', id);
      await supabase.from('division_contacts').delete().eq('division_id', id);
      
      // Then delete the division
      const { error } = await supabase
        .from('divisions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting division:", error);
        throw new Error(`Failed to delete division: ${error.message}`);
      }

      console.log("Division deleted successfully");
    } catch (error) {
      console.error("Service error deleting division:", error);
      throw error;
    }
  }
};
