
import { supabase } from "@/integrations/supabase/client";
import { User, UserRole, Permission, Role, PhoneNumber } from "@/types/user";

// Helper function to safely parse phone data from JSON
const parsePhoneNumber = (phoneJson: any): PhoneNumber | undefined => {
  if (!phoneJson) return undefined;
  
  if (typeof phoneJson === 'object' && phoneJson.countryCode && phoneJson.number) {
    return {
      countryCode: phoneJson.countryCode,
      number: phoneJson.number
    };
  }
  
  return undefined;
};

// Helper function to convert PhoneNumber to JSON for storage
const phoneToJson = (phone: PhoneNumber | undefined): any => {
  if (!phone) return null;
  return {
    countryCode: phone.countryCode,
    number: phone.number
  };
};

// Get all users from Supabase
export const getAllUsers = async (): Promise<User[]> => {
  console.log("=== getAllUsers service called ===");
  try {
    console.log("Starting Supabase query for profiles...");
    const startTime = Date.now();
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations:organization_id (
          id,
          name,
          code
        )
      `);

    const queryTime = Date.now() - startTime;
    console.log(`Profiles query completed in ${queryTime}ms`);

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    console.log("Profiles fetched:", {
      count: profiles?.length || 0,
      firstProfile: profiles?.[0] || null
    });

    // Get user roles separately to avoid relation issues
    const userIds = profiles?.map(p => p.id) || [];
    console.log("Fetching roles for user IDs:", userIds.length);
    
    const rolesStartTime = Date.now();
    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles (
          name
        )
      `)
      .in('user_id', userIds);

    const rolesQueryTime = Date.now() - rolesStartTime;
    console.log(`User roles query completed in ${rolesQueryTime}ms`);
    console.log("User roles data:", userRolesData);

    const mappedUsers = profiles?.map(profile => {
      const userRoles = userRolesData?.filter(ur => ur.user_id === profile.id) || [];
      const roles = userRoles.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

      return {
        id: profile.id,
        username: profile.username,
        email: profile.username, // Using username as email for now
        firstName: profile.first_name,
        lastName: profile.last_name,
        name: `${profile.first_name} ${profile.last_name}`,
        phone: parsePhoneNumber(profile.phone),
        designation: profile.designation,
        roles: roles,
        status: profile.status,
        organizationId: profile.organization_id,
        organizationName: profile.organizations?.name || "N/A",
        effectiveFrom: new Date(profile.effective_from),
        effectiveTo: profile.effective_to ? new Date(profile.effective_to) : undefined,
        createdBy: profile.created_by || "System", // This is now a username/string
        createdOn: new Date(profile.created_on),
        updatedBy: profile.updated_by || undefined, // This is now a username/string
        updatedOn: profile.updated_on ? new Date(profile.updated_on) : undefined,
      };
    }) || [];

    const totalTime = Date.now() - startTime;
    console.log(`getAllUsers completed successfully in ${totalTime}ms`);
    console.log("Returning users:", {
      count: mappedUsers.length,
      firstUser: mappedUsers[0] || null
    });

    return mappedUsers;
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
};

// Export as getUsers as well for compatibility
export const getUsers = getAllUsers;

// Get user by ID from Supabase
export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations:organization_id (
          id,
          name,
          code
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }

    if (!profile) return undefined;

    // Get user roles separately
    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', id);

    const roles = userRolesData?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

    return {
      id: profile.id,
      username: profile.username,
      email: profile.username,
      firstName: profile.first_name,
      lastName: profile.last_name,
      name: `${profile.first_name} ${profile.last_name}`,
      phone: parsePhoneNumber(profile.phone),
      designation: profile.designation,
      roles: roles,
      status: profile.status,
      organizationId: profile.organization_id,
      organizationName: profile.organizations?.name || "N/A",
      effectiveFrom: new Date(profile.effective_from),
      effectiveTo: profile.effective_to ? new Date(profile.effective_to) : undefined,
      createdBy: profile.created_by || "System", // This is now a username/string
      createdOn: new Date(profile.created_on),
      updatedBy: profile.updated_by || undefined, // This is now a username/string
      updatedOn: profile.updated_on ? new Date(profile.updated_on) : undefined,
    };
  } catch (error) {
    console.error("Error in getUserById:", error);
    return undefined;
  }
};

// Create a new user in Supabase
export const createUser = async (userData: Partial<User>): Promise<User> => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const createdByValue = currentUser ? `${userData.firstName} ${userData.lastName}` : "System";

    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email || userData.username || "",
      password: "TempPassword123!",
      email_confirm: true,
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw authError;
    }

    // Update the profile with additional information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: userData.firstName || "",
        last_name: userData.lastName || "",
        phone: phoneToJson(userData.phone),
        designation: userData.designation,
        organization_id: userData.organizationId,
        status: userData.status || "active",
        effective_from: userData.effectiveFrom?.toISOString() || new Date().toISOString(),
        effective_to: userData.effectiveTo?.toISOString(),
        created_by: createdByValue // Store username instead of UUID
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw profileError;
    }

    return await getUserById(authData.user.id) as User;
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
};

// Update an existing user in Supabase
export const updateUser = async (id: string, userData: Partial<User>): Promise<User | undefined> => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const updatedByValue = currentUser ? `${userData.firstName} ${userData.lastName}` : "System";

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: phoneToJson(userData.phone),
        designation: userData.designation,
        organization_id: userData.organizationId,
        status: userData.status,
        effective_from: userData.effectiveFrom?.toISOString(),
        effective_to: userData.effectiveTo?.toISOString(),
        updated_on: new Date().toISOString(),
        updated_by: updatedByValue // Store username instead of UUID
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    return await getUserById(id);
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
};

// Delete a user from Supabase
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(id);
    
    if (error) {
      console.error("Error deleting user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return false;
  }
};

// Get user permissions from Supabase
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  console.log("=== getUserPermissions called ===");
  console.log("User ID:", userId);
  
  try {
    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error("Invalid UUID format for userId:", userId);
      return [];
    }

    console.log("Fetching user permissions from Supabase...");
    const startTime = Date.now();
    
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

    const queryTime = Date.now() - startTime;
    console.log(`User permissions query completed in ${queryTime}ms`);

    if (error) {
      console.error("Error fetching user permissions:", error);
      return [];
    }

    console.log("Raw permissions data:", data);

    const permissions = new Set<string>();
    data?.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rolePermission: any) => {
        permissions.add(rolePermission.permissions.name);
      });
    });

    const permissionsArray = Array.from(permissions);
    console.log("Processed permissions:", permissionsArray);
    
    return permissionsArray;
  } catch (error) {
    console.error("Error in getUserPermissions:", error);
    return [];
  }
};

// Mock authentication function (updated to work with Supabase)
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return null;
    }

    return await getUserById(data.user.id) || null;
  } catch (error) {
    console.error("Error in authenticateUser:", error);
    return null;
  }
};

// Get all roles (placeholder for Supabase implementation)
export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permissions (
            id,
            name,
            module,
            component,
            description
          )
        )
      `);

    if (error) {
      console.error("Error fetching roles:", error);
      return [];
    }

    return roles?.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: role.role_permissions?.map((rp: any) => rp.permissions) || []
    })) || [];
  } catch (error) {
    console.error("Error in getAllRoles:", error);
    return [];
  }
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  try {
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*');

    if (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }

    return permissions || [];
  } catch (error) {
    console.error("Error in getAllPermissions:", error);
    return [];
  }
};
