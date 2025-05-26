
import { usePermissions } from "@/hooks/usePermissions";

export const useDivisionPermissions = () => {
  const { 
    hasPermission, 
    canViewDivision, 
    canCreateDivision, 
    canEditDivision 
  } = usePermissions();

  return {
    hasPermission,
    canViewDivision,
    canCreateDivision,
    canEditDivision,
  };
};
