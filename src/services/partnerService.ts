import { supabase } from "@/integrations/supabase/client";
import { Partner, PartnerFormData, OrganizationSearchResult } from "@/types/partner";

export const partnerService = {
  async getPartners(currentOrganizationId: string): Promise<Partner[]> {
    console.log("Fetching partners from Supabase for org:", currentOrganizationId);
    
    try {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations!partners_organization_id_fkey(code, name, type),
          current_organization:organizations!partners_current_organization_id_fkey(id, code, name)
        `)
        .eq('current_organization_id', currentOrganizationId)
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
        currentOrganizationId: partner.current_organization_id,
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

  async getSupplierPartners(currentOrganizationId: string): Promise<Partner[]> {
    console.log("Fetching supplier partners from Supabase for org:", currentOrganizationId);
    
    try {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          organization:organizations!partners_organization_id_fkey(code, name, type)
        `)
        .eq('current_organization_id', currentOrganizationId)
        .eq('status', 'active')
        .eq('organization.type', 'Supplier')
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching supplier partners:", error);
        throw new Error(`Failed to fetch supplier partners: ${error.message}`);
      }
      
      if (!data) {
        return [];
      }

      const transformedData: Partner[] = [];
      for (const partner of data) {
        if (partner.organization) {
          const mappedPartner: Partner = {
            id: partner.id,
            organizationId: partner.organization_id,
            organizationCode: partner.organization.code,
            organizationName: partner.organization.name,
            organizationType: partner.organization.type,
            currentOrganizationId: partner.current_organization_id,
            status: partner.status as 'active' | 'inactive',
            partnershipDate: new Date(partner.partnership_date),
            createdBy: partner.created_by,
            createdOn: new Date(partner.created_on),
          };

          if (partner.updated_by) {
            mappedPartner.updatedBy = partner.updated_by;
          }
          if (partner.updated_on) {
            mappedPartner.updatedOn = new Date(partner.updated_on);
          }
          transformedData.push(mappedPartner);
        }
      }

      return transformedData;
      
    } catch (error) {
      console.error("Service error fetching supplier partners:", error);
      throw error;
    }
  },

  async searchOrganizations(searchType: 'code' | 'gst', searchTerm: string): Promise<OrganizationSearchResult[]> {
    console.log("Searching organizations:", { searchType, searchTerm });
    
    try {
      if (searchType === 'code') {
        // Exact case-insensitive search for organizations by code using ilike with exact match
        const { data, error } = await supabase
          .from('organizations')
          .select('id, code, name, type')
          .eq('status', 'active')
          .ilike('code', searchTerm)
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
        // Exact case-insensitive search in the organization_references table using ilike with exact match
        const { data, error } = await supabase
          .from('organization_references')
          .select(`
            organization_id,
            reference_value,
            organizations!inner(id, code, name, type, status)
          `)
          .eq('reference_type', 'GST')
          .eq('organizations.status', 'active')
          .ilike('reference_value', searchTerm)
          .limit(20);

        if (error) {
          console.error("Error searching organizations by GST:", error);
          throw new Error(`Failed to search organizations: ${error.message}`);
        }

        if (!data || data.length === 0) {
          console.log("No organizations found with GST:", searchTerm);
          return [];
        }

        console.log("Organization search results by GST:", data);
        return data.map(ref => ({
          id: ref.organizations.id,
          code: ref.organizations.code,
          name: ref.organizations.name,
          type: ref.organizations.type || 'Unknown',
          gstNumber: ref.reference_value,
        }));
      }

      return [];
      
    } catch (error) {
      console.error("Service error searching organizations:", error);
      throw error;
    }
  },

  async createPartnerships(organizationIds: string[], currentOrganizationId: string, createdBy: string): Promise<void> {
    console.log("Creating partnerships for organizations:", organizationIds, "current org:", currentOrganizationId);
    
    try {
      const partnerships = organizationIds.map(orgId => ({
        organization_id: orgId,
        current_organization_id: currentOrganizationId,
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
