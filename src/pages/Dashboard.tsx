
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions"; 
import { Users } from "lucide-react";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { canViewUsers } = usePermissions();
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>

      <DashboardWidgets />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name || user?.email}!</CardTitle>
            <CardDescription>
              Your current role{user?.roles.length !== 1 ? 's' : ''}: {user?.roles.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is your application dashboard. From here you can manage various aspects of the application.</p>
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
