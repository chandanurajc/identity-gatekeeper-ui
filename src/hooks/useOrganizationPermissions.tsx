
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect } from "react";

export const useOrganizationPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      if (user && user.id) {
        try {
          console.log("Fetching organization permissions for user:", user.id);
          const userPermissions = await getUserPermissions(user.id);
          setPermissions(userPermissions);
        } catch (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        }
      } else {
        setPermissions([]);
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  const canViewOrganization = permissions.includes("view-organization");
  const canCreateOrganization = permissions.includes("create-organization");
  const canEditOrganization = permissions.includes("edit-organization");

  return {
    canViewOrganization,
    canCreateOrganization,
    canEditOrganization,
    isLoading: loading,
  };
};
