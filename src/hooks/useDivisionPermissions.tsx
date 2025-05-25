
import { useAuth } from "@/context/AuthContext";

export const useDivisionPermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) {
      return true;
    }
    
    // For now, return false for non-admin users
    // This can be enhanced with proper permission checking
    return false;
  };

  return {
    hasPermission,
    canViewDivision: hasPermission("view-division"),
    canCreateDivision: hasPermission("create-division"),
    canEditDivision: hasPermission("edit-division"),
  };
};
