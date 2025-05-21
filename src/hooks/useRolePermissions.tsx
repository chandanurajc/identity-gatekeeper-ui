
import { useAuth } from "@/context/AuthContext";
import { roleService } from "@/services/roleService";
import { useState, useEffect } from "react";
import { Permission } from "@/types/role";

export const useRolePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user) {
        // In a real app, you would fetch the user's permissions based on their roles
        // For now, we'll use mock data based on the user's roles
        if (user.roles.includes("admin")) {
          const allPermissions = await roleService.getAllPermissions();
          setPermissions(allPermissions);
        } else {
          // For non-admin users, fetch their specific permissions
          // This is a simplified example
          const viewUserPerm = await roleService.getPermissionsByComponent("Users");
          setPermissions(viewUserPerm.filter(p => p.name === "view_users"));
        }
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.roles.includes("admin")) return true;

    // Check if the user has the specific permission
    return permissions.some(p => p.name === permissionName);
  };

  return {
    hasPermission,
    isLoading: loading,
    // Role management specific permissions
    canCreateRole: hasPermission("create_role"),
    canEditRoles: hasPermission("edit_roles"),
    canViewRoles: hasPermission("view_roles"),
    // New permission for viewing all system permissions
    canViewPermissions: hasPermission("view_permissions"),
  };
};
