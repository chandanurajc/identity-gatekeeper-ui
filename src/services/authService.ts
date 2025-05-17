import { LoginCredentials, User } from "@/types/auth";

// Mock user database - in a real app, this would be handled by a backend
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@example.com",
    password: "admin123", // In a real app, passwords would be hashed
    name: "Admin User",
    roles: ["admin"]
  },
  {
    id: "2",
    email: "user@example.com",
    password: "user123",
    name: "Regular User",
    roles: ["user"]
  },
  {
    id: "3",
    email: "chandanurajc@gmail.com",
    password: "PassPass@123",
    name: "Chandan User",
    roles: [] // Removed "admin" and "user" roles
  }
];

// This simulates API calls in a real application
export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (!user || user.password !== credentials.password) {
      throw new Error("Invalid email or password");
    }

    // Don't send password back
    const { password, ...userWithoutPassword } = user;
    
    // Store the user in localStorage
    localStorage.setItem("user", JSON.stringify(userWithoutPassword));
    
    return userWithoutPassword as User;
  },

  logout: async (): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear user from localStorage
    localStorage.removeItem("user");
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
  },
  
  hasRole: (user: User | null, role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role as any);
  }
};
