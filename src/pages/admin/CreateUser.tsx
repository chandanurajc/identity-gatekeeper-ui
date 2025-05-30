
import { useNavigate } from "react-router-dom";
import { UserFormData } from "@/types/user";
import { userService } from "@/services/userService";
import UserForm from "@/components/admin/UserForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const CreateUser = () => {
  const navigate = useNavigate();
  const { canCreateUsers } = usePermissions();
  const { user } = useAuth();

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      // Use user name instead of ID for created_by field
      const createdByValue = user?.name || "unknown";
      
      console.log("Creating user with data:", userData);
      console.log("Using createdBy value:", createdByValue);
      console.log("Current user organization ID:", user?.organizationId);
      
      // Use the organizationId from userData (selected in form), not from current user
      await userService.createUser(userData, createdByValue, userData.organizationId);
      
      console.log("User created successfully, navigating to users list");
      
      // Show success message and navigate back to users list - DON'T auto-login
      toast.success("User created successfully");
      navigate("/admin/users");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    }
  };

  if (!canCreateUsers) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to create users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>
            Add a new user to the system. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <UserForm onSubmit={handleCreateUser} />
    </div>
  );
};

export default CreateUser;
