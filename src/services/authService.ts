
import { LoginCredentials, User } from "@/types/auth";
import { organizationService } from "./organizationService";

// Mock user database - in a real app, this would be handled by a backend
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@example.com",
    password: "admin123",
    name: "Admin User",
    roles: ["admin"],
    organizationId: "1",
    organizationCode: "ABCC"
  },
  {
    id: "2",
    email: "user@example.com", 
    password: "user123",
    name: "Regular User",
    roles: ["user"],
    organizationId: "2",
    organizationCode: "XYZI"
  },
  {
    id: "3",
    email: "chandanurajc@gmail.com",
    password: "PassPass@123",
    name: "Chandan User",
    roles: ["user"],
    organizationId: "1",
    organizationCode: "ABCC"
  }
];

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user by email and organization code
    const user = MOCK_USERS.find(u => 
      u.email === credentials.email && 
      u.organizationCode === credentials.organizationCode
    );
    
    if (!user || user.password !== credentials.password) {
      throw new Error("Invalid email, password, or organization code");
    }

    // Verify organization exists and is active
    const organization = await organizationService.getOrganizationByCode(credentials.organizationCode);
    if (!organization || organization.status !== 'active') {
      throw new Error("Organization not found or inactive");
    }

    const { password, ...userWithoutPassword } = user;
    const userWithOrgDetails = {
      ...userWithoutPassword,
      organizationName: organization.name
    };
    
    // Store user and organization context
    localStorage.setItem("user", JSON.stringify(userWithOrgDetails));
    localStorage.setItem("organizationCode", credentials.organizationCode);
    
    return userWithOrgDetails as User;
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem("user");
    localStorage.removeItem("organizationCode");
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
