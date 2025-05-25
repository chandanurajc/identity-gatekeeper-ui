
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect } from "react";

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("=== usePermissions Hook Debug ===");
  console.log("Hook state:", {
    user: user ? { id: user.id, roles: user.roles } : null,
    isAuthenticated,
    permissions,
    loading
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      console.log("=== fetchPermissions called in usePermissions ===");
      setLoading(true);
      
      if (user && user.id && isAuthenticated) {
        try {
          console.log("Fetching permissions for user:", user.id);
          console.log("User roles:", user.roles);
          
          // Check if user has admin role - admins should have all permissions
          if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) {
            console.log("User has admin role, granting all permissions");
            // Grant all possible permissions for admin users
            const allPermissions = [
              "view-user", "create-user", "edit-user",
              "view-roles", "create_role", "edit_roles", "view_permissions",
              "view-organization", "create-organization", "edit-organization",
              "view-division", "create-division", "edit-division",
              "view-category", "create-category", "edit-category",
              "access_admin", "access_settings"
            ];
            setPermissions(allPermissions);
            console.log("Admin permissions set:", allPermissions);
          } else {
            console.log("Fetching specific permissions from database...");
            const startTime = Date.now();
            const userPermissions = await getUserPermissions(user.id);
            const endTime = Date.now();
            console.log(`getUserPermissions completed in ${endTime - startTime}ms`);
            console.log("Fetched permissions:", userPermissions);
            setPermissions(userPermissions);
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        }
      } else {
        console.log("No authenticated user, setting empty permissions");
        console.log("User exists:", !!user);
        console.log("User has ID:", user?.id);
        console.log("Is authenticated:", isAuthenticated);
        setPermissions([]);
      }
      
      console.log("Setting permissions loading to false");
      setLoading(false);
    };

    console.log("=== usePermissions useEffect triggered ===");
    fetchPermissions();
  }, [user, isAuthenticated]);

  const hasPermission = (permissionName: string): boolean => {
    console.log(`=== Checking permission: ${permissionName} ===`);
    console.log("Current state:", { user: !!user, isAuthenticated, permissions });
    
    if (!user || !isAuthenticated) {
      console.log("Permission denied: no user or not authenticated");
      return false;
    }
    
    // Admin users have all permissions
    if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) {
      console.log("Permission granted: user is admin");
      return true;
    }
    
    const hasPermission = permissions.includes(permissionName);
    console.log(`Permission ${permissionName}: ${hasPermission}`);
    return hasPermission;
  };

  console.log("=== usePermissions returning ===");
  console.log("Final state:", {
    hasPermission: hasPermission.toString(),
    isLoading: loading,
    canViewUsers: hasPermission("view-user"),
    canCreateUsers: hasPermission("create-user"),
    canEditUsers: hasPermission("edit-user")
  });

  return {
    hasPermission,
    isLoading: loading,
    // User Management permissions
    canViewUsers: hasPermission("view-user"),
    canCreateUsers: hasPermission("create-user"),
    canEditUsers: hasPermission("edit-user"),
    
    // Module access permissions
    canAccessAdminModule: hasPermission("access_admin"),
    canAccessSettingsModule: hasPermission("access_settings"),
    
    // Organization permissions
    canViewOrganization: hasPermission("view-organization"),
    canCreateOrganization: hasPermission("create-organization"),
    canEditOrganization: hasPermission("edit-organization"),
    
    // Division permissions
    canViewDivision: hasPermission("view-division"),
    canCreateDivision: hasPermission("create-division"),
    canEditDivision: hasPermission("edit-division"),
    
    // For checking any permission dynamically
    checkPermission: hasPermission,
  };
};
