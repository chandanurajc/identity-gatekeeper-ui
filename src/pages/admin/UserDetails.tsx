
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@/types/user";
import { getUserById } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { Edit } from "lucide-react";

const UserDetails = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewUsers, canEditUsers } = usePermissions();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "User ID is missing.",
          });
          navigate("/admin/users");
          return;
        }

        const userData = await getUserById(userId);
        
        if (!userData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "User not found.",
          });
          navigate("/admin/users");
          return;
        }
        
        setUser(userData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user data.",
        });
        navigate("/admin/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate, toast]);

  const handleEditUser = () => {
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleGoBack = () => {
    navigate("/admin/users");
  };

  const handleViewActivityLogs = () => {
    toast({
      title: "Activity Logs",
      description: "This feature is not yet implemented.",
    });
    // In a real application, navigate to the activity logs page
    // navigate(`/admin/users/${userId}/activity-logs`);
  };

  if (!canViewUsers) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <p className="text-gray-600">You don't have permission to view user details.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <p className="text-gray-600">Loading user details...</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <p className="text-gray-600">The requested user could not be found.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Details: {user.firstName} {user.lastName}</CardTitle>
            {canEditUsers && (
              <Button onClick={handleEditUser}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="mt-4 space-y-2">
              <div>
                <span className="font-medium">Username:</span> {user.username}
              </div>
              <div>
                <span className="font-medium">Full Name:</span> {user.firstName} {user.lastName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {user.phone ? `${user.phone.countryCode} ${user.phone.number}` : 'Not set'}
              </div>
              <div>
                <span className="font-medium">Designation:</span> {user.designation || 'Not set'}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Roles & Permissions</h3>
            <div className="mt-4 space-y-2">
              <div>
                <span className="font-medium">Roles:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <div key={role} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {role}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">Effective From:</span> {new Date(user.effectiveFrom).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Effective To:</span> {user.effectiveTo ? new Date(user.effectiveTo).toLocaleDateString() : 'No end date'}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-medium">System Information</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Created By:</span> {user.createdBy}
              </div>
              <div>
                <span className="font-medium">Created On:</span> {new Date(user.createdOn).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated By:</span> {user.updatedBy || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Updated On:</span> {user.updatedOn ? new Date(user.updatedOn).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleGoBack}>
            Go Back
          </Button>
          {canViewUsers && (
            <Button variant="outline" onClick={handleViewActivityLogs}>
              Activity Logs
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserDetails;
