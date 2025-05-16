
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/services/authService";
import { LoginCredentials, User, AuthState } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = () => {
      const user = authService.getCurrentUser();
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null
      });
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.login(credentials);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.email}!`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast({
        variant: "destructive",
        title: "Login failed",
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
        error: null
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
    return authService.hasRole(state.user, role);
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    hasRole
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
