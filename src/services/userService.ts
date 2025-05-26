import { supabase } from "@/integrations/supabase/client";
import { User, UserFormData, PhoneNumber } from "@/types/user";

export const userService = {
  async getUsers(): Promise<User[]> {
    console.log("Fetching users...");
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (
          name
        )
      `)
      .order('created_on', { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    console.log("Raw profiles data:", profiles);

    // Transform profiles to users with roles
    const usersWithRoles = await Promise.all(
      (profiles || []).map(async (profile) => {
        console.log("Processing profile:", profile.id);
        
        // Get user roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            roles (
              name
            )
          `)
          .eq('user_id', profile.id);

        if (rolesError) {
          console.error("Error fetching roles for user:", profile.id, rolesError);
        }

        const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
        console.log("Roles for user", profile.id, ":", roles);

        // Parse phone data safely
        let phoneData: PhoneNumber | undefined;
        if (profile.phone && typeof profile.phone === 'object') {
          phoneData = profile.phone as PhoneNumber;
        }

        return {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          username: profile.username,
          email: profile.username, // Using username as email
          phone: phoneData,
          designation: profile.designation,
          organizationId: profile.organization_id,
          organizationName: (profile.organizations as any)?.name,
          roles: roles,
          effectiveFrom: profile.effective_from ? new Date(profile.effective_from) : new Date(),
          effectiveTo: profile.effective_to ? new Date(profile.effective_to) : undefined,
          createdBy: profile.created_by,
          createdOn: profile.created_on ? new Date(profile.created_on) : new Date(),
          updatedBy: profile.updated_by,
          updatedOn: profile.updated_on ? new Date(profile.updated_on) : undefined,
        };
      })
    );

    console.log("Users with roles:", usersWithRoles);
    return usersWithRoles;
  },

  async getUserById(id: string): Promise<User | null> {
    console.log("Fetching user by ID:", id);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    console.log("Profile data:", profile);

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', profile.id);

    if (rolesError) {
      console.error("Error fetching roles for user:", rolesError);
    }

    const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
    console.log("User roles:", roles);

    // Parse phone data safely
    let phoneData: PhoneNumber | undefined;
    if (profile.phone && typeof profile.phone === 'object') {
      phoneData = profile.phone as PhoneNumber;
    }

    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      username: profile.username,
      email: profile.username,
      phone: phoneData,
      designation: profile.designation,
      organizationId: profile.organization_id,
      organizationName: (profile.organizations as any)?.name,
      roles: roles,
      effectiveFrom: profile.effective_from ? new Date(profile.effective_from) : new Date(),
      effectiveTo: profile.effective_to ? new Date(profile.effective_to) : undefined,
      createdBy: profile.created_by,
      createdOn: profile.created_on ? new Date(profile.created_on) : new Date(),
      updatedBy: profile.updated_by,
      updatedOn: profile.updated_on ? new Date(profile.updated_on) : undefined,
    };
  },

  async createUser(userData: UserFormData, createdByUserName: string, organizationId: string | null): Promise<User> {
    console.log("Creating user with data:", userData);
    console.log("Organization ID:", organizationId);
    console.log("Created by:", createdByUserName);
    
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    console.log("Auth user created:", authData.user.id);

    // Create profile
    const profileData = {
      id: authData.user.id,
      first_name: userData.firstName,
      last_name: userData.lastName,
      username: userData.username,
      phone: userData.phone,
      designation: userData.designation,
      organization_id: organizationId,
      effective_from: userData.effectiveFrom?.toISOString(),
      effective_to: userData.effectiveTo?.toISOString(),
      created_by: createdByUserName,
      updated_by: createdByUserName,
    };

    console.log("Creating profile with data:", profileData);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log("Profile created:", profile);

    // Handle roles if provided
    if (userData.roles && userData.roles.length > 0) {
      console.log("Assigning roles:", userData.roles);
      await this.assignRolesToUser(authData.user.id, userData.roles, createdByUserName);
    }

    // Parse phone data safely
    let phoneData: PhoneNumber | undefined;
    if (profile.phone && typeof profile.phone === 'object') {
      phoneData = profile.phone as PhoneNumber;
    }

    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      username: profile.username,
      email: profile.username,
      phone: phoneData,
      designation: profile.designation,
      organizationId: profile.organization_id,
      roles: userData.roles || [],
      effectiveFrom: profile.effective_from ? new Date(profile.effective_from) : new Date(),
      effectiveTo: profile.effective_to ? new Date(profile.effective_to) : undefined,
      createdBy: profile.created_by,
      createdOn: profile.created_on ? new Date(profile.created_on) : new Date(),
      updatedBy: profile.updated_by,
      updatedOn: profile.updated_on ? new Date(profile.updated_on) : undefined,
    };
  },

  async updateUser(id: string, userData: UserFormData, updatedByUserName: string, organizationId?: string | null): Promise<User> {
    console.log("=== updateUser called ===");
    console.log("User ID:", id);
    console.log("User data:", userData);
    console.log("Updated by:", updatedByUserName);
    console.log("Organization ID:", organizationId);
    
    // Update profile data
    const profileUpdateData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      username: userData.username,
      phone: userData.phone,
      designation: userData.designation,
      organization_id: organizationId || userData.organizationId,
      effective_from: userData.effectiveFrom?.toISOString(),
      effective_to: userData.effectiveTo?.toISOString(),
      updated_by: updatedByUserName,
      updated_on: new Date().toISOString(),
    };

    console.log("Profile update data:", profileUpdateData);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw new Error(`Failed to update user profile: ${profileError.message}`);
    }

    console.log("Profile updated successfully:", profile);

    // Handle roles update if provided
    if (userData.roles) {
      console.log("Updating user roles to:", userData.roles);
      await this.updateUserRoles(id, userData.roles, updatedByUserName);
    }

    // Handle password update if provided
    if (userData.password && userData.password.trim() !== '') {
      console.log("Updating user password");
      const { error: passwordError } = await supabase.auth.admin.updateUserById(id, {
        password: userData.password
      });

      if (passwordError) {
        console.error("Error updating password:", passwordError);
        throw new Error(`Failed to update password: ${passwordError.message}`);
      }
      console.log("Password updated successfully");
    }

    // Fetch updated user with roles
    const updatedUser = await this.getUserById(id);
    if (!updatedUser) {
      throw new Error("Failed to fetch updated user data");
    }

    console.log("User update completed successfully:", updatedUser);
    return updatedUser;
  },

  async assignRolesToUser(userId: string, roleNames: string[], assignedBy: string): Promise<void> {
    console.log("Assigning roles to user:", userId, roleNames);
    
    // Get role IDs from role names
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .in('name', roleNames);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      throw new Error(`Failed to fetch roles: ${rolesError.message}`);
    }

    if (!roles || roles.length === 0) {
      console.error("No roles found for names:", roleNames);
      throw new Error("No valid roles found");
    }

    console.log("Found roles:", roles);

    // Create user_roles entries
    const userRoleData = roles.map(role => ({
      user_id: userId,
      role_id: role.id,
      assigned_by: assignedBy,
    }));

    console.log("Inserting user roles:", userRoleData);

    const { error: userRolesError } = await supabase
      .from('user_roles')
      .insert(userRoleData);

    if (userRolesError) {
      console.error("Error assigning roles:", userRolesError);
      throw new Error(`Failed to assign roles: ${userRolesError.message}`);
    }

    console.log("Roles assigned successfully");
  },

  async updateUserRoles(userId: string, roleNames: string[], assignedBy: string): Promise<void> {
    console.log("=== updateUserRoles called ===");
    console.log("User ID:", userId);
    console.log("Role names:", roleNames);
    console.log("Assigned by:", assignedBy);
    
    // First, delete existing user roles
    console.log("Deleting existing user roles...");
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error("Error deleting existing roles:", deleteError);
      throw new Error(`Failed to delete existing roles: ${deleteError.message}`);
    }

    console.log("Existing roles deleted successfully");

    // Then assign new roles if any
    if (roleNames && roleNames.length > 0) {
      console.log("Assigning new roles...");
      await this.assignRolesToUser(userId, roleNames, assignedBy);
      console.log("New roles assigned successfully");
    } else {
      console.log("No roles to assign");
    }
  },

  async deleteUser(id: string): Promise<void> {
    console.log("Deleting user:", id);
    
    // Delete user roles first
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', id);
    
    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw new Error(`Failed to delete user profile: ${profileError.message}`);
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    console.log("User deleted successfully");
  }
};

export const getUserPermissions = async (userId: string): Promise<string[]> => {
  console.log("=== getUserPermissions called ===");
  console.log("Fetching permissions for user ID:", userId);
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_permissions (
            permissions (
              name
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching user permissions:", error);
      throw new Error(`Failed to fetch user permissions: ${error.message}`);
    }

    console.log("Raw permissions data:", data);

    const permissions: string[] = [];
    
    if (data) {
      data.forEach((userRole: any) => {
        if (userRole.roles?.role_permissions) {
          userRole.roles.role_permissions.forEach((rolePermission: any) => {
            if (rolePermission.permissions?.name) {
              permissions.push(rolePermission.permissions.name);
            }
          });
        }
      });
    }

    const uniquePermissions = [...new Set(permissions)];
    console.log("Final permissions array:", uniquePermissions);
    
    return uniquePermissions;
  } catch (error) {
    console.error("Error in getUserPermissions:", error);
    return [];
  }
};
