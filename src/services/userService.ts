
import { supabase } from "@/integrations/supabase/client";
import { User, UserFormData } from "@/types/user";

export const userService = {
  async getUsers(): Promise<User[]> {
    console.log("Fetching users...");
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          role_id,
          roles (*)
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
      phone: user.phone,
      designation: user.designation,
      roles: user.user_roles?.map((ur: any) => ur.roles?.name) || [],
      status: user.status,
      organizationId: user.organization_id,
      effectiveFrom: new Date(user.effective_from),
      effectiveTo: user.effective_to ? new Date(user.effective_to) : undefined,
      createdBy: user.created_by,
      createdOn: new Date(user.created_on),
      updatedBy: user.updated_by,
      updatedOn: user.updated_on ? new Date(user.updated_on) : undefined,
    }));
  },

  // Alias for backward compatibility
  async getAllUsers(): Promise<User[]> {
    return this.getUsers();
  },

  async getUserById(id: string): Promise<User | null> {
    console.log("Fetching user by ID:", id);
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          role_id,
          roles (*)
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
      phone: data.phone,
      designation: data.designation,
      roles: data.user_roles?.map((ur: any) => ur.roles?.name) || [],
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

  async createUser(userData: UserFormData, createdBy: string): Promise<User> {
    console.log("Creating user with data:", userData);
    
    const newUser = {
      username: userData.username,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      designation: userData.designation,
      organization_id: userData.organizationId,
      effective_from: userData.effectiveFrom.toISOString(),
      effective_to: userData.effectiveTo?.toISOString() || null,
      created_by: createdBy,
      updated_by: createdBy,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([newUser])
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
      phone: data.phone,
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

  async updateUser(id: string, userData: UserFormData, updatedBy: string): Promise<User> {
    console.log("Updating user:", id, "with data:", userData);
    
    const updateData = {
      username: userData.username,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      designation: userData.designation,
      organization_id: userData.organizationId,
      effective_from: userData.effectiveFrom.toISOString(),
      effective_to: userData.effectiveTo?.toISOString() || null,
      updated_by: updatedBy,
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
      phone: data.phone,
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
    
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_permissions (
            permissions (name)
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching user permissions:", error);
      throw new Error(`Failed to fetch user permissions: ${error.message}`);
    }

    // Flatten the permissions
    const permissions = data?.flatMap(ur => 
      ur.roles?.role_permissions?.map(rp => rp.permissions?.name) || []
    ).filter(Boolean) || [];

    console.log("User permissions fetched successfully:", permissions);
    return permissions;
  }
};

// Export individual functions for backward compatibility
export const { getUserPermissions, createUser, getUserById, updateUser, getAllUsers } = userService;
