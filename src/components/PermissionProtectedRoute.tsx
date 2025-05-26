
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRoles?: string[];
}

const PermissionProtectedRoute = ({ 
  children, 
  requiredPermission,
  requiredRoles = [] 
}: PermissionProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  if (isLoading || permissionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user has admin role (multiple variations)
  const isAdmin = user?.roles.some(role => 
    role.toLowerCase().includes('admin') || 
    role === 'Admin-Role' || 
    role === 'admin'
  );

  // Admin users can access everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check roles if no permission specified but roles are required
  if (!requiredPermission && requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PermissionProtectedRoute;
