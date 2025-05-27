
import { usePermissions } from "./usePermissions";

export const useSalesChannelPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canViewSalesChannel: hasPermission("view-sales-channel"),
    canCreateSalesChannel: hasPermission("create-sales-channel"),
    canEditSalesChannel: hasPermission("edit-sales-channel"),
  };
};
