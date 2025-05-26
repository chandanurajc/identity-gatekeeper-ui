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
          .maybeSingle();

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
      .maybeSingle();

    if (error) {
      console.error("Error fetching user:", error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!profile) {
      console.log("No user found with ID:", id);
      return null;
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
      .maybeSingle();

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
    console.log("=== STARTING USER CREATION PROCESS ===");
    console.log("Creating user with data:", userData);
    console.log("Organization ID:", organizationId);
    console.log("Created by:", createdByUserName);
    
    let authUserId: string | null = null;
    
    try {
      // Step 1: Create the auth user using regular signup (not admin)
      console.log("Step 1: Creating auth user using signup...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'TempPass123!', // Provide a default if not specified
        options: {
          emailRedirectTo: undefined, // Disable email confirmation for now
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("No user data returned from signup");
      }

      authUserId = authData.user.id;
      console.log("✓ Auth user created successfully:", authUserId);

      // Step 2: Wait for auth user to be fully committed
      console.log("Step 2: Waiting for auth user to be committed...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

      // Step 3: Create/Update profile (the trigger should have created it, but we'll update it)
      console.log("Step 3: Updating user profile...");
      const profileData = {
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

      console.log("Profile data to update:", profileData);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: authUserId,
          ...profileData
        }])
        .select()
        .single();

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw new Error(`Failed to update user profile: ${profileError.message}`);
      }

      console.log("✓ Profile updated successfully:", profile.id);

      // Step 4: Create phone number entry if provided
      if (userData.phone && userData.phone.countryCode && userData.phone.number) {
        console.log("Step 4: Creating phone number entry...");
        const { error: phoneError } = await supabase
          .from('phone_numbers')
          .insert([{
            profile_id: authUserId,
            country_code: userData.phone.countryCode,
            number: userData.phone.number
          }]);

        if (phoneError) {
          console.error("Error creating phone number:", phoneError);
          // Don't fail the entire process for phone number issues
        } else {
          console.log("✓ Phone number created successfully");
        }
      }

      // Step 5: Handle roles if provided - simplified approach
      if (userData.roles && userData.roles.length > 0) {
        console.log("Step 5: Assigning roles...");
        console.log("Roles to assign:", userData.roles);
        
        // Additional wait to ensure all database operations are committed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          await this.assignRolesToUser(authUserId, userData.roles, createdByUserName);
          console.log("✓ Roles assigned successfully");
        } catch (roleError) {
          console.error("Error assigning roles (non-fatal):", roleError);
          // Don't fail user creation if role assignment fails
          // The user can be created and roles assigned later
        }
      }

      console.log("=== USER CREATION COMPLETED SUCCESSFULLY ===");

      // Return the created user
      return {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        username: profile.username,
        email: profile.username,
        phone: userData.phone,
        designation: profile.designation,
        organizationId: profile.organization_id,
        organizationName: '', // Will be populated when fetching
        roles: userData.roles || [],
        effectiveFrom: profile.effective_from ? new Date(profile.effective_from) : new Date(),
        effectiveTo: profile.effective_to ? new Date(profile.effective_to) : undefined,
        createdBy: profile.created_by,
        createdOn: profile.created_on ? new Date(profile.created_on) : new Date(),
        updatedBy: profile.updated_by,
        updatedOn: profile.updated_on ? new Date(profile.updated_on) : undefined,
      };

    } catch (error) {
      console.error("=== USER CREATION FAILED ===");
      console.error("Error details:", error);
      
      // Note: With regular signup, we can't easily delete the auth user if something fails
      // The user will exist in auth but may not have complete profile data
      // This is acceptable as they can complete their profile later or admin can fix it
      
      throw error;
    }
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
      .maybeSingle();

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
        .maybeSingle();

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

    // Handle roles update if provided - IMPROVED VERSION
    if (userData.roles && Array.isArray(userData.roles)) {
      console.log("=== STARTING ROLE UPDATE PROCESS ===");
      console.log("Roles to assign:", userData.roles);
      
      try {
        // First, delete all existing roles for this user
        console.log("Step 1: Deleting existing user roles...");
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', id);

        if (deleteError) {
          console.error("Error deleting existing roles:", deleteError);
          throw new Error(`Failed to delete existing roles: ${deleteError.message}`);
        }

        console.log("✓ Existing roles deleted successfully");

        // If roles are provided, assign them
        if (userData.roles.length > 0) {
          console.log("Step 2: Fetching available roles from database...");
          
          // Get all available roles
          const { data: availableRoles, error: rolesError } = await supabase
            .from('roles')
            .select('id, name');

          if (rolesError) {
            console.error("Error fetching available roles:", rolesError);
            throw new Error(`Failed to fetch available roles: ${rolesError.message}`);
          }

          console.log("Available roles in database:", availableRoles?.map(r => r.name));

          // Match the role names with database roles (case-insensitive)
          const rolesToAssign = userData.roles
            .map(roleName => {
              const foundRole = availableRoles?.find(role => 
                role.name.toLowerCase() === roleName.toLowerCase()
              );
              if (!foundRole) {
                console.warn(`Role not found in database: ${roleName}`);
              }
              return foundRole;
            })
            .filter(Boolean);

          console.log("Roles matched for assignment:", rolesToAssign?.map(r => r?.name));

          if (rolesToAssign && rolesToAssign.length > 0) {
            console.log("Step 3: Inserting new user roles...");
            
            const userRoleInserts = rolesToAssign.map(role => ({
              user_id: id,
              role_id: role!.id,
              assigned_by: updatedByUserName,
              assigned_on: new Date().toISOString()
            }));

            console.log("User role data to insert:", userRoleInserts);

            const { data: insertedRoles, error: insertError } = await supabase
              .from('user_roles')
              .insert(userRoleInserts)
              .select(`
                id,
                user_id,
                role_id,
                roles (
                  name
                )
              `);

            if (insertError) {
              console.error("Error inserting new roles:", insertError);
              throw new Error(`Failed to assign new roles: ${insertError.message}`);
            }

            console.log("✓ New roles assigned successfully:", insertedRoles);

            // Verification step
            console.log("Step 4: Verifying role assignment...");
            const { data: verifyRoles, error: verifyError } = await supabase
              .from('user_roles')
              .select(`
                roles (
                  name
                )
              `)
              .eq('user_id', id);

            if (verifyError) {
              console.error("Error verifying roles:", verifyError);
            } else {
              const assignedRoleNames = verifyRoles?.map(ur => ur.roles?.name).filter(Boolean) || [];
              console.log("✓ Final verification - User now has roles:", assignedRoleNames);
            }

          } else {
            console.log("No valid roles found to assign");
          }
        } else {
          console.log("No roles to assign - user will have no roles");
        }

        console.log("=== ROLE UPDATE COMPLETED SUCCESSFULLY ===");

      } catch (roleError) {
        console.error("=== ROLE UPDATE FAILED ===");
        console.error("Role assignment error:", roleError);
        // Don't fail the entire user update if role assignment fails
        console.log("Continuing with user update despite role assignment failure");
      }
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
    console.log("=== ASSIGN ROLES TO USER ===");
    console.log("User ID:", userId);
    console.log("Role names to assign:", roleNames);
    console.log("Assigned by:", assignedBy);
    
    if (!roleNames || roleNames.length === 0) {
      console.log("No roles to assign, skipping");
      return;
    }

    try {
      // Step 1: Verify user exists in profiles table (removed auth admin check)
      console.log("Step 1: Verifying user exists in profiles table...");
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (profileCheckError || !userProfile) {
        console.error("User profile verification failed:", profileCheckError);
        throw new Error(`User profile not found: ${profileCheckError?.message || 'User profile does not exist'}`);
      }

      console.log("✓ User profile verified:", userProfile.id);
      
      // Step 2: Get ALL roles from database
      console.log("Step 2: Fetching available roles...");
      const { data: allRoles, error: allRolesError } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      if (allRolesError) {
        console.error("Error fetching roles:", allRolesError);
        throw new Error(`Failed to fetch roles: ${allRolesError.message}`);
      }

      console.log("Available roles in database:", allRoles?.map(r => r.name));
      
      // Step 3: Match roles by exact name
      const matchedRoles = allRoles?.filter(role => 
        roleNames.includes(role.name)
      ) || [];

      console.log("Matched roles for assignment:", matchedRoles);

      if (matchedRoles.length === 0) {
        console.error("No roles found for exact names:", roleNames);
        console.log("Available role names:", allRoles?.map(r => r.name));
        throw new Error(`No valid roles found for: ${roleNames.join(', ')}`);
      }

      if (matchedRoles.length !== roleNames.length) {
        const foundRoleNames = matchedRoles.map(r => r.name);
        const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
        console.warn("Some roles not found:", missingRoles);
        console.log("Available roles:", allRoles?.map(r => r.name));
      }

      // Step 4: Delete existing roles to avoid conflicts
      console.log("Step 4: Cleaning up existing user roles...");
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error("Error deleting existing roles:", deleteError);
        // Continue anyway - user might not have had roles before
      } else {
        console.log("✓ Existing roles cleaned up");
      }

      // Step 5: Create new user_roles entries
      console.log("Step 5: Creating new user role assignments...");
      const userRoleData = matchedRoles.map(role => ({
        user_id: userId,
        role_id: role.id,
        assigned_by: assignedBy,
      }));

      console.log("User role data to insert:", userRoleData);

      const { data: insertedRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .insert(userRoleData)
        .select(`
          id,
          user_id,
          role_id,
          roles (
            name
          )
        `);

      if (userRolesError) {
        console.error("Error inserting user roles:", userRolesError);
        throw new Error(`Failed to assign roles: ${userRolesError.message}`);
      }

      console.log("✓ Roles assigned successfully:", insertedRoles);
      
      // Step 6: Verify assignment worked
      console.log("Step 6: Verifying role assignment...");
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
        const assignedRoleNames = verifyRoles?.map(ur => ur.roles?.name).filter(Boolean) || [];
        console.log("✓ Final verification - User now has roles:", assignedRoleNames);
      }

      console.log("=== ROLE ASSIGNMENT COMPLETED ===");

    } catch (error) {
      console.error("=== ROLE ASSIGNMENT FAILED ===");
      console.error("Error details:", error);
      throw error;
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

    // Note: Can't delete auth user without admin privileges
    console.log("User profile and related data deleted successfully");
    console.log("Note: Auth user still exists - requires admin privileges to delete");
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
