
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserFormData, User } from "@/types/user";
import { userService } from "@/services/userService";
import UserForm from "@/components/admin/UserForm";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { RefreshCw } from "lucide-react";

const EditUser = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEditUsers } = usePermissions();
  const { user: currentUser } = useAuth();

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

        setLoading(true);
        console.log("Fetching user data for ID:", userId);
        const userData = await userService.getUserById(userId);
        
        if (!userData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "User not found.",
          });
          navigate("/admin/users");
          return;
        }
        
        console.log("User data fetched:", userData);
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
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

  const handleUpdateUser = async (userData: UserFormData) => {
    if (!userId) return;
    
    try {
      console.log("=== Starting user update process ===");
      console.log("User ID:", userId);
      console.log("Form data received:", userData);
      console.log("Current user organization:", currentUser?.organizationId);
      
      // Use user name instead of ID for updated_by field
      const updatedByValue = currentUser?.name || "unknown";
      console.log("Updated by value:", updatedByValue);
      
      // Update user with organization context
      await userService.updateUser(userId, userData, updatedByValue, currentUser?.organizationId);
      
      toast({
        title: "User updated successfully",
        description: "The user has been updated successfully.",
      });
      
      navigate("/admin/users");
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  if (!canEditUsers) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to edit users.
            </CardDescription>
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
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading</span>
            </CardTitle>
            <CardDescription>
              Loading user data...
            </CardDescription>
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
            <CardDescription>
              The requested user could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Transform user data to form data format
  const userFormData: Partial<UserFormData> = {
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    designation: user.designation,
    organizationId: user.organizationId || '',
    roles: user.roles || [],
    effectiveFrom: user.effectiveFrom,
    effectiveTo: user.effectiveTo,
  };

  console.log("Passing form data to UserForm:", userFormData);

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edit User: {user.firstName} {user.lastName}</CardTitle>
          <CardDescription>
            Update user information. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <UserForm initialData={userFormData} isEditing onSubmit={handleUpdateUser} />
    </div>
  );
};

export default EditUser;
