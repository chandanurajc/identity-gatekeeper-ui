
import { usePermissions } from "@/hooks/usePermissions";

export const useCategoryPermissions = () => {
  const { 
    hasPermission, 
    canViewCategory, 
    canCreateCategory, 
    canEditCategory 
  } = usePermissions();

  return {
    hasPermission,
    canViewCategory,
    canCreateCategory,
    canEditCategory,
  };
};
