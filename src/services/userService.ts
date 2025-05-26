
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
    return data || [];
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
    return data;
  },

  async createUser(userData: UserFormData, createdBy: string): Promise<User> {
    console.log("Creating user with data:", userData);
    
    const newUser = {
      ...userData,
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
    return data;
  },

  async updateUser(id: string, userData: UserFormData, updatedBy: string): Promise<User> {
    console.log("Updating user:", id, "with data:", userData);
    
    const updateData = {
      ...userData,
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
    return data;
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

  async getUserPermissions(userId: string): Promise<any[]> {
    console.log("Fetching user permissions for user:", userId);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_permissions (
            permissions (*)
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
      ur.roles?.role_permissions?.map(rp => rp.permissions) || []
    ) || [];

    console.log("User permissions fetched successfully:", permissions);
    return permissions;
  }
};

// Export individual functions for backward compatibility
export const { getUserPermissions, createUser, getUserById, updateUser, getAllUsers } = userService;
