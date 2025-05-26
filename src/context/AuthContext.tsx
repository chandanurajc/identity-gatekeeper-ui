
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  organizationId?: string;
  organizationCode?: string;
  organizationName?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  organizationCode: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  getOrganizationCode: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    organizationCode: null
  });
  const { toast } = useToast();

  // Use useCallback to memoize fetchUserData and prevent unnecessary recreations
  const fetchUserData = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      // Fetch user profile from profiles table without join
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return null;
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
        .eq('user_id', userId);

      const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || ["user"];

      return {
        id: userId,
        email: profile.username,
        name: `${profile.first_name} ${profile.last_name}`,
        roles: roles,
        organizationId: profile.organization_id,
        organizationCode: organizationCode,
        organizationName: organizationName
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to prevent blocking the auth state change
          setTimeout(async () => {
            const userData = await fetchUserData(session.user.id);
            
            if (userData) {
              setState(prev => ({
                ...prev,
                user: userData,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                organizationCode: userData.organizationCode || null
              }));
            } else {
              // Fallback user object if profile fetch fails
              const fallbackUser: AuthUser = {
                id: session.user.id,
                email: session.user.email || "",
                name: session.user.user_metadata?.first_name || session.user.email,
                roles: ["user"],
                organizationCode: null,
                organizationName: null
              };
              
              setState(prev => ({
                ...prev,
                user: fallbackUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                organizationCode: null
              }));
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing state");
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            organizationCode: null
          });
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("Found existing session for:", session.user.email);
          // The onAuthStateChange will handle setting the user state
        } else {
          console.log("No existing session found");
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to check authentication status' 
        }));
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    console.log("Attempting login for:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      console.log("Login successful for:", email);
      
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      console.error("Login failed:", errorMessage);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log("Attempting signup for:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || "User",
            last_name: lastName || "Name"
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Signup successful",
        description: "Please check your email to confirm your account.",
      });

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Signup failed";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: errorMessage,
      });
      throw error;
    }
  };

  const logout = async () => {
    console.log("Starting logout process...");
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Clear local state immediately
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        organizationCode: null
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase signOut error:", error);
        // Even if there's an error, we'll continue with the logout process
      }

      console.log("Logout completed successfully");
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      // Force a page reload to ensure clean state
      window.location.href = "/";
      
    } catch (error) {
      console.error("Logout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Logout failed";
      
      // Even if logout fails, clear the local state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
        organizationCode: null
      });
      
      toast({
        variant: "destructive",
        title: "Logout error",
        description: errorMessage,
      });

      // Force redirect even on error
      window.location.href = "/";
    }
  };

  const hasRole = (role: string): boolean => {
    if (!state.user) return false;
    
    // Check for admin role variations
    const isAdmin = state.user.roles.some(userRole => 
      userRole.toLowerCase().includes('admin') || 
      userRole === 'Admin-Role' || 
      userRole === 'admin'
    );
    
    // Admin users have all roles
    if (isAdmin) return true;
    
    // Check for specific role (case-insensitive)
    return state.user.roles.some(userRole => 
      userRole.toLowerCase() === role.toLowerCase()
    );
  };

  const getOrganizationCode = (): string | null => {
    return state.organizationCode;
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    hasRole,
    getOrganizationCode
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
