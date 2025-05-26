
import { useAuth } from "@/context/AuthContext";
import { roleService } from "@/services/roleService";
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
            console.log("User is not admin, checking specific role permissions");
            console.log("User roles to check:", user.roles);
            
            // For non-admin users, get all permissions for all their roles
            let userPermissions: Permission[] = [];
            
            for (const roleName of user.roles) {
              console.log(`Fetching permissions for role: ${roleName}`);
              try {
                // We need to get permissions by role name, not component
                // This might be the issue - let's get all permissions and filter by role
                const allPerms = await roleService.getAllPermissions();
                console.log("All available permissions:", allPerms);
                
                // For now, let's check if the role name indicates user management permissions
                if (roleName.toLowerCase().includes('user') || roleName.toLowerCase().includes('management')) {
                  console.log("Role seems to be related to user management, adding user permissions");
                  const userManagementPerms = allPerms.filter(p => 
                    p.component.toLowerCase().includes('user') || 
                    p.name.toLowerCase().includes('user') ||
                    p.name.includes('view_roles') ||
                    p.name.includes('create_role') ||
                    p.name.includes('edit_roles')
                  );
                  console.log("User management permissions found:", userManagementPerms);
                  userPermissions = [...userPermissions, ...userManagementPerms];
                }
              } catch (error) {
                console.error(`Error fetching permissions for role ${roleName}:`, error);
              }
            }
            
            console.log("Final user permissions:", userPermissions);
            setPermissions(userPermissions);
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
