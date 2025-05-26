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
          permissions (*)
        )
      `)
      .order('created_on', { ascending: false });

    if (error) {
      console.error("Error fetching roles:", error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    console.log("Roles fetched successfully:", data);
    
    // Transform database data to match Role interface
    return (data || []).map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.role_permissions?.map((rp: any) => rp.permissions) || [],
      organizationId: role.organization_id,
      createdBy: role.created_by,
      createdOn: role.created_on ? new Date(role.created_on) : undefined,
      updatedBy: role.updated_by,
      updatedOn: role.updated_on ? new Date(role.updated_on) : undefined,
    }));
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
      .select(`
        *,
        role_permissions (
          permissions (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching role:", error);
      throw new Error(`Failed to fetch role: ${error.message}`);
    }

    console.log("Role fetched successfully:", data);
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      permissions: data.role_permissions?.map((rp: any) => rp.permissions) || [],
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdOn: data.created_on ? new Date(data.created_on) : undefined,
      updatedBy: data.updated_by,
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    };
  },

  async createRole(roleData: RoleFormData, createdByUserName: string, organizationId: string | null): Promise<Role> {
    console.log("Creating role with data:", roleData);
    console.log("Organization ID parameter:", organizationId);
    console.log("Created by user name:", createdByUserName);
    
    const newRole = {
      name: roleData.name,
      description: roleData.description,
      created_by: createdByUserName,
      updated_by: createdByUserName,
      organization_id: organizationId,
    };

    console.log("Final role object being inserted:", newRole);

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

    // Now handle role permissions
    if (roleData.permissions && roleData.permissions.length > 0) {
      const rolePermissions = roleData.permissions.map(permission => ({
        role_id: data.id,
        permission_id: permission.id
      }));

      const { error: permissionError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permissionError) {
        console.error("Error creating role permissions:", permissionError);
        // Clean up the role if permission assignment fails
        await supabase.from('roles').delete().eq('id', data.id);
        throw new Error(`Failed to assign permissions to role: ${permissionError.message}`);
      }
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      permissions: roleData.permissions,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdOn: data.created_on ? new Date(data.created_on) : undefined,
      updatedBy: data.updated_by,
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    };
  },

  async updateRole(id: string, roleData: RoleFormData, updatedByUserName: string, organizationId?: string | null): Promise<Role> {
    console.log("Updating role:", id, "with data:", roleData);
    console.log("Updated by user name:", updatedByUserName);
    console.log("Organization ID:", organizationId);
    
    const updateData = {
      name: roleData.name,
      description: roleData.description,
      updated_by: updatedByUserName,
      updated_on: new Date().toISOString(),
      organization_id: organizationId,
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

    // Update role permissions
    // First delete existing permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id);

    // Then insert new permissions
    if (roleData.permissions && roleData.permissions.length > 0) {
      const rolePermissions = roleData.permissions.map(permission => ({
        role_id: id,
        permission_id: permission.id
      }));

      const { error: permissionError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permissionError) {
        console.error("Error updating role permissions:", permissionError);
        throw new Error(`Failed to update permissions for role: ${permissionError.message}`);
      }
    }

    console.log("Role updated successfully:", data);
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      permissions: roleData.permissions,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdOn: data.created_on ? new Date(data.created_on) : undefined,
      updatedBy: data.updated_by,
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined,
    };
  },

  async deleteRole(id: string): Promise<void> {
    console.log("Deleting role:", id);
    
    // First delete role permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id);
    
    // Then delete the role
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
