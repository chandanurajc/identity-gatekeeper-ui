
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CreateAdminUser = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createAdminUser = async () => {
    setIsCreating(true);
    try {
      console.log("Starting admin user creation process...");
      
      // First, get the ADMN organization ID
      console.log("Looking for ADMN organization...");
      const { data: adminOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, code')
        .eq('code', 'ADMN')
        .single();

      console.log("Organization query result:", { adminOrg, orgError });

      if (orgError || !adminOrg) {
        console.error("ADMN organization not found:", orgError);
        throw new Error('ADMN organization not found. Please ensure the organization is created in the database.');
      }

      console.log("Found ADMN organization:", adminOrg);

      // Get the Admin-Role ID
      console.log("Looking for Admin-Role...");
      const { data: adminRole, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', 'Admin-Role')
        .single();

      console.log("Role query result:", { adminRole, roleError });

      if (roleError || !adminRole) {
        console.error("Admin-Role not found:", roleError);
        throw new Error('Admin-Role not found. Please ensure the role is created in the database.');
      }

      console.log("Found Admin-Role:", adminRole);

      // Create the auth user
      console.log("Creating auth user...");
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@admin.com',
        password: 'Password@admin',
        email_confirm: true,
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User'
        }
      });

      console.log("Auth user creation result:", { user: authData?.user?.email, error: authError });

      if (authError) {
        console.error("Auth user creation error:", authError);
        throw authError;
      }

      // Update the profile with organization
      console.log("Updating user profile...");
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organization_id: adminOrg.id,
          first_name: 'Admin',
          last_name: 'User',
          designation: 'System Administrator'
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      console.log("Profile updated successfully");

      // Assign the Admin-Role to the user
      console.log("Assigning Admin-Role to user...");
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role_id: adminRole.id
        });

      if (userRoleError) {
        console.error("User role assignment error:", userRoleError);
        throw userRoleError;
      }

      console.log("Admin user created successfully!");

      toast({
        title: "Admin user created successfully",
        description: "admin@admin.com has been created with Admin-Role in ADMN organization",
      });

    } catch (error: any) {
      console.error('Error creating admin user:', error);
      toast({
        variant: "destructive",
        title: "Failed to create admin user",
        description: error.message || "An error occurred while creating the admin user",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Admin User</CardTitle>
        <CardDescription>
          Create an admin user with credentials: admin@admin.com / Password@admin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={createAdminUser} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Creating..." : "Create Admin User"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateAdminUser;
