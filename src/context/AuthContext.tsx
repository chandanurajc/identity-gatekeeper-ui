
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

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

  // Convert Supabase user to our AuthUser format
  const convertUser = async (supabaseUser: User): Promise<AuthUser> => {
    // Get user profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations:organization_id (
          id,
          name,
          code
        )
      `)
      .eq('id', supabaseUser.id)
      .single();

    // Get user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', supabaseUser.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile ? `${profile.first_name} ${profile.last_name}` : supabaseUser.email,
      roles,
      organizationId: profile?.organization_id,
      organizationCode: profile?.organizations?.code,
      organizationName: profile?.organizations?.name
    };
  };

  useEffect(() => {
    // Configure Supabase client
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const authUser = await convertUser(session.user);
          setState({
            user: authUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            organizationCode: authUser.organizationCode || null
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to initialize authentication' 
        }));
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
        if (session?.user) {
          // Defer user data fetching to prevent deadlocks
          setTimeout(async () => {
            try {
              const authUser = await convertUser(session.user);
              setState({
                user: authUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                organizationCode: authUser.organizationCode || null
              });
            } catch (error) {
              console.error('Error converting user:', error);
              setState(prev => ({ 
                ...prev, 
                isLoading: false, 
                error: 'Failed to load user data' 
              }));
            }
          }, 0);
        } else {
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

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const authUser = await convertUser(data.user);
        setState({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          organizationCode: authUser.organizationCode || null
        });
        toast({
          title: "Login successful",
          description: `Welcome back, ${authUser.name || authUser.email}!`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || 'User',
            last_name: lastName || 'Name'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Signup successful",
        description: "Please check your email to verify your account.",
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
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        organizationCode: null
      });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Logout failed";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: errorMessage,
      });
    }
  };

  const hasRole = (role: string): boolean => {
    if (!state.user) return false;
    return state.user.roles.includes(role);
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
