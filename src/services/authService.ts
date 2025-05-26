
import { LoginCredentials, User } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { forceLogout } from "@/utils/authCleanup";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      console.log("Attempting Supabase login for:", credentials.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error("Supabase login error:", error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("No user data returned from login");
      }

      // Fetch user profile from profiles table without join
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        // If profile doesn't exist, create a basic user object
        const user: User = {
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.first_name || data.user.email,
          roles: ["user"],
          organizationCode: null,
          organizationName: null
        };
        
        return user;
      }

      // Fetch organization name if user has organization_id
      let organizationCode = null;
      let organizationName = null;
      if (profile.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('code, name')
          .eq('id', profile.organization_id)
          .single();
        
        if (!orgError && orgData) {
          organizationCode = orgData.code;
          organizationName = orgData.name;
        }
      }

      // Get user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', data.user.id);

      const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || ["user"];

      const user: User = {
        id: data.user.id,
        email: data.user.email || "",
        name: `${profile.first_name} ${profile.last_name}`,
        roles: roles,
        organizationId: profile.organization_id,
        organizationCode: organizationCode,
        organizationName: organizationName
      };

      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    console.log("AuthService: Using force logout...");
    await forceLogout();
  },

  getCurrentUser: (): User | null => {
    // This will be handled by the AuthContext through Supabase session
    return null;
  },

  getCurrentOrganizationCode: (): string | null => {
    // This will be handled by the AuthContext
    return null;
  },
  
  hasRole: (user: User | null, role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role as any);
  }
};
