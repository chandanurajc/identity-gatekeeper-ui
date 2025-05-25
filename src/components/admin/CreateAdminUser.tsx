
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
      
      // Check if ADMN organization exists
      console.log("Checking for ADMN organization...");
      const { data: adminOrgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, code')
        .ilike('code', 'ADMN');

      console.log("ADMN organization search result:", { adminOrgs, orgError });

      let adminOrg = null;
      if (adminOrgs && adminOrgs.length > 0) {
        adminOrg = adminOrgs[0];
        console.log("Found existing ADMN organization:", adminOrg);
      } else {
        // Create ADMN organization
        console.log("Creating ADMN organization...");
        const { data: newOrg, error: createOrgError } = await supabase
          .from('organizations')
          .insert({
            name: 'ADMN Organization',
            code: 'ADMN',
            status: 'active',
            description: 'Administrative Organization',
            organization_references: [{"id": "ref-admin-1", "type": "GST", "value": "ADMIN123456789"}],
            contacts: [{
              "id": "contact-admin-1",
              "type": "Registered location",
              "firstName": "System",
              "lastName": "Administrator",
              "address1": "Admin Office",
              "address2": "Main Building",
              "postalCode": "00000",
              "city": "Admin City",
              "state": "Admin State",
              "country": "Admin Country",
              "phoneNumber": "+1-000-000-0000",
              "email": "admin@system.com",
              "website": "www.admin.system"
            }]
          })
          .select('id, name, code')
          .single();

        console.log("Organization creation result:", { newOrg, createOrgError });

        if (createOrgError) {
          console.error("Failed to create ADMN organization:", createOrgError);
          throw new Error(`Failed to create ADMN organization: ${createOrgError.message}`);
        }
        adminOrg = newOrg;
      }

      if (!adminOrg) {
        throw new Error('Could not find or create ADMN organization');
      }

      console.log("Using ADMN organization:", adminOrg);

      // Check if Admin-Role exists
      console.log("Looking for Admin-Role...");
      const { data: adminRoles, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', 'Admin-Role');

      console.log("Admin-Role search result:", { adminRoles, roleError });

      let adminRole = null;
      if (adminRoles && adminRoles.length > 0) {
        adminRole = adminRoles[0];
        console.log("Found existing Admin-Role:", adminRole);
      } else {
        // Create Admin-Role
        console.log("Creating Admin-Role...");
        const { data: newRole, error: createRoleError } = await supabase
          .from('roles')
          .insert({
            name: 'Admin-Role',
            description: 'Administrative role with full system access',
            organization_id: adminOrg.id
          })
          .select('id, name')
          .single();

        console.log("Role creation result:", { newRole, createRoleError });

        if (createRoleError) {
          console.error("Failed to create Admin-Role:", createRoleError);
          throw new Error(`Failed to create Admin-Role: ${createRoleError.message}`);
        }
        adminRole = newRole;
      }

      if (!adminRole) {
        throw new Error('Could not find or create Admin-Role');
      }

      console.log("Using Admin-Role:", adminRole);

      // Create the auth user using admin.createUser
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
