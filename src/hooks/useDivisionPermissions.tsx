
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect } from "react";

// Mock permissions for development/testing with mock auth
const getMockDivisionPermissions = (userId: string): string[] => {
  if (userId === "1") {
    return ["view-division", "create-division", "edit-division"];
  }
  return ["view-division"];
};

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const useDivisionPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      if (user && user.id) {
        try {
          console.log("Fetching division permissions for user:", user.id);
          
          // Check if this is a mock user ID (not UUID format)
          if (!isValidUUID(user.id)) {
            console.log("Using mock division permissions for non-UUID user ID");
            const mockPermissions = getMockDivisionPermissions(user.id);
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

  const canViewDivision = permissions.includes("view-division");
  const canCreateDivision = permissions.includes("create-division");
  const canEditDivision = permissions.includes("edit-division");

  return {
    canViewDivision,
    canCreateDivision,
    canEditDivision,
    isLoading: loading,
  };
};
