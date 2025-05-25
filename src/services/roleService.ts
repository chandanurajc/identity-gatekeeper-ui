
import { Permission, Role } from "@/types/role";
import { supabase } from "@/integrations/supabase/client";

export const roleService = {
  getAllRoles: async (): Promise<Role[]> => {
    try {
      const { data: roles, error } = await supabase
        .from('roles')
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          ),
          role_permissions (
            permissions (
              id,
              name,
              module,
              component,
              description
            )
          )
        `)
        .order('created_on', { ascending: false });

      if (error) {
        console.error("Error fetching roles:", error);
        throw error;
      }

      return roles?.map(role => ({
        id: role.id,
        name: role.name,
        permissions: role.role_permissions?.map((rp: any) => rp.permissions).filter(Boolean) || [],
        organizationId: role.organization_id,
        organizationName: role.organizations?.name,
        createdBy: role.created_by,
        createdOn: role.created_on ? new Date(role.created_on) : undefined,
        updatedBy: role.updated_by,
        updatedOn: role.updated_on ? new Date(role.updated_on) : undefined,
      })) || [];
    } catch (error) {
      console.error("Error in getAllRoles:", error);
      return [];
    }
  },

  getRoleById: async (id: string): Promise<Role | undefined> => {
    try {
      const { data: role, error } = await supabase
        .from('roles')
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          ),
          role_permissions (
            permissions (
              id,
              name,
              module,
              component,
              description
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching role:", error);
        return undefined;
      }

      if (!role) return undefined;

      return {
        id: role.id,
        name: role.name,
        permissions: role.role_permissions?.map((rp: any) => rp.permissions).filter(Boolean) || [],
        organizationId: role.organization_id,
        organizationName: role.organizations?.name,
        createdBy: role.created_by,
        createdOn: role.created_on ? new Date(role.created_on) : undefined,
        updatedBy: role.updated_by,
        updatedOn: role.updated_on ? new Date(role.updated_on) : undefined,
      };
    } catch (error) {
      console.error("Error in getRoleById:", error);
      return undefined;
    }
  },

  createRole: async (role: Omit<Role, "id" | "createdBy" | "createdOn">): Promise<Role> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert the role
      const { data: newRole, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: role.name,
          description: role.description,
          organization_id: role.organizationId,
          created_by: user?.id
        })
        .select()
        .single();

      if (roleError) {
        console.error("Error creating role:", roleError);
        throw roleError;
      }

      // Insert role permissions
      if (role.permissions.length > 0) {
        const rolePermissions = role.permissions.map(permission => ({
          role_id: newRole.id,
          permission_id: permission.id
        }));

        const { error: permissionsError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permissionsError) {
          console.error("Error creating role permissions:", permissionsError);
          throw permissionsError;
        }
      }

      return {
        id: newRole.id,
        name: newRole.name,
        permissions: role.permissions,
        organizationId: newRole.organization_id,
        createdBy: newRole.created_by,
        createdOn: new Date(newRole.created_on),
      };
    } catch (error) {
      console.error("Error in createRole:", error);
      throw error;
    }
  },

  updateRole: async (id: string, roleData: Partial<Role>): Promise<Role | undefined> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update the role
      const { data: updatedRole, error: roleError } = await supabase
        .from('roles')
        .update({
          name: roleData.name,
          description: roleData.description,
          organization_id: roleData.organizationId,
          updated_by: user?.id,
          updated_on: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (roleError) {
        console.error("Error updating role:", roleError);
        throw roleError;
      }

      // Update permissions if provided
      if (roleData.permissions) {
        // Delete existing permissions
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', id);

        if (deleteError) {
          console.error("Error deleting role permissions:", deleteError);
          throw deleteError;
        }

        // Insert new permissions
        if (roleData.permissions.length > 0) {
          const rolePermissions = roleData.permissions.map(permission => ({
            role_id: id,
            permission_id: permission.id
          }));

          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(rolePermissions);

          if (insertError) {
            console.error("Error inserting role permissions:", insertError);
            throw insertError;
          }
        }
      }

      return {
        id: updatedRole.id,
        name: updatedRole.name,
        permissions: roleData.permissions || [],
        organizationId: updatedRole.organization_id,
        createdBy: updatedRole.created_by,
        createdOn: new Date(updatedRole.created_on),
        updatedBy: updatedRole.updated_by,
        updatedOn: new Date(updatedRole.updated_on),
      };
    } catch (error) {
      console.error("Error in updateRole:", error);
      return undefined;
    }
  },

  deleteRole: async (id: string): Promise<boolean> => {
    try {
      // Delete role permissions first (foreign key constraint)
      const { error: permissionsError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      if (permissionsError) {
        console.error("Error deleting role permissions:", permissionsError);
        throw permissionsError;
      }

      // Delete the role
      const { error: roleError } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (roleError) {
        console.error("Error deleting role:", roleError);
        throw roleError;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteRole:", error);
      return false;
    }
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('component', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching permissions:", error);
        throw error;
      }

      return permissions || [];
    } catch (error) {
      console.error("Error in getAllPermissions:", error);
      return [];
    }
  },

  getPermissionsByModule: async (module: string): Promise<Permission[]> => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('module', module)
        .order('component', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching permissions by module:", error);
        throw error;
      }

      return permissions || [];
    } catch (error) {
      console.error("Error in getPermissionsByModule:", error);
      return [];
    }
  },

  getPermissionsByComponent: async (component: string): Promise<Permission[]> => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('component', component)
        .order('module', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching permissions by component:", error);
        throw error;
      }

      return permissions || [];
    } catch (error) {
      console.error("Error in getPermissionsByComponent:", error);
      return [];
    }
  },

  getPermissionsByModuleAndComponent: async (module: string, component: string): Promise<Permission[]> => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('module', module)
        .eq('component', component)
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching permissions by module and component:", error);
        throw error;
      }

      return permissions || [];
    } catch (error) {
      console.error("Error in getPermissionsByModuleAndComponent:", error);
      return [];
    }
  },

  getUniqueModules: async (): Promise<string[]> => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('module')
        .order('module', { ascending: true });

      if (error) {
        console.error("Error fetching unique modules:", error);
        throw error;
      }

      const modules = [...new Set(permissions?.map(p => p.module) || [])];
      return modules;
    } catch (error) {
      console.error("Error in getUniqueModules:", error);
      return [];
    }
  },

  getUniqueComponents: async (): Promise<string[]> => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('component')
        .order('component', { ascending: true });

      if (error) {
        console.error("Error fetching unique components:", error);
        throw error;
      }

      const components = [...new Set(permissions?.map(p => p.component) || [])];
      return components;
    } catch (error) {
      console.error("Error in getUniqueComponents:", error);
      return [];
    }
  },

  getComponentsByModule: async (module: string): Promise<string[]> => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('component')
        .eq('module', module)
        .order('component', { ascending: true });

      if (error) {
        console.error("Error fetching components by module:", error);
        throw error;
      }

      const components = [...new Set(permissions?.map(p => p.component) || [])];
      return components;
    } catch (error) {
      console.error("Error in getComponentsByModule:", error);
      return [];
    }
  }
};
