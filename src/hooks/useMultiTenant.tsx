
import { useAuth } from "@/context/AuthContext";

export const useMultiTenant = () => {
  const { user, getOrganizationCode } = useAuth();

  const getCurrentOrganizationCode = (): string | null => {
    return getOrganizationCode();
  };

  const getCurrentOrganizationId = (): string | null => {
    return user?.organizationId || null;
  };

  const getCurrentOrganizationName = (): string | null => {
    return user?.organizationName || null;
  };

  const isUserFromOrganization = (organizationCode: string): boolean => {
    return getCurrentOrganizationCode() === organizationCode;
  };

  const filterDataByOrganization = <T extends { organizationId?: string; organizationCode?: string }>(
    data: T[]
  ): T[] => {
    const currentOrgCode = getCurrentOrganizationCode();
    const currentOrgId = getCurrentOrganizationId();
    
    return data.filter(item => 
      item.organizationCode === currentOrgCode || 
      item.organizationId === currentOrgId
    );
  };

  // Add currentOrganization object for backward compatibility
  const currentOrganization = {
    id: getCurrentOrganizationId(),
    code: getCurrentOrganizationCode(),
    name: getCurrentOrganizationName()
  };

  return {
    getCurrentOrganizationCode,
    getCurrentOrganizationId,
    getCurrentOrganizationName,
    isUserFromOrganization,
    filterDataByOrganization,
    currentOrganization,
  };
};
