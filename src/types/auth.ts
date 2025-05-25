
export type UserRole = "admin" | "user" | "guest" | string;

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
  organizationId?: string;
  organizationCode?: string;
  organizationName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  organizationCode: string | null;
}
