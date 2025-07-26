import { usePermissions } from './usePermissions';

export const useInventoryTransferPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canViewInventoryTransfer: hasPermission("View Inventory transfer"),
    canCreateInventoryTransfer: hasPermission("Create Inventory transfer"),
    canEditInventoryTransfer: hasPermission("Edit Inventory transfer"),
    canConfirmInventoryTransfer: hasPermission("Confirm Inventory transfer"),
  };
};