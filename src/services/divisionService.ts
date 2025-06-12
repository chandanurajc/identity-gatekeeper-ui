
import { supabase } from "@/integrations/supabase/client";
import { Division } from "@/types/division";

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
  }
};
