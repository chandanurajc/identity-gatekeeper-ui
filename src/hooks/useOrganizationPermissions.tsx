
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";

export const useOrganizationPermissions = () => {
  const { user } = useAuth();

  // Use getUserPermissions to get all permissions for the user
  const userPermissions = user ? getUserPermissions(user.id) : [];

  const canViewOrganization = userPermissions.includes("view-organization") || false;
  const canCreateOrganization = userPermissions.includes("create-organization") || false;
  const canEditOrganization = userPermissions.includes("edit-organization") || false;

  return {
    canViewOrganization,
    canCreateOrganization,
    canEditOrganization,
  };
};
