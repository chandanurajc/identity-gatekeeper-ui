import { User, Role, Permission } from "@/types/user";
import { v4 as uuidv4 } from "uuid";

// Mock data for permissions
const mockPermissions: Permission[] = [
  { id: "1", name: "view-user", description: "Can view users" },
  { id: "2", name: "create-user", description: "Can create users" },
  { id: "3", name: "edit-user", description: "Can edit users" },
  { id: "4", name: "view-role", description: "Can view roles" },
  { id: "5", name: "create-role", description: "Can create roles" },
  { id: "6", name: "edit-role", description: "Can edit roles" },
  { id: "7", name: "view-category", description: "Can view categories" },
  { id: "8", name: "create-category", description: "Can create categories" },
  { id: "9", name: "edit-category", description: "Can edit categories" },
  { id: "10", name: "view-organization", description: "Can view organizations" },
  { id: "11", name: "create-organization", description: "Can create organizations" },
  { id: "12", name: "edit-organization", description: "Can edit organizations" },
];

// Mock data for roles
const mockRoles: Role[] = [
  {
    id: "1",
    name: "admin",
    description: "Administrator with all permissions",
    permissions: mockPermissions,
  },
  {
    id: "2",
    name: "user",
    description: "Regular user with limited permissions",
    permissions: [mockPermissions[0], mockPermissions[3], mockPermissions[6], mockPermissions[9]],
  },
];

// Mock data for users
const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    roles: [mockRoles[0]],
    status: "active",
  },
  {
    id: "2",
    name: "Regular User",
    email: "user@example.com",
    roles: [mockRoles[1]],
    status: "active",
  },
];

const ALL_AVAILABLE_PERMISSIONS = [
  // User management permissions
  "view-user",
  "create-user", 
  "edit-user",
  
  // Role management permissions
  "view-role",
  "create-role",
  "edit-role",
  
  // Category management permissions
  "view-category",
  "create-category",
  "edit-category",
  
  // Organization management permissions
  "view-organization",
  "create-organization",
  "edit-organization",
];

// Mock authentication function
export const authenticateUser = (email: string, password: string): User | null => {
  // In a real app, you would verify the password here
  const user = mockUsers.find(u => u.email === email);
  return user || null;
};

export const getUserPermissions = (userId: string): string[] => {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return [];
  
  // If user has admin role, return all permissions
  if (user.roles.some(role => role.name === 'admin')) {
    return ALL_AVAILABLE_PERMISSIONS;
  }
  
  // Otherwise, gather permissions from all user roles
  const permissions = new Set<string>();
  
  user.roles.forEach(role => {
    role.permissions?.forEach(permission => {
      permissions.add(permission.name);
    });
  });
  
  return Array.from(permissions);
};

// Get all users
export const getAllUsers = (): User[] => {
  return [...mockUsers];
};

// Get user by ID
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

// Create a new user
export const createUser = (userData: Partial<User>): User => {
  const newUser: User = {
    id: uuidv4(),
    name: userData.name || "",
    email: userData.email || "",
    roles: userData.roles || [],
    status: userData.status || "inactive",
  };
  
  mockUsers.push(newUser);
  return newUser;
};

// Update an existing user
export const updateUser = (id: string, userData: Partial<User>): User | undefined => {
  const userIndex = mockUsers.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return undefined;
  }
  
  const updatedUser = {
    ...mockUsers[userIndex],
    ...userData,
  };
  
  mockUsers[userIndex] = updatedUser;
  return updatedUser;
};

// Delete a user
export const deleteUser = (id: string): boolean => {
  const initialLength = mockUsers.length;
  const filteredUsers = mockUsers.filter(user => user.id !== id);
  
  if (filteredUsers.length === initialLength) {
    return false;
  }
  
  // In a real app, you would make an API call here
  // For this mock, we'll just update our array
  mockUsers.length = 0;
  mockUsers.push(...filteredUsers);
  
  return true;
};

// Get all roles
export const getAllRoles = (): Role[] => {
  return [...mockRoles];
};

// Get all permissions
export const getAllPermissions = (): Permission[] => {
  return [...mockPermissions];
};
