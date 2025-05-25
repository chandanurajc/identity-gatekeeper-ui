
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
    // User Management permissions - updated to match actual permission names
    canViewUsers: hasPermission("view-user"),
    canCreateUsers: hasPermission("create-user"),
    canEditUsers: hasPermission("edit-user"),
    
    // Module access permissions - these don't exist in services, so keeping them as false for now
    canAccessAdminModule: hasPermission("access_admin"),
    canAccessSettingsModule: hasPermission("access_settings"),
    
    // Organization permissions - updated to match actual permission names
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
