
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [] 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user has at least one of the required roles
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
