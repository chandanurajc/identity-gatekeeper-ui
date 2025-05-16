
export type UserRole = "admin" | "user" | "guest";

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
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
}
