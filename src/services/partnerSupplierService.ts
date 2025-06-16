
import { supabase } from "@/integrations/supabase/client";
import { Organization } from "@/types/organization";

export const partnerSupplierService = {
  async getPartnerSuppliers(currentOrganizationId: string): Promise<Organization[]> {
    console.log("Fetching partner suppliers from Supabase for org:", currentOrganizationId);
    
    try {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          organization:organizations!partners_organization_id_fkey(
            id,
            code,
            name,
            type,
            status
          )
        `)
        .eq('current_organization_id', currentOrganizationId)
        .eq('status', 'active')
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching partner suppliers:", error);
        throw new Error(`Failed to fetch partner suppliers: ${error.message}`);
      }
      
      if (!data) {
        return [];
      }

      // Filter for suppliers and transform data
      const suppliers: Organization[] = data
        .filter((partner): partner is typeof partner & { organization: { id: string; code: string; name: string; type: string; status: string } } => 
          partner.organization !== null && 
          partner.organization.type === 'Supplier' && 
          partner.organization.status === 'active'
        )
        .map(partner => ({
          id: partner.organization.id,
          code: partner.organization.code,
          name: partner.organization.name,
          type: partner.organization.type as 'Admin' | 'Customer' | 'Supplier',
          status: partner.organization.status as 'active' | 'inactive',
          references: [], // Add required empty arrays
          contacts: [], // Add required empty arrays
          createdBy: '',
          createdOn: new Date(),
        }));

      console.log("Transformed partner suppliers:", suppliers);
      return suppliers;
      
    } catch (error) {
      console.error("Service error fetching partner suppliers:", error);
      throw error;
    }
  }
};
