
import { supabase } from "@/integrations/supabase/client";
import { Division, DivisionFormData } from "@/types/division";

export const divisionService = {
  async getDivisions(): Promise<Division[]> {
    console.log("Fetching divisions from Supabase...");
    
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

      // Fetch divisions (organizations with type 'Admin' for current organization)
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_references (
            reference_type,
            reference_value
          ),
          organization_contacts (
            contact_type,
            first_name,
            last_name,
            address1,
            address2,
            postal_code,
            city,
            state,
            country,
            phone_number,
            email,
            website
          )
        `)
        .eq('type', 'Admin')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error("Supabase error fetching divisions:", error);
        throw new Error(`Failed to fetch divisions: ${error.message}`);
      }

      if (!data) {
        console.log("No divisions data returned");
        return [];
      }

      const transformedData = data.map(org => ({
        id: org.id,
        code: org.code,
        name: org.name,
        organizationId: org.id,
        organizationCode: org.code,
        organizationName: org.name,
        type: org.type as 'Supplier' | 'Retailer' | 'Retail customer' | 'Wholesale customer',
        status: org.status as 'active' | 'inactive',
        references: org.organization_references?.map(ref => ({
          id: ref.reference_type,
          type: ref.reference_type as 'GST' | 'CIN' | 'PAN',
          value: ref.reference_value
        })) || [],
        contacts: org.organization_contacts?.map(contact => ({
          id: contact.contact_type,
          type: contact.contact_type as 'Registered location' | 'Billing' | 'Shipping' | 'Owner',
          firstName: contact.first_name,
          lastName: contact.last_name,
          address1: contact.address1 || '',
          address2: contact.address2,
          postalCode: contact.postal_code || '',
          city: contact.city || '',
          state: contact.state || '',
          country: contact.country || '',
          phoneNumber: contact.phone_number || '',
          email: contact.email,
          website: contact.website
        })) || [],
        createdBy: org.created_by,
        createdOn: new Date(org.created_on),
        updatedBy: org.updated_by,
        updatedOn: org.updated_on ? new Date(org.updated_on) : undefined,
      }));

      console.log("Transformed divisions data:", transformedData);
      return transformedData;
      
    } catch (error) {
      console.error("Service error fetching divisions:", error);
      throw error;
    }
  },

  async getActiveDivisions(): Promise<Division[]> {
    const divisions = await this.getDivisions();
    return divisions.filter(division => division.status === 'active');
  },

  async getAllDivisions(): Promise<Division[]> {
    return this.getDivisions();
  },

  async getDivisionById(id: string): Promise<Division | null> {
    console.log("Fetching division by ID:", id);
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_references (
            reference_type,
            reference_value
          ),
          organization_contacts (
            contact_type,
            first_name,
            last_name,
            address1,
            address2,
            postal_code,
            city,
            state,
            country,
            phone_number,
            email,
            website
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching division:", error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        code: data.code,
        name: data.name,
        organizationId: data.id,
        organizationCode: data.code,
        organizationName: data.name,
        type: data.type as 'Supplier' | 'Retailer' | 'Retail customer' | 'Wholesale customer',
        status: data.status as 'active' | 'inactive',
        references: data.organization_references?.map(ref => ({
          id: ref.reference_type,
          type: ref.reference_type as 'GST' | 'CIN' | 'PAN',
          value: ref.reference_value
        })) || [],
        contacts: data.organization_contacts?.map(contact => ({
          id: contact.contact_type,
          type: contact.contact_type as 'Registered location' | 'Billing' | 'Shipping' | 'Owner',
          firstName: contact.first_name,
          lastName: contact.last_name,
          address1: contact.address1 || '',
          address2: contact.address2,
          postalCode: contact.postal_code || '',
          city: contact.city || '',
          state: contact.state || '',
          country: contact.country || '',
          phoneNumber: contact.phone_number || '',
          email: contact.email,
          website: contact.website
        })) || [],
        createdBy: data.created_by,
        createdOn: new Date(data.created_on),
        updatedBy: data.updated_by,
        updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Service error fetching division:", error);
      throw error;
    }
  },

  async createDivision(formData: DivisionFormData, createdBy: string): Promise<Division> {
    console.log("Creating division:", formData);
    
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

      // Generate division code (org code + user defined code)
      const orgCode = profile.organization_id.toString().substring(0, 4);
      const divisionCode = `${orgCode}${formData.userDefinedCode}`;

      // Create division (organization record)
      const { data: divisionData, error: divisionError } = await supabase
        .from('organizations')
        .insert({
          code: divisionCode,
          name: formData.name,
          type: formData.type,
          status: formData.status,
          created_by: createdBy
        })
        .select()
        .single();

      if (divisionError) {
        console.error("Error creating division:", divisionError);
        throw new Error(`Failed to create division: ${divisionError.message}`);
      }

      // Create references
      if (formData.references.length > 0) {
        const referencesData = formData.references.map(ref => ({
          organization_id: divisionData.id,
          reference_type: ref.type,
          reference_value: ref.value
        }));

        const { error: refError } = await supabase
          .from('organization_references')
          .insert(referencesData);

        if (refError) {
          console.error("Error creating references:", refError);
          throw new Error(`Failed to create references: ${refError.message}`);
        }
      }

      // Create contacts
      if (formData.contacts.length > 0) {
        const contactsData = formData.contacts.map(contact => ({
          organization_id: divisionData.id,
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
          website: contact.website
        }));

        const { error: contactError } = await supabase
          .from('organization_contacts')
          .insert(contactsData);

        if (contactError) {
          console.error("Error creating contacts:", contactError);
          throw new Error(`Failed to create contacts: ${contactError.message}`);
        }
      }

      return await this.getDivisionById(divisionData.id) as Division;
    } catch (error) {
      console.error("Service error creating division:", error);
      throw error;
    }
  },

  async updateDivision(id: string, formData: DivisionFormData, updatedBy: string): Promise<Division> {
    console.log("Updating division:", id, formData);
    
    try {
      // Update division (organization record)
      const { error: divisionError } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          type: formData.type,
          status: formData.status,
          updated_by: updatedBy,
          updated_on: new Date().toISOString()
        })
        .eq('id', id);

      if (divisionError) {
        console.error("Error updating division:", divisionError);
        throw new Error(`Failed to update division: ${divisionError.message}`);
      }

      // Delete existing references and recreate
      const { error: deleteRefError } = await supabase
        .from('organization_references')
        .delete()
        .eq('organization_id', id);

      if (deleteRefError) {
        console.error("Error deleting references:", deleteRefError);
        throw new Error(`Failed to delete references: ${deleteRefError.message}`);
      }

      // Create new references
      if (formData.references.length > 0) {
        const referencesData = formData.references.map(ref => ({
          organization_id: id,
          reference_type: ref.type,
          reference_value: ref.value
        }));

        const { error: refError } = await supabase
          .from('organization_references')
          .insert(referencesData);

        if (refError) {
          console.error("Error creating references:", refError);
          throw new Error(`Failed to create references: ${refError.message}`);
        }
      }

      // Delete existing contacts and recreate
      const { error: deleteContactError } = await supabase
        .from('organization_contacts')
        .delete()
        .eq('organization_id', id);

      if (deleteContactError) {
        console.error("Error deleting contacts:", deleteContactError);
        throw new Error(`Failed to delete contacts: ${deleteContactError.message}`);
      }

      // Create new contacts
      if (formData.contacts.length > 0) {
        const contactsData = formData.contacts.map(contact => ({
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
          website: contact.website
        }));

        const { error: contactError } = await supabase
          .from('organization_contacts')
          .insert(contactsData);

        if (contactError) {
          console.error("Error creating contacts:", contactError);
          throw new Error(`Failed to create contacts: ${contactError.message}`);
        }
      }

      return await this.getDivisionById(id) as Division;
    } catch (error) {
      console.error("Service error updating division:", error);
      throw error;
    }
  }
};
