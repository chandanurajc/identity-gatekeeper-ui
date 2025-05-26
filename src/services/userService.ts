
import { supabase } from "@/integrations/supabase/client";
import { User, UserFormData, PhoneNumber } from "@/types/user";

export const userService = {
  async getUsers(): Promise<User[]> {
    console.log("Fetching users...");
    
    try {
      // First fetch users without organization join
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_on', { ascending: false });

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      // Then fetch organizations separately
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name');

      if (orgsError) {
        console.error("Error fetching organizations:", orgsError);
        // Don't throw error here, just log it and continue without org names
        console.warn("Organizations data not available");
      }

      // Create a map of organization id to name for quick lookup
      const orgMap = new Map();
      if (orgsData) {
        orgsData.forEach(org => orgMap.set(org.id, org.name));
      }

      console.log("Users fetched successfully:", usersData);
      
      // Transform database data to match User interface
      return (usersData || []).map(user => ({
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
        organizationName: user.organization_id ? orgMap.get(user.organization_id) : undefined,
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
      // Fetch user without organization join
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
        if (userError.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      // Fetch organization name if user has organization_id
      let organizationName = undefined;
      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', userData.organization_id)
          .single();
        
        if (!orgError && orgData) {
          organizationName = orgData.name;
        }
      }

      console.log("User fetched successfully:", userData);
      
      // Transform database data to match User interface
      return {
        id: userData.id,
        username: userData.username,
        email: userData.username, // Using username as email since they're the same
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone ? userData.phone as unknown as PhoneNumber : undefined,
        designation: userData.designation,
        roles: [], // Will be populated by separate query if needed
        status: userData.status,
        organizationId: userData.organization_id,
        organizationName: organizationName,
        effectiveFrom: new Date(userData.effective_from),
        effectiveTo: userData.effective_to ? new Date(userData.effective_to) : undefined,
        createdBy: userData.created_by,
        createdOn: new Date(userData.created_on),
        updatedBy: userData.updated_by,
        updatedOn: userData.updated_on ? new Date(userData.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Error in getUserById:", error);
      throw error;
    }
  },

  async createUser(userData: UserFormData, createdByUserName: string): Promise<User> {
    console.log("Creating user with data:", userData);
    console.log("Created by user name:", createdByUserName);
    
    // Generate a UUID for the new user
    const userId = crypto.randomUUID();
    
    const newUser = {
      id: userId,
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

    const { data, error } = await supabase
      .from('profiles')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    console.log("User created successfully:", data);
    
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
