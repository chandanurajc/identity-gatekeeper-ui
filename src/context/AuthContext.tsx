
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";

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

  useEffect(() => {
    // Check for existing user session on app initialization
    const initAuth = () => {
      try {
        console.log("Initializing auth...");
        const currentUser = authService.getCurrentUser();
        const orgCode = authService.getCurrentOrganizationCode();
        
        if (currentUser) {
          console.log("Found existing session for:", currentUser.email);
          setState({
            user: currentUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            organizationCode: orgCode
          });
        } else {
          console.log("No existing session found");
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
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    console.log("Attempting login for:", email);
    
    try {
      const user = await authService.login({ email, password });
      
      console.log("Login successful for:", user.email);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        organizationCode: user.organizationCode || null
      });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.email}!`,
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
      // Mock signup - in a real app this would create a new user
      console.log("Mock signup for:", email);
      
      toast({
        title: "Signup successful",
        description: "Account created successfully. You can now log in.",
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
      await authService.logout();

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
