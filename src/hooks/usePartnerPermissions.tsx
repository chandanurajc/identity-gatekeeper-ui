
import { usePermissions } from "./usePermissions";

export const usePartnerPermissions = () => {
  const { hasPermission, isLoading } = usePermissions();

  const canManagePartner = hasPermission("manage_partner");

  return {
    canManagePartner,
    isLoading,
  };
};
