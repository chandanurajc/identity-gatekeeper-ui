
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
        // Check if user has admin role - admins should have all permissions
        if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) {
          console.log("User has admin role, granting all role permissions");
          const allPermissions = await roleService.getAllPermissions();
          setPermissions(allPermissions);
        } else {
          // For non-admin users, fetch their specific permissions
          const rolePermissions = await roleService.getPermissionsByComponent("Roles");
          setPermissions(rolePermissions);
        }
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) return true;

    // Check if the user has the specific permission
    return permissions.some(p => p.name === permissionName);
  };

  return {
    hasPermission,
    isLoading: loading,
    // Role management specific permissions - updated to match actual permission names
    canCreateRole: hasPermission("create_role"),
    canEditRoles: hasPermission("edit_roles"),
    canViewRoles: hasPermission("view_roles"),
    // Permission for viewing all system permissions
    canViewPermissions: hasPermission("view_permissions"),
  };
};
