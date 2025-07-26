
import { usePermissions } from './usePermissions';

export const useInventoryPermissions = () => {
  const { canViewInventory, canViewInventoryTransfer, checkPermission, isLoading } = usePermissions();

  return {
    canViewInventory,
    canViewInventoryTransfer,
    checkPermission,
    isLoading,
  };
};
