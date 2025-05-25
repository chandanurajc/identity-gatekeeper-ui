
import { useAuth } from "@/context/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { useState, useEffect } from "react";

export const useDivisionPermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      if (user && user.id && isAuthenticated) {
        try {
          console.log("Fetching division permissions for user:", user.id);
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
  }, [user, isAuthenticated]);

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
