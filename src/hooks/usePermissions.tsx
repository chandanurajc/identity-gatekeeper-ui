
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    const userPermissions = getUserPermissions(user.roles);
    return userPermissions.includes(permissionName);
  };

  return {
    hasPermission,
    canViewUsers: hasPermission("view_users"),
    canCreateUsers: hasPermission("create_users"),
    canEditUsers: hasPermission("edit_users"),
  };
};
