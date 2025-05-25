
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect } from "react";

// Mock permissions for development/testing with mock auth
const getMockOrganizationPermissions = (userId: string): string[] => {
  if (userId === "1") {
    return ["view-organization", "create-organization", "edit-organization"];
  }
  return ["view-organization"];
};

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

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
          
          // Check if this is a mock user ID (not UUID format)
          if (!isValidUUID(user.id)) {
            console.log("Using mock organization permissions for non-UUID user ID");
            const mockPermissions = getMockOrganizationPermissions(user.id);
            setPermissions(mockPermissions);
          } else {
            // Use real Supabase permissions for UUID users
            const userPermissions = await getUserPermissions(user.id);
            setPermissions(userPermissions);
          }
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
