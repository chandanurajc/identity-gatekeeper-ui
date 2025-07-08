import { usePermissions } from "./usePermissions";

export const useAccountingRulesPermissions = () => {
  const { hasPermission } = usePermissions();
  
  return {
    canViewRules: hasPermission("View Rules"),
    canCreateRules: hasPermission("Create Rules"),
    canEditRules: hasPermission("Edit Rules"),
    canDeleteRules: hasPermission("Delete Rules"),
  };
};