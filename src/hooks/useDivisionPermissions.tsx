
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";

export const useDivisionPermissions = () => {
  const { user } = useAuth();

  // Use getUserPermissions to get all permissions for the user
  const userPermissions = user ? getUserPermissions(user.id) : [];

  const canViewDivision = userPermissions.includes("view-division") || false;
  const canCreateDivision = userPermissions.includes("create-division") || false;
  const canEditDivision = userPermissions.includes("edit-division") || false;

  return {
    canViewDivision,
    canCreateDivision,
    canEditDivision,
  };
};
