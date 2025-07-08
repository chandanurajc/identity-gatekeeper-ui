import { usePermissions } from "./usePermissions";

export const useSubledgerPermissions = () => {
  const { hasPermission } = usePermissions();
  
  return {
    canViewSubledger: hasPermission("View Subledger"),
  };
};