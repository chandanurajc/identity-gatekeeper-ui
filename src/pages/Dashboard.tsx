
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Welcome, {user?.name || user?.email}
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto py-8 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role(s):</span>
                  <span className="font-medium capitalize">
                    {user?.roles.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-medium">{user?.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Information</CardTitle>
              <CardDescription>Your roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {user?.roles.includes("admin") && (
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Full administrative access</span>
                  </li>
                )}
                {user?.roles.includes("user") && (
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Standard user access</span>
                  </li>
                )}
                {user?.roles.includes("guest") && (
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                    <span>Limited guest access</span>
                  </li>
                )}
              </ul>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Your roles determine your level of access to various features and actions within the system.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-6">
          <p className="text-sm text-center text-muted-foreground">
            This is a demo application with Role-Based Access Control (RBAC)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
