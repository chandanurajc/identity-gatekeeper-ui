
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
  try {
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

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    // Get user roles separately to avoid relation issues
    const userIds = profiles?.map(p => p.id) || [];
    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles (
          name
        )
      `)
      .in('user_id', userIds);

    return profiles?.map(profile => {
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
        createdBy: "System", // We'll need to enhance this later
        createdOn: new Date(profile.created_on),
        updatedBy: profile.updated_by || undefined,
        updatedOn: profile.updated_on ? new Date(profile.updated_on) : undefined,
      };
    }) || [];
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
      createdBy: "System",
      createdOn: new Date(profile.created_on),
      updatedBy: profile.updated_by || undefined,
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
        effective_to: userData.effectiveTo?.toISOString()
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
        updated_on: new Date().toISOString()
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
      return [];
    }

    const permissions = new Set<string>();
    data?.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rolePermission: any) => {
        permissions.add(rolePermission.permissions.name);
      });
    });

    return Array.from(permissions);
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

// Get all permissions (placeholder for Supabase implementation)
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
