
import { useAuth } from "@/context/AuthContext";

export const useCategoryPermissions = () => {
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
    canViewCategory: hasPermission("view-category"),
    canCreateCategory: hasPermission("create-category"),
    canEditCategory: hasPermission("edit-category"),
  };
};
