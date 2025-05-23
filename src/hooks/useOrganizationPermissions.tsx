
import { useAuth } from "@/context/AuthContext";

export const useOrganizationPermissions = () => {
  const { user } = useAuth();

  const canViewOrganization = user?.permissions?.includes("view-organization") || false;
  const canCreateOrganization = user?.permissions?.includes("create-organization") || false;
  const canEditOrganization = user?.permissions?.includes("edit-organization") || false;

  return {
    canViewOrganization,
    canCreateOrganization,
    canEditOrganization,
  };
};
