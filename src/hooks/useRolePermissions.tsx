
import { useAuth } from "@/context/AuthContext";
import { roleService } from "@/services/roleService";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Permission } from "@/types/role";

export const useRolePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("=== useRolePermissions Hook Debug ===");
  console.log("Current user:", user);
  console.log("User roles:", user?.roles);

  useEffect(() => {
    const fetchPermissions = async () => {
      console.log("=== fetchPermissions called in useRolePermissions ===");
      setLoading(true);
      
      if (user) {
        try {
          console.log("Checking user roles:", user.roles);
          
          // Check if user has admin role - admins should have all permissions
          const isAdmin = user.roles.some(role => 
            role.toLowerCase().includes('admin') || 
            role === 'Admin-Role' || 
            role === 'admin'
          );
          
          if (isAdmin) {
            console.log("User has admin role, granting all role permissions");
            const allPermissions = await roleService.getAllPermissions();
            console.log("All permissions fetched for admin:", allPermissions);
            setPermissions(allPermissions);
          } else {
            console.log("User is not admin, fetching permissions from database for user roles");
            console.log("User roles to check:", user.roles);
            
            // For non-admin users, fetch actual permissions assigned to their roles
            const { data: rolePermissions, error } = await supabase
              .from('roles')
              .select(`
                name,
                role_permissions (
                  permissions (*)
                )
              `)
              .in('name', user.roles);

            if (error) {
              console.error("Error fetching role permissions:", error);
              setPermissions([]);
            } else {
              console.log("Raw role permissions data:", rolePermissions);
              
              // Extract all permissions from all user roles
              const userPermissions: Permission[] = [];
              
              rolePermissions?.forEach(role => {
                console.log(`Processing permissions for role: ${role.name}`);
                role.role_permissions?.forEach((rp: any) => {
                  if (rp.permissions) {
                    console.log("Adding permission:", rp.permissions);
                    userPermissions.push(rp.permissions);
                  }
                });
              });
              
              // Remove duplicates based on permission ID
              const uniquePermissions = userPermissions.filter((permission, index, self) => 
                index === self.findIndex(p => p.id === permission.id)
              );
              
              console.log("Final permissions for user:", uniquePermissions);
              setPermissions(uniquePermissions);
            }
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        }
      } else {
        console.log("No user found, setting empty permissions");
        setPermissions([]);
      }
      
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (permissionName: string): boolean => {
    console.log(`=== Checking permission: ${permissionName} ===`);
    console.log("Current user:", user);
    console.log("Available permissions:", permissions);
    
    if (!user) {
      console.log("Permission denied: no user");
      return false;
    }
    
    // Admin role has all permissions
    const isAdmin = user.roles.some(role => 
      role.toLowerCase().includes('admin') || 
      role === 'Admin-Role' || 
      role === 'admin'
    );
    
    if (isAdmin) {
      console.log("Permission granted: user is admin");
      return true;
    }
    
    // Check if the user has the specific permission
    const hasPermission = permissions.some(p => p.name === permissionName);
    console.log(`Permission ${permissionName}: ${hasPermission}`);
    console.log("Permission names available:", permissions.map(p => p.name));
    
    return hasPermission;
  };

  console.log("=== useRolePermissions final state ===");
  console.log("Loading:", loading);
  console.log("Permissions:", permissions);

  return {
    hasPermission,
    isLoading: loading,
    // Role management specific permissions - updated to match actual permission names
    canCreateRole: hasPermission("create_role"),
    canEditRoles: hasPermission("edit_roles"),
    canViewRoles: hasPermission("view_roles"),
    // Permission for viewing all system permissions
    canViewPermissions: hasPermission("view_permissions"),
  };
};
