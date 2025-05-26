
import { supabase } from "@/integrations/supabase/client";
import { Role, RoleFormData } from "@/types/role";

export const roleService = {
  async getRoles(): Promise<Role[]> {
    console.log("Fetching roles...");
    
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_on', { ascending: false });

    if (error) {
      console.error("Error fetching roles:", error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    console.log("Roles fetched successfully:", data);
    return data || [];
  },

  // Alias for backward compatibility
  async getAllRoles(): Promise<Role[]> {
    return this.getRoles();
  },

  async getAllPermissions(): Promise<any[]> {
    console.log("Fetching all permissions...");
    
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true });

    if (error) {
      console.error("Error fetching permissions:", error);
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    console.log("Permissions fetched successfully:", data);
    return data || [];
  },

  async getUniqueModules(): Promise<string[]> {
    console.log("Fetching unique modules...");
    
    const { data, error } = await supabase
      .from('permissions')
      .select('module')
      .order('module', { ascending: true });

    if (error) {
      console.error("Error fetching modules:", error);
      throw new Error(`Failed to fetch modules: ${error.message}`);
    }

    const uniqueModules = [...new Set((data || []).map(item => item.module))];
    console.log("Unique modules fetched successfully:", uniqueModules);
    return uniqueModules;
  },

  async getPermissionsByComponent(component: string): Promise<any[]> {
    console.log("Fetching permissions by component:", component);
    
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('component', component)
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching permissions by component:", error);
      throw new Error(`Failed to fetch permissions by component: ${error.message}`);
    }

    console.log("Permissions by component fetched successfully:", data);
    return data || [];
  },

  async getRoleById(id: string): Promise<Role> {
    console.log("Fetching role by ID:", id);
    
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching role:", error);
      throw new Error(`Failed to fetch role: ${error.message}`);
    }

    console.log("Role fetched successfully:", data);
    return data;
  },

  async createRole(roleData: RoleFormData, createdBy: string, organizationId: string): Promise<Role> {
    console.log("Creating role with data:", roleData);
    
    const newRole = {
      ...roleData,
      created_by: createdBy,
      updated_by: createdBy,
      organization_id: organizationId,
    };

    const { data, error } = await supabase
      .from('roles')
      .insert([newRole])
      .select()
      .single();

    if (error) {
      console.error("Error creating role:", error);
      throw new Error(`Failed to create role: ${error.message}`);
    }

    console.log("Role created successfully:", data);
    return data;
  },

  async updateRole(id: string, roleData: RoleFormData, updatedBy: string): Promise<Role> {
    console.log("Updating role:", id, "with data:", roleData);
    
    const updateData = {
      ...roleData,
      updated_by: updatedBy,
      updated_on: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating role:", error);
      throw new Error(`Failed to update role: ${error.message}`);
    }

    console.log("Role updated successfully:", data);
    return data;
  },

  async deleteRole(id: string): Promise<void> {
    console.log("Deleting role:", id);
    
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting role:", error);
      throw new Error(`Failed to delete role: ${error.message}`);
    }

    console.log("Role deleted successfully");
  }
};
