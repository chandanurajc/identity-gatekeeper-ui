
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

    // Transform profiles to users with roles and phone numbers
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

        // Get phone data from separate table
        const { data: phoneData, error: phoneError } = await supabase
          .from('phone_numbers')
          .select('country_code, number')
          .eq('profile_id', profile.id)
          .single();

        if (phoneError && phoneError.code !== 'PGRST116') {
          console.error("Error fetching phone for user:", profile.id, phoneError);
        }

        const phone = phoneData ? {
          countryCode: phoneData.country_code,
          number: phoneData.number
        } : undefined;

        return {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          username: profile.username,
          email: profile.username,
          phone: phone,
          designation: profile.designation,
          organizationId: profile.organization_id,
          organizationName: profile.organizations?.name || '',
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
        return null;
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

    // Get phone data from separate table
    const { data: phoneData, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('country_code, number')
      .eq('profile_id', profile.id)
      .single();

    if (phoneError && phoneError.code !== 'PGRST116') {
      console.error("Error fetching phone for user:", profile.id, phoneError);
    }

    const phone = phoneData ? {
      countryCode: phoneData.country_code,
      number: phoneData.number
    } : undefined;

    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      username: profile.username,
      email: profile.username,
      phone: phone,
      designation: profile.designation,
      organizationId: profile.organization_id,
      organizationName: profile.organizations?.name || '',
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
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log("Profile created:", profile);

    // Create phone number entry if provided
    if (userData.phone && userData.phone.countryCode && userData.phone.number) {
      const { error: phoneError } = await supabase
        .from('phone_numbers')
        .insert([{
          profile_id: authData.user.id,
          country_code: userData.phone.countryCode,
          number: userData.phone.number
        }]);

      if (phoneError) {
        console.error("Error creating phone number:", phoneError);
      }
    }

    // Handle roles if provided - WAIT for profile creation to complete
    if (userData.roles && userData.roles.length > 0) {
      console.log("Assigning roles:", userData.roles);
      // Add delay to ensure profile is fully created
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.assignRolesToUser(authData.user.id, userData.roles, createdByUserName);
    }

    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      username: profile.username,
      email: profile.username,
      phone: userData.phone,
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
    
    // First verify the user exists in profiles table
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (profileCheckError || !existingProfile) {
      console.error("User profile not found:", profileCheckError);
      throw new Error(`User profile not found: ${profileCheckError?.message || 'Unknown error'}`);
    }

    console.log("User profile verified:", existingProfile);

    // Update profile data
    const profileUpdateData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      username: userData.username,
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

    // Update phone number if provided
    if (userData.phone && userData.phone.countryCode && userData.phone.number) {
      const { data: existingPhone } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('profile_id', id)
        .single();

      if (existingPhone) {
        const { error: phoneUpdateError } = await supabase
          .from('phone_numbers')
          .update({
            country_code: userData.phone.countryCode,
            number: userData.phone.number,
            updated_on: new Date().toISOString()
          })
          .eq('profile_id', id);

        if (phoneUpdateError) {
          console.error("Error updating phone number:", phoneUpdateError);
        }
      } else {
        const { error: phoneCreateError } = await supabase
          .from('phone_numbers')
          .insert([{
            profile_id: id,
            country_code: userData.phone.countryCode,
            number: userData.phone.number
          }]);

        if (phoneCreateError) {
          console.error("Error creating phone number:", phoneCreateError);
        }
      }
    }

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
    console.log("=== assignRolesToUser called ===");
    console.log("User ID:", userId);
    console.log("Role names to assign:", roleNames);
    console.log("Assigned by:", assignedBy);
    
    if (!roleNames || roleNames.length === 0) {
      console.log("No roles to assign, skipping");
      return;
    }

    // First verify user exists in profiles table (which should match auth.users)
    const { data: userProfile, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError || !userProfile) {
      console.error("User not found in profiles:", userCheckError);
      throw new Error(`User not found: ${userCheckError?.message || 'User does not exist'}`);
    }

    console.log("User verified in profiles table:", userProfile);
    
    // Get ALL roles from database first
    const { data: allRoles, error: allRolesError } = await supabase
      .from('roles')
      .select('id, name')
      .order('name');

    if (allRolesError) {
      console.error("Error fetching all roles:", allRolesError);
      throw new Error(`Failed to fetch roles: ${allRolesError.message}`);
    }

    console.log("All available roles in database:", allRoles);
    
    // Match roles by exact name (case-sensitive)
    const matchedRoles = allRoles?.filter(role => 
      roleNames.includes(role.name)
    ) || [];

    console.log("Exact matched roles:", matchedRoles);

    if (matchedRoles.length === 0) {
      console.error("No roles found for exact names:", roleNames);
      console.log("Available role names:", allRoles?.map(r => r.name));
      throw new Error(`No valid roles found for: ${roleNames.join(', ')}`);
    }

    if (matchedRoles.length !== roleNames.length) {
      const foundRoleNames = matchedRoles.map(r => r.name);
      const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
      console.warn("Some roles not found (exact match):", missingRoles);
      console.log("Available roles:", allRoles?.map(r => r.name));
    }

    // Delete existing roles for this user first to avoid conflicts
    console.log("Deleting existing user roles...");
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error("Error deleting existing roles:", deleteError);
      // Continue anyway - they might not have had roles before
    }

    // Create user_roles entries
    const userRoleData = matchedRoles.map(role => ({
      user_id: userId,
      role_id: role.id,
      assigned_by: assignedBy,
    }));

    console.log("Inserting user roles data:", userRoleData);

    const { data: insertedRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .insert(userRoleData)
      .select();

    if (userRolesError) {
      console.error("Error assigning roles:", userRolesError);
      throw new Error(`Failed to assign roles: ${userRolesError.message}`);
    }

    console.log("Roles assigned successfully:", insertedRoles);
    
    // Verify roles were actually inserted
    const { data: verifyRoles, error: verifyError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          name
        )
      `)
      .eq('user_id', userId);
      
    if (verifyError) {
      console.error("Error verifying role assignment:", verifyError);
    } else {
      console.log("Verification - User now has roles:", verifyRoles);
    }
  },

  async updateUserRoles(userId: string, roleNames: string[], assignedBy: string): Promise<void> {
    console.log("=== updateUserRoles called ===");
    console.log("User ID:", userId);
    console.log("New role names:", roleNames);
    console.log("Assigned by:", assignedBy);
    
    // First, get current roles for logging
    const { data: currentRoles } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', userId);
    
    console.log("Current user roles before update:", currentRoles?.map(ur => ur.roles?.name));
    
    // Delete existing user roles
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
    
    // Delete phone numbers
    await supabase
      .from('phone_numbers')
      .delete()
      .eq('profile_id', id);
    
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
