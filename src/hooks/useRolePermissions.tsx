
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
            console.log("User is not admin, they should not have role permissions unless specifically assigned");
            // For non-admin users, they should not have role permissions unless specifically assigned
            // This ensures that users like 'usermanager@admn.com' with 'User Management' role
            // only get the permissions that are actually assigned to their role in the database
            setPermissions([]);
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
