
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions"; 
import { Users, ShieldAlert } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { canViewUsers, canViewDashboard } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navigateToUserManagement = () => {
    navigate("/admin/users");
  };

  // If user doesn't have dashboard permission, show access denied message
  if (!canViewDashboard) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <ShieldAlert className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                You don't have permission to view the dashboard content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please contact your administrator if you believe you should have access to this area.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show full dashboard for users with permission
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name || user?.email}!</CardTitle>
            <CardDescription>
              Your current role{user?.roles.length !== 1 ? 's' : ''}: {user?.roles.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is your application dashboard.</p>
          </CardContent>
        </Card>

        {canViewUsers && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create, view, and edit user accounts in the system.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={navigateToUserManagement}>
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
