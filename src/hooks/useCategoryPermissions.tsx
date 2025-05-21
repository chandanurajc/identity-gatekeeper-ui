
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";

export const useCategoryPermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.roles.includes("admin")) return true;
    
    const userPermissions = getUserPermissions(user.roles);
    return userPermissions.includes(permissionName);
  };

  return {
    canCreateCategory: hasPermission("create_item_category"),
    canEditCategory: hasPermission("edit_item_category"),
    canViewCategory: hasPermission("view_item_category"),
    canAccessInventory: hasPermission("access_master_data"),
  };
};
