
import { usePermissions } from "./usePermissions";

export const useItemPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canViewItem: hasPermission("view-item"),
    canCreateItem: hasPermission("create-item"),
    canEditItem: hasPermission("edit-item"),
  };
};
