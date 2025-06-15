
import { usePermissions } from './usePermissions';

export const useInventoryPermissions = () => {
  const { canViewInventory, checkPermission, isLoading } = usePermissions();

  return {
    canViewInventory,
    checkPermission,
    isLoading,
  };
};
