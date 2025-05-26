
import { usePermissions } from "@/hooks/usePermissions";

export const useOrganizationPermissions = () => {
  const { 
    hasPermission, 
    canViewOrganization, 
    canCreateOrganization, 
    canEditOrganization 
  } = usePermissions();

  return {
    hasPermission,
    canViewOrganization,
    canCreateOrganization,
    canEditOrganization,
  };
};
