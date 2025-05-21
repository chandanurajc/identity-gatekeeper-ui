
import { useAuth } from "@/context/AuthContext";
import { roleService } from "@/services/roleService";
import { useState, useEffect } from "react";
import { Permission } from "@/types/role";

export const useCategoryPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user) {
        // In a real app, you would fetch permissions based on user's roles
        if (user.roles.includes("admin")) {
          const allPermissions = await roleService.getAllPermissions();
          setPermissions(allPermissions);
        } else {
          const masterDataPermissions = await roleService.getPermissionsByModule("Master data");
          setPermissions(masterDataPermissions);
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
    // Category permissions
    canViewCategory: hasPermission("view_item_category"),
    canCreateCategory: hasPermission("create_item_category"),
    canEditCategory: hasPermission("edit_item_category"),
    canAccessInventory: hasPermission("access_master_data"),
    
    // Supplier permissions
    canViewSupplier: hasPermission("view_supplier"),
    canCreateSupplier: hasPermission("create_supplier"),
    canEditSupplier: hasPermission("edit_supplier")
  };
};
