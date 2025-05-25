
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect } from "react";

// Mock permissions for development/testing with mock auth
const getMockPermissions = (userId: string): string[] => {
  // Mock permissions based on user ID for testing
  if (userId === "1") {
    return [
      "view-user", "create-user", "edit-user",
      "access_admin", "access_settings",
      "view-organization", "create-organization", "edit-organization",
      "view-division", "create-division", "edit-division"
    ];
  }
  return ["view-user", "view-organization", "view-division"];
};

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      if (user && user.id) {
        try {
          console.log("Fetching permissions for user:", user.id);
          
          // Check if this is a mock user ID (not UUID format)
          if (!isValidUUID(user.id)) {
            console.log("Using mock permissions for non-UUID user ID");
            const mockPermissions = getMockPermissions(user.id);
            setPermissions(mockPermissions);
            console.log("Mock permissions set:", mockPermissions);
          } else {
            // Use real Supabase permissions for UUID users
            const userPermissions = await getUserPermissions(user.id);
            console.log("Fetched permissions:", userPermissions);
            setPermissions(userPermissions);
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        }
      } else {
        console.log("No user or invalid user ID, setting empty permissions");
        setPermissions([]);
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
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
