import { useAuth } from "@/context/AuthContext";

export function useOrganizationId() {
  const { user } = useAuth();
  return user?.organizationId || null;
}
