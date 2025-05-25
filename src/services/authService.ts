
import { LoginCredentials, User } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

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

      // Fetch user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations:organization_id (
            id,
            name,
            code
          )
        `)
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
        
        localStorage.setItem("user", JSON.stringify(user));
        return user;
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
        organizationCode: profile.organizations?.code || null,
        organizationName: profile.organizations?.name || null
      };

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("organizationCode", user.organizationCode || "");
      
      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("user");
      localStorage.removeItem("organizationCode");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local storage even if Supabase logout fails
      localStorage.removeItem("user");
      localStorage.removeItem("organizationCode");
      throw error;
    }
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
  },

  getCurrentOrganizationCode: (): string | null => {
    return localStorage.getItem("organizationCode");
  },
  
  hasRole: (user: User | null, role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role as any);
  }
};
