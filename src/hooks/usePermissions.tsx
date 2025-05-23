
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    const userPermissions = getUserPermissions(user.id);
    return userPermissions.includes(permissionName);
  };

  return {
    hasPermission,
    // User Management permissions
    canViewUsers: hasPermission("view_users"),
    canCreateUsers: hasPermission("create_users"),
    canEditUsers: hasPermission("edit_users"),
    
    // Module access permissions
    canAccessAdminModule: hasPermission("access_admin"),
    canAccessSettingsModule: hasPermission("access_settings"),
    
    // Organization permissions
    canViewOrganization: hasPermission("view_organization"),
    canCreateOrganization: hasPermission("create_organization"),
    canEditOrganization: hasPermission("edit_organization"),
    
    // For checking any permission dynamically
    checkPermission: hasPermission,
  };
};
