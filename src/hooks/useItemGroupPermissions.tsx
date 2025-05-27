
import { usePermissions } from "./usePermissions";

export const useItemGroupPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canViewItemGroup: hasPermission("view-item-group"),
    canCreateItemGroup: hasPermission("create-item-group"),
    canEditItemGroup: hasPermission("edit-item-group"),
  };
};
