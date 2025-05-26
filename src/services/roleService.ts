
import { supabase } from "@/integrations/supabase/client";
import { Role, RoleFormData } from "@/types/role";

export const roleService = {
  async getRoles(): Promise<Role[]> {
    console.log("Fetching roles...");
    
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permission_id,
          permissions (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching roles:", error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    console.log("Roles fetched successfully:", data);
    return data || [];
  },

  async getRoleById(id: string): Promise<Role | null> {
    console.log("Fetching role by ID:", id);
    
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permission_id,
          permissions (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching role:", error);
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch role: ${error.message}`);
    }

    console.log("Role fetched successfully:", data);
    return data;
  },

  async createRole(roleData: RoleFormData, createdBy: string): Promise<Role> {
    console.log("Creating role with data:", roleData);
    
    try {
      // Start transaction by creating the role first
      const newRole = {
        name: roleData.name,
        description: roleData.description,
        created_by: createdBy,
        updated_by: createdBy,
      };

      const { data: roleResult, error: roleError } = await supabase
        .from('roles')
        .insert([newRole])
        .select()
        .single();

      if (roleError) {
        console.error("Error creating role:", roleError);
        throw new Error(`Failed to create role: ${roleError.message}`);
      }

      // Now assign permissions to the role
      if (roleData.permissions && roleData.permissions.length > 0) {
        const rolePermissions = roleData.permissions.map(permissionId => ({
          role_id: roleResult.id,
          permission_id: permissionId,
        }));

        const { error: permissionError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permissionError) {
          // If permission assignment fails, clean up the role
          await supabase.from('roles').delete().eq('id', roleResult.id);
          console.error("Error assigning permissions to role:", permissionError);
          throw new Error(`Failed to assign permissions to role: ${permissionError.message}`);
        }
      }

      // Fetch the complete role with permissions
      const completeRole = await this.getRoleById(roleResult.id);
      if (!completeRole) {
        throw new Error("Failed to fetch created role");
      }

      console.log("Role created successfully:", completeRole);
      return completeRole;
    } catch (error) {
      console.error("Error in createRole:", error);
      throw error;
    }
  },

  async updateRole(id: string, roleData: RoleFormData, updatedBy: string): Promise<Role> {
    console.log("Updating role:", id, "with data:", roleData);
    
    try {
      // Update the role
      const updateData = {
        name: roleData.name,
        description: roleData.description,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      };

      const { error: roleError } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', id);

      if (roleError) {
        console.error("Error updating role:", roleError);
        throw new Error(`Failed to update role: ${roleError.message}`);
      }

      // Update permissions - first delete existing ones
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      if (deleteError) {
        console.error("Error deleting existing role permissions:", deleteError);
        throw new Error(`Failed to update role permissions: ${deleteError.message}`);
      }

      // Then insert new permissions
      if (roleData.permissions && roleData.permissions.length > 0) {
        const rolePermissions = roleData.permissions.map(permissionId => ({
          role_id: id,
          permission_id: permissionId,
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (insertError) {
          console.error("Error inserting new role permissions:", insertError);
          throw new Error(`Failed to update role permissions: ${insertError.message}`);
        }
      }

      // Fetch the updated role with permissions
      const updatedRole = await this.getRoleById(id);
      if (!updatedRole) {
        throw new Error("Failed to fetch updated role");
      }

      console.log("Role updated successfully:", updatedRole);
      return updatedRole;
    } catch (error) {
      console.error("Error in updateRole:", error);
      throw error;
    }
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
