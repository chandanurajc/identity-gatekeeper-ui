
import { supabase } from "@/integrations/supabase/client";
import { Partner, PartnerFormData, OrganizationSearchResult } from "@/types/partner";

// Define the structure of organization references
interface OrganizationReference {
  type: string;
  value: string;
}

export const partnerService = {
  async getPartners(): Promise<Partner[]> {
    console.log("Fetching partners from Supabase...");
    
    try {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations(code, name, type)
        `)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching partners:", error);
        throw new Error(`Failed to fetch partners: ${error.message}`);
      }

      console.log("Raw partners data from Supabase:", data);
      
      if (!data) {
        console.log("No partners data returned");
        return [];
      }

      // Transform database data to match Partner interface
      const transformedData = data.map(partner => ({
        id: partner.id,
        organizationId: partner.organization_id,
        organizationCode: partner.organization?.code || '',
        organizationName: partner.organization?.name || '',
        organizationType: partner.organization?.type || '',
        status: partner.status as 'active' | 'inactive',
        partnershipDate: new Date(partner.partnership_date),
        createdBy: partner.created_by,
        createdOn: new Date(partner.created_on),
        updatedBy: partner.updated_by,
        updatedOn: partner.updated_on ? new Date(partner.updated_on) : undefined,
      }));

      console.log("Transformed partners data:", transformedData);
      return transformedData;
      
    } catch (error) {
      console.error("Service error fetching partners:", error);
      throw error;
    }
  },

  async searchOrganizations(searchType: 'code' | 'gst', searchTerm: string): Promise<OrganizationSearchResult[]> {
    console.log("Searching organizations:", { searchType, searchTerm });
    
    try {
      let query = supabase
        .from('organizations')
        .select('id, code, name, type, organization_references')
        .eq('status', 'active');

      if (searchType === 'code') {
        query = query.ilike('code', `%${searchTerm}%`);
      } else if (searchType === 'gst') {
        // Search in organization_references for GST numbers
        query = query.contains('organization_references', [{ type: 'GST', value: searchTerm }]);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error("Error searching organizations:", error);
        throw new Error(`Failed to search organizations: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      // Transform to search results
      const results = data.map(org => {
        let gstNumber: string | undefined;
        
        // Safely parse organization_references
        if (org.organization_references && Array.isArray(org.organization_references)) {
          const gstRef = (org.organization_references as OrganizationReference[])
            .find(ref => ref.type === 'GST');
          gstNumber = gstRef?.value;
        }
        
        return {
          id: org.id,
          code: org.code,
          name: org.name,
          type: org.type || 'Unknown',
          gstNumber,
        };
      });

      console.log("Organization search results:", results);
      return results;
      
    } catch (error) {
      console.error("Service error searching organizations:", error);
      throw error;
    }
  },

  async createPartnerships(organizationIds: string[], createdBy: string): Promise<void> {
    console.log("Creating partnerships for organizations:", organizationIds);
    
    try {
      const partnerships = organizationIds.map(orgId => ({
        organization_id: orgId,
        status: 'active',
        partnership_date: new Date().toISOString(),
        created_by: createdBy,
        updated_by: createdBy,
      }));

      const { error } = await supabase
        .from('partners')
        .insert(partnerships);

      if (error) {
        console.error("Error creating partnerships:", error);
        throw new Error(`Failed to create partnerships: ${error.message}`);
      }

      console.log("Partnerships created successfully");
      
    } catch (error) {
      console.error("Service error creating partnerships:", error);
      throw error;
    }
  },

  async updatePartnerStatus(partnerId: string, status: 'active' | 'inactive', updatedBy: string): Promise<void> {
    console.log("Updating partner status:", { partnerId, status, updatedBy });
    
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          status,
          updated_by: updatedBy,
          updated_on: new Date().toISOString(),
        })
        .eq('id', partnerId);

      if (error) {
        console.error("Error updating partner status:", error);
        throw new Error(`Failed to update partner status: ${error.message}`);
      }

      console.log("Partner status updated successfully");
      
    } catch (error) {
      console.error("Service error updating partner status:", error);
      throw error;
    }
  }
};
