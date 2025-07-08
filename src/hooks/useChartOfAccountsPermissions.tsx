import { usePermissions } from "./usePermissions";

export const useChartOfAccountsPermissions = () => {
  const { hasPermission } = usePermissions();
  
  return {
    canViewCOA: hasPermission("View COA"),
    canCreateCOA: hasPermission("Create COA"),
    canEditCOA: hasPermission("Edit COA"),
  };
};