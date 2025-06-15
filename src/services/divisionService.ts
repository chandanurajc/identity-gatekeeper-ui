import { supabase } from "@/integrations/supabase/client";
import { Division, DivisionFormData } from "@/types/division";

export const divisionService = {
  async getDivisions(): Promise<Division[]> {
    const startAll = Date.now();
    console.log("Fetching divisions from Supabase...");
    try {
      // 1. Get current user's organization
      const startAuth = Date.now();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log(`[DivisionsService] Supabase getUser time: ${Date.now() - startAuth}ms`);
      if (userError) {
        console.error("[DivisionsService] Error fetching user:", userError);
        return [];
      }
      if (!user) {
        throw new Error("User not authenticated");
      }

      const startProfile = Date.now();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      console.log(`[DivisionsService] Supabase get profile time: ${Date.now() - startProfile}ms`);

      if (profileError) {
        console.error("[DivisionsService] Error fetching profile:", profileError);
        return [];
      }
      if (!profile?.organization_id) {
        console.log("[DivisionsService] No organization found for user");
        return [];
      }

      // 2. Fetch organization data JUST ONCE, not per division
      const startOrg = Date.now();
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('code, name')
        .eq('id', profile.organization_id)
        .single();
      console.log(`[DivisionsService] Supabase get org time: ${Date.now() - startOrg}ms`);
      if (orgError || !orgData) {
        console.error("[DivisionsService] Error fetching organization:", orgError);
        throw new Error("Failed to fetch organization data");
      }

      // 3. Fetch divisions for this organization
      const startDivs = Date.now();
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions')
        .select(`
          *,
          division_references (
            reference_type,
            reference_value
          ),
          division_contacts (
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
        .eq('organization_id', profile.organization_id)
        .order('name');
      console.log(`[DivisionsService] Supabase get divisions time: ${Date.now() - startDivs}ms`);

      if (divisionsError) {
        console.error("[DivisionsService] Supabase error fetching divisions:", divisionsError);
        throw new Error(`Failed to fetch divisions: ${divisionsError.message}`);
      }

      if (!divisionsData) {
        console.log("[DivisionsService] No divisions data returned");
        return [];
      }

      // 4. Transform division data and log results
      const transformedData = divisionsData.map(division => ({
        id: division.id,
        code: division.code,
        name: division.name,
        organizationId: division.organization_id,
        organizationCode: orgData.code,
        organizationName: orgData.name,
        type: division.type as 'Supplier' | 'Retailer' | 'Retail customer' | 'Wholesale customer',
        status: division.status as 'active' | 'inactive',
        references: division.division_references?.map(ref => ({
          id: ref.reference_type,
          type: ref.reference_type as 'GST' | 'CIN' | 'PAN',
          value: ref.reference_value
        })) || [],
        contacts: division.division_contacts?.map(contact => ({
          id: contact.contact_type,
          type: contact.contact_type as 'Registered location' | 'Billing' | 'Shipping' | 'Owner',
          firstName: contact.first_name,
          lastName: contact.last_name || "",
          address1: contact.address1 || '',
          address2: contact.address2 || "",
          postalCode: contact.postal_code || '',
          city: contact.city || '',
          state: contact.state || '',
          country: contact.country || '',
          phoneNumber: contact.phone_number || '',
          email: contact.email || "",
          website: contact.website || ""
        })) || [],
        createdBy: division.created_by,
        createdOn: division.created_on ? new Date(division.created_on) : undefined,
        updatedBy: division.updated_by,
        updatedOn: division.updated_on ? new Date(division.updated_on) : undefined,
      }));

      console.log(`[DivisionsService] Transformed divisions count: ${transformedData.length}`);
      console.log(`[DivisionsService] Total time: ${Date.now() - startAll}ms`);
      return transformedData;

    } catch (error) {
      console.error("[DivisionsService] Service error fetching divisions:", error);
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
      // First fetch the division
      const { data: divisionData, error: divisionError } = await supabase
        .from('divisions')
        .select(`
          *,
          division_references (
            reference_type,
            reference_value
          ),
          division_contacts (
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

      if (divisionError) {
        console.error("Error fetching division:", divisionError);
        return null;
      }

      if (!divisionData) return null;

      // Then fetch organization data
      const { data: organizationData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, code')
        .eq('id', divisionData.organization_id)
        .single();

      if (orgError || !organizationData) {
        console.error("Error fetching organization:", orgError);
        return null;
      }

      return {
        id: divisionData.id,
        code: divisionData.code,
        name: divisionData.name,
        organizationId: divisionData.organization_id,
        organizationCode: organizationData.code,
        organizationName: organizationData.name,
        type: divisionData.type as 'Supplier' | 'Retailer' | 'Retail customer' | 'Wholesale customer',
        status: divisionData.status as 'active' | 'inactive',
        references: divisionData.division_references?.map(ref => ({
          id: ref.reference_type,
          type: ref.reference_type as 'GST' | 'CIN' | 'PAN',
          value: ref.reference_value
        })) || [],
        contacts: divisionData.division_contacts?.map(contact => ({
          id: contact.contact_type,
          type: contact.contact_type as 'Registered location' | 'Billing' | 'Shipping' | 'Owner',
          firstName: contact.first_name,
          lastName: contact.last_name || "",
          address1: contact.address1 || '',
          address2: contact.address2 || "",
          postalCode: contact.postal_code || '',
          city: contact.city || '',
          state: contact.state || '',
          country: contact.country || '',
          phoneNumber: contact.phone_number || '',
          email: contact.email || "",
          website: contact.website || ""
        })) || [],
        createdBy: divisionData.created_by,
        createdOn: new Date(divisionData.created_on),
        updatedBy: divisionData.updated_by,
        updatedOn: divisionData.updated_on ? new Date(divisionData.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Service error fetching division:", error);
      throw error;
    }
  },

  async createDivision(formData: DivisionFormData, createdBy: string): Promise<Division> {
    console.log("Creating division:", formData);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.organizationId || !formData.userDefinedCode) {
        throw new Error("Missing required fields: name, organizationId, or userDefinedCode");
      }

      // Get organization code for division code generation
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('code')
        .eq('id', formData.organizationId)
        .single();

      if (orgError || !orgData) {
        console.error("Organization fetch error:", orgError);
        throw new Error("Organization not found");
      }

      // Generate division code (org code + user defined code)
      const divisionCode = `${orgData.code}${formData.userDefinedCode}`;

      // Check if division code already exists
      const { data: existingDivision } = await supabase
        .from('divisions')
        .select('code')
        .eq('code', divisionCode)
        .single();

      if (existingDivision) {
        throw new Error(`Division code ${divisionCode} already exists`);
      }

      // Create division record
      const { data: divisionData, error: divisionError } = await supabase
        .from('divisions')
        .insert({
          code: divisionCode,
          name: formData.name,
          organization_id: formData.organizationId,
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

      // Create references if any
      if (formData.references && formData.references.length > 0) {
        const referencesData = formData.references.map(ref => ({
          division_id: divisionData.id,
          reference_type: ref.type,
          reference_value: ref.value
        }));

        const { error: refError } = await supabase
          .from('division_references')
          .insert(referencesData);

        if (refError) {
          console.error("Error creating references:", refError);
          // Don't fail the whole operation for references
        }
      }

      // Create contacts
      if (formData.contacts && formData.contacts.length > 0) {
        const contactsData = formData.contacts.map(contact => ({
          division_id: divisionData.id,
          contact_type: contact.type,
          first_name: contact.firstName,
          last_name: contact.lastName || "",
          address1: contact.address1,
          address2: contact.address2 || "",
          postal_code: contact.postalCode,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          phone_number: contact.phoneNumber,
          email: contact.email || "",
          website: contact.website || ""
        }));

        const { error: contactError } = await supabase
          .from('division_contacts')
          .insert(contactsData);

        if (contactError) {
          console.error("Error creating contacts:", contactError);
          throw new Error(`Failed to create contacts: ${contactError.message}`);
        }
      }

      // Return the created division
      const createdDivision = await this.getDivisionById(divisionData.id);
      if (!createdDivision) {
        throw new Error("Failed to fetch created division");
      }

      return createdDivision;
    } catch (error) {
      console.error("Service error creating division:", error);
      throw error;
    }
  },

  async updateDivision(id: string, formData: DivisionFormData, updatedBy: string): Promise<Division> {
    console.log("Updating division:", id, formData);
    
    try {
      // Update division record
      const { error: divisionError } = await supabase
        .from('divisions')
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
        .from('division_references')
        .delete()
        .eq('division_id', id);

      if (deleteRefError) {
        console.error("Error deleting references:", deleteRefError);
        throw new Error(`Failed to delete references: ${deleteRefError.message}`);
      }

      // Create new references
      if (formData.references.length > 0) {
        const referencesData = formData.references.map(ref => ({
          division_id: id,
          reference_type: ref.type,
          reference_value: ref.value
        }));

        const { error: refError } = await supabase
          .from('division_references')
          .insert(referencesData);

        if (refError) {
          console.error("Error creating references:", refError);
          throw new Error(`Failed to create references: ${refError.message}`);
        }
      }

      // Delete existing contacts and recreate
      const { error: deleteContactError } = await supabase
        .from('division_contacts')
        .delete()
        .eq('division_id', id);

      if (deleteContactError) {
        console.error("Error deleting contacts:", deleteContactError);
        throw new Error(`Failed to delete contacts: ${deleteContactError.message}`);
      }

      // Create new contacts
      if (formData.contacts.length > 0) {
        const contactsData = formData.contacts.map(contact => ({
          division_id: id,
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
          .from('division_contacts')
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
