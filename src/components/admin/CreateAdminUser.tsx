
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
      // First, get the ADMN organization ID (not ADMIN)
      const { data: adminOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('code', 'ADMN')
        .single();

      if (orgError || !adminOrg) {
        throw new Error('ADMN organization not found');
      }

      // Get the Admin-Role ID
      const { data: adminRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Admin-Role')
        .single();

      if (roleError || !adminRole) {
        throw new Error('Admin-Role not found');
      }

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@admin.com',
        password: 'Password@admin',
        email_confirm: true,
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User'
        }
      });

      if (authError) {
        throw authError;
      }

      // Update the profile with organization
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
        throw profileError;
      }

      // Assign the Admin-Role to the user
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role_id: adminRole.id
        });

      if (userRoleError) {
        throw userRoleError;
      }

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
