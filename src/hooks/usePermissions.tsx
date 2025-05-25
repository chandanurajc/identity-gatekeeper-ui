
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect } from "react";

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      if (user && user.id && isAuthenticated) {
        try {
          console.log("Fetching permissions for user:", user.id);
          const userPermissions = await getUserPermissions(user.id);
          console.log("Fetched permissions:", userPermissions);
          setPermissions(userPermissions);
        } catch (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        }
      } else {
        console.log("No authenticated user, setting empty permissions");
        setPermissions([]);
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [user, isAuthenticated]);

  const hasPermission = (permissionName: string): boolean => {
    if (!user || !isAuthenticated) return false;
    return permissions.includes(permissionName);
  };

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
