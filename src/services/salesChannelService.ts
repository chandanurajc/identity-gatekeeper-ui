
import { supabase } from "@/integrations/supabase/client";
import { SalesChannel, SalesChannelFormData } from "@/types/salesChannel";

export const salesChannelService = {
  async getSalesChannels(): Promise<SalesChannel[]> {
    console.log("Fetching sales channels from Supabase...");
    
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

      const { data, error } = await supabase
        .from('sales_channels')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Supabase error fetching sales channels:", error);
        throw new Error(`Failed to fetch sales channels: ${error.message}`);
      }

      console.log("Raw sales channels data from Supabase:", data);
      
      if (!data) {
        console.log("No sales channels data returned");
        return [];
      }

      const transformedData = data.map(channel => ({
        id: channel.id,
        name: channel.name,
        status: channel.status as 'active' | 'inactive' | 'under_development' | 'maintenance',
        organizationId: channel.organization_id,
        createdBy: channel.created_by,
        createdOn: new Date(channel.created_on),
        updatedBy: channel.updated_by,
        updatedOn: channel.updated_on ? new Date(channel.updated_on) : undefined,
      }));

      console.log("Transformed sales channels data:", transformedData);
      return transformedData;
      
    } catch (error) {
      console.error("Service error fetching sales channels:", error);
      throw error;
    }
  },

  async createSalesChannel(formData: SalesChannelFormData, createdBy: string): Promise<void> {
    console.log("Creating sales channel:", formData, "created by:", createdBy);
    
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

      const { error } = await supabase
        .from('sales_channels')
        .insert({
          name: formData.name,
          status: formData.status,
          organization_id: profile.organization_id,
          created_by: createdBy,
          updated_by: createdBy,
        });

      if (error) {
        console.error("Error creating sales channel:", error);
        throw new Error(`Failed to create sales channel: ${error.message}`);
      }

      console.log("Sales channel created successfully");
      
    } catch (error) {
      console.error("Service error creating sales channel:", error);
      throw error;
    }
  },

  async updateSalesChannel(channelId: string, formData: SalesChannelFormData, updatedBy: string): Promise<void> {
    console.log("Updating sales channel:", { channelId, formData, updatedBy });
    
    try {
      const { error } = await supabase
        .from('sales_channels')
        .update({
          name: formData.name,
          status: formData.status,
          updated_by: updatedBy,
          updated_on: new Date().toISOString(),
        })
        .eq('id', channelId);

      if (error) {
        console.error("Error updating sales channel:", error);
        throw new Error(`Failed to update sales channel: ${error.message}`);
      }

      console.log("Sales channel updated successfully");
      
    } catch (error) {
      console.error("Service error updating sales channel:", error);
      throw error;
    }
  },

  async getActiveSalesChannels(): Promise<SalesChannel[]> {
    const allChannels = await this.getSalesChannels();
    return allChannels.filter(channel => channel.status === 'active');
  }
};
