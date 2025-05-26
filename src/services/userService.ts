
import { supabase } from "@/integrations/supabase/client";
import { User, UserFormData, PhoneNumber } from "@/types/user";

export const userService = {
  async getUsers(): Promise<User[]> {
    console.log("Fetching users...");
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          )
        `)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      console.log("Users fetched successfully:", data);
      
      // Transform database data to match User interface
      return (data || []).map(user => ({
        id: user.id,
        username: user.username,
        email: user.username, // Using username as email since they're the same
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone ? user.phone as unknown as PhoneNumber : undefined,
        designation: user.designation,
        roles: [], // Will be populated by separate query if needed
        status: user.status,
        organizationId: user.organization_id,
        organizationName: user.organizations?.name,
        effectiveFrom: new Date(user.effective_from),
        effectiveTo: user.effective_to ? new Date(user.effective_to) : undefined,
        createdBy: user.created_by,
        createdOn: new Date(user.created_on),
        updatedBy: user.updated_by,
        updatedOn: user.updated_on ? new Date(user.updated_on) : undefined,
      }));
    } catch (error) {
      console.error("Error in getUsers:", error);
      throw error;
    }
  },

  // Alias for backward compatibility
  async getAllUsers(): Promise<User[]> {
    return this.getUsers();
  },

  async getUserById(id: string): Promise<User | null> {
    console.log("Fetching user by ID:", id);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching user:", error);
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      console.log("User fetched successfully:", data);
      
      // Transform database data to match User interface
      return {
        id: data.id,
        username: data.username,
        email: data.username, // Using username as email since they're the same
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone ? data.phone as unknown as PhoneNumber : undefined,
        designation: data.designation,
        roles: [], // Will be populated by separate query if needed
        status: data.status,
        organizationId: data.organization_id,
        organizationName: data.organizations?.name,
        effectiveFrom: new Date(data.effective_from),
        effectiveTo: data.effective_to ? new Date(data.effective_to) : undefined,
        createdBy: data.created_by,
        createdOn: new Date(data.created_on),
        updatedBy: data.updated_by,
        updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Error in getUserById:", error);
      throw error;
    }
  },

  async createUser(userData: UserFormData, createdByUserName: string): Promise<User> {
    console.log("Creating user with data:", userData);
    console.log("Created by user name:", createdByUserName);
    
    try {
      // First, create the authenticated user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.username,
        password: userData.password || 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName
        }
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        throw new Error(`Failed to create authenticated user: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("No user data returned from auth creation");
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Then, create/update the profile record
      const profileData = {
        id: authData.user.id,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone as any,
        designation: userData.designation,
        organization_id: userData.organizationId,
        effective_from: userData.effectiveFrom.toISOString(),
        effective_to: userData.effectiveTo?.toISOString() || null,
        created_by: createdByUserName,
        updated_by: createdByUserName,
      };

      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Clean up the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log("User profile created successfully:", profileResult);
      
      // Transform response back to User interface
      return {
        id: profileResult.id,
        username: profileResult.username,
        email: profileResult.username,
        firstName: profileResult.first_name,
        lastName: profileResult.last_name,
        phone: profileResult.phone ? profileResult.phone as unknown as PhoneNumber : undefined,
        designation: profileResult.designation,
        roles: userData.roles,
        status: profileResult.status,
        organizationId: profileResult.organization_id,
        effectiveFrom: new Date(profileResult.effective_from),
        effectiveTo: profileResult.effective_to ? new Date(profileResult.effective_to) : undefined,
        createdBy: profileResult.created_by,
        createdOn: new Date(profileResult.created_on),
        updatedBy: profileResult.updated_by,
        updatedOn: profileResult.updated_on ? new Date(profileResult.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  },

  async updateUser(id: string, userData: UserFormData, updatedByUserName: string): Promise<User> {
    console.log("Updating user:", id, "with data:", userData);
    console.log("Updated by user name:", updatedByUserName);
    
    const updateData = {
      username: userData.username,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone as any,
      designation: userData.designation,
      organization_id: userData.organizationId,
      effective_from: userData.effectiveFrom.toISOString(),
      effective_to: userData.effectiveTo?.toISOString() || null,
      updated_by: updatedByUserName,
      updated_on: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    console.log("User updated successfully:", data);
    
    // Transform response back to User interface
    return {
      id: data.id,
      username: data.username,
      email: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone ? data.phone as unknown as PhoneNumber : undefined,
      designation: data.designation,
      roles: userData.roles,
      status: data.status,
      organizationId: data.organization_id,
      effectiveFrom: new Date(data.effective_from),
      effectiveTo: data.effective_to ? new Date(data.effective_to) : undefined,
      createdBy: data.created_by,
      createdOn: new Date(data.created_on),
      updatedBy: data.updated_by,
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    };
  },

  async deleteUser(id: string): Promise<void> {
    console.log("Deleting user:", id);
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting user:", error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    console.log("User deleted successfully");
  },

  async getUserPermissions(userId: string): Promise<string[]> {
    console.log("Fetching user permissions for user:", userId);
    
    // For now, return empty array since we don't have proper role relationships
    console.log("User permissions fetched successfully:", []);
    return [];
  }
};

// Export individual functions for backward compatibility
export const { getUserPermissions, createUser, getUserById, updateUser, getAllUsers } = userService;
