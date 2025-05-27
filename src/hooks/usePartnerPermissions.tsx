
import { usePermissions } from "./usePermissions";

export const usePartnerPermissions = () => {
  const { permissions, isLoading } = usePermissions();

  const canManagePartner = permissions.includes("manage_partner");

  return {
    canManagePartner,
    isLoading,
  };
};
