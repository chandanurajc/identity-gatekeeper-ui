
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect, useCallback, useMemo } from "react";

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("=== usePermissions Hook Debug ===");
  console.log("Hook state:", {
    userId: user?.id,
    isAuthenticated,
    permissions,
    loading
  });

  // Use stable userId to prevent infinite loops
  const userId = user?.id;

  useEffect(() => {
    const fetchPermissions = async () => {
      console.log("=== fetchPermissions called in usePermissions ===");
      setLoading(true);
      
      if (userId && isAuthenticated) {
        try {
          console.log("Fetching permissions for user:", userId);
          console.log("User roles:", user?.roles);
          
          // Check if user has admin role - admins should have all permissions
          if (user?.roles.includes("Admin-Role") || user?.roles.includes("admin")) {
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
            const userPermissions = await getUserPermissions(userId);
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
        console.log("User ID exists:", !!userId);
        console.log("Is authenticated:", isAuthenticated);
        setPermissions([]);
      }
      
      console.log("Setting permissions loading to false");
      setLoading(false);
    };

    console.log("=== usePermissions useEffect triggered ===");
    fetchPermissions();
  }, [userId, isAuthenticated, user?.roles]); // Use stable userId instead of user?.id

  // Stabilize hasPermission function with useCallback
  const hasPermission = useCallback((permissionName: string): boolean => {
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
  }, [user, isAuthenticated, permissions]);

  // Use useMemo to properly memoize permission values and prevent re-computation
  const memoizedPermissions = useMemo(() => {
    console.log("=== Computing memoized permissions ===");
    
    if (!user || !isAuthenticated) {
      return {
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canAccessAdminModule: false,
        canAccessSettingsModule: false,
        canViewOrganization: false,
        canCreateOrganization: false,
        canEditOrganization: false,
        canViewDivision: false,
        canCreateDivision: false,
        canEditDivision: false,
      };
    }

    // Admin users have all permissions
    if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) {
      return {
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canAccessAdminModule: true,
        canAccessSettingsModule: true,
        canViewOrganization: true,
        canCreateOrganization: true,
        canEditOrganization: true,
        canViewDivision: true,
        canCreateDivision: true,
        canEditDivision: true,
      };
    }

    // Check individual permissions
    return {
      canViewUsers: permissions.includes("view-user"),
      canCreateUsers: permissions.includes("create-user"),
      canEditUsers: permissions.includes("edit-user"),
      canAccessAdminModule: permissions.includes("access_admin"),
      canAccessSettingsModule: permissions.includes("access_settings"),
      canViewOrganization: permissions.includes("view-organization"),
      canCreateOrganization: permissions.includes("create-organization"),
      canEditOrganization: permissions.includes("edit-organization"),
      canViewDivision: permissions.includes("view-division"),
      canCreateDivision: permissions.includes("create-division"),
      canEditDivision: permissions.includes("edit-division"),
    };
  }, [user, isAuthenticated, permissions]);

  console.log("=== usePermissions returning ===");
  console.log("Final state:", {
    isLoading: loading,
    ...memoizedPermissions
  });

  return {
    hasPermission,
    isLoading: loading,
    // Spread memoized permissions
    ...memoizedPermissions,
    
    // For checking any permission dynamically
    checkPermission: hasPermission,
  };
};
