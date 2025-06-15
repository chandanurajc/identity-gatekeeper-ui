
import { usePermissions } from "@/hooks/usePermissions";

export const usePurchaseOrderPermissions = () => {
  const { hasPermission, isLoading } = usePermissions();

  return {
    canViewPurchaseOrders: hasPermission("View PO"),
    canCreatePurchaseOrder: hasPermission("Create PO"),
    canEditPurchaseOrder: hasPermission("Edit PO"),
    canCancelPurchaseOrder: hasPermission("Cancel PO"),
    canViewPOReceive: hasPermission("View PO Receive"),
    canCreatePOReceive: hasPermission("Create PO Receive"),
    isLoading,
  };
};
