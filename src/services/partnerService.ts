
import { supabase } from "@/integrations/supabase/client";
import { Partner, PartnerFormData, OrganizationSearchResult } from "@/types/partner";

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
      if (searchType === 'code') {
        // Exact search for organizations by code
        const { data, error } = await supabase
          .from('organizations')
          .select('id, code, name, type')
          .eq('status', 'active')
          .eq('code', searchTerm)
          .limit(20);

        if (error) {
          console.error("Error searching organizations by code:", error);
          throw new Error(`Failed to search organizations: ${error.message}`);
        }

        if (!data) {
          return [];
        }

        console.log("Organization search results by code:", data);
        return data.map(org => ({
          id: org.id,
          code: org.code,
          name: org.name,
          type: org.type || 'Unknown',
        }));

      } else if (searchType === 'gst') {
        // First search in the organization_references table (traditional approach)
        const { data: refData, error: refError } = await supabase
          .from('organization_references')
          .select(`
            organization_id,
            reference_value,
            organizations!inner(id, code, name, type, status)
          `)
          .eq('reference_type', 'GST')
          .eq('organizations.status', 'active')
          .eq('reference_value', searchTerm)
          .limit(20);

        if (refError) {
          console.error("Error searching organizations by GST in references table:", refError);
        }

        // Then search in JSON column (organizations.organization_references)
        const { data: jsonData, error: jsonError } = await supabase
          .from('organizations')
          .select('id, code, name, type')
          .eq('status', 'active')
          .contains('organization_references', [{ type: 'GST', value: searchTerm }])
          .limit(20);

        if (jsonError) {
          console.error("Error searching organizations by GST in JSON column:", jsonError);
        }

        // Combine results from both searches, removing duplicates by id
        let results: OrganizationSearchResult[] = [];
        
        // Add results from references table
        if (refData && refData.length > 0) {
          console.log("Organization search results by GST from references table:", refData);
          const refResults = refData.map(ref => ({
            id: ref.organizations.id,
            code: ref.organizations.code,
            name: ref.organizations.name,
            type: ref.organizations.type || 'Unknown',
            gstNumber: ref.reference_value,
          }));
          results = [...refResults];
        }
        
        // Add results from JSON column if not already in results
        if (jsonData && jsonData.length > 0) {
          console.log("Organization search results by GST from JSON column:", jsonData);
          const jsonResults = jsonData.map(org => ({
            id: org.id,
            code: org.code,
            name: org.name,
            type: org.type || 'Unknown',
            gstNumber: searchTerm,
          }));
          
          // Add only unique results
          for (const jsonResult of jsonResults) {
            if (!results.some(r => r.id === jsonResult.id)) {
              results.push(jsonResult);
            }
          }
        }

        console.log("Combined organization search results by GST:", results);
        return results;
      }

      return [];
      
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
