
import { supabase } from "@/integrations/supabase/client";
import { User, UserFormData } from "@/types/user";

export const userService = {
  async getUsers(): Promise<User[]> {
    console.log("Fetching users...");
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role_id,
          roles (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    console.log("Users fetched successfully:", data);
    return data || [];
  },

  async getUserById(id: string): Promise<User | null> {
    console.log("Fetching user by ID:", id);
    
    const { data, error } = await supabase
      .from('users')
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
      .from('users')
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
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
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
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting user:", error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    console.log("User deleted successfully");
  }
};
