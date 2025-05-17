
import { User, UserFormData, UserRole } from "@/types/user";
import { v4 as uuidv4 } from "uuid";

// Mock users data
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "admin@example.com",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    phone: {
      countryCode: "+1",
      number: "1234567890",
    },
    designation: "System Administrator",
    roles: ["admin"],
    effectiveFrom: new Date("2023-01-01"),
    createdBy: "system",
    createdOn: new Date("2023-01-01"),
    updatedBy: "system",
    updatedOn: new Date("2023-01-01"),
  },
  {
    id: "2",
    username: "user@example.com",
    email: "user@example.com",
    firstName: "Regular",
    lastName: "User",
    phone: {
      countryCode: "+1",
      number: "9876543210",
    },
    designation: "Staff Member",
    roles: ["user"],
    effectiveFrom: new Date("2023-02-15"),
    createdBy: "admin@example.com",
    createdOn: new Date("2023-02-15"),
  },
  {
    id: "3",
    username: "chandanurajc@gmail.com",
    email: "chandanurajc@gmail.com",
    firstName: "Chandan",
    lastName: "User",
    phone: {
      countryCode: "+91",
      number: "9876543210",
    },
    designation: "Admin User",
    roles: ["admin", "user"],
    effectiveFrom: new Date("2023-05-15"),
    createdBy: "system",
    createdOn: new Date("2023-05-15"),
  },
];

// Simulate fetching users from an API
export const getUsers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_USERS];
};

// Simulate getting a single user
export const getUserById = async (id: string): Promise<User | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_USERS.find(user => user.id === id);
};

// Get current user info from localStorage (simulating authenticated user)
const getCurrentUserInfo = () => {
  try {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      return { email: user.email };
    }
    return { email: "system" }; // Default fallback
  } catch (error) {
    console.error("Error getting current user:", error);
    return { email: "system" };
  }
};

// Simulate creating a new user
export const createUser = async (userData: UserFormData): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Check if username already exists
  if (MOCK_USERS.some(user => user.username === userData.username)) {
    throw new Error("Username already exists. Please choose a different username.");
  }

  const currentUser = getCurrentUserInfo();
  
  // Ensure roles is an array and filter out any empty values
  const validRoles = Array.isArray(userData.roles) 
    ? userData.roles.filter(role => role && role.trim() !== '')
    : [];
  
  const newUser: User = {
    id: uuidv4(),
    username: userData.username,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    designation: userData.designation,
    roles: validRoles,
    effectiveFrom: userData.effectiveFrom,
    effectiveTo: userData.effectiveTo,
    createdBy: currentUser?.email || "system",
    createdOn: new Date(),
  };

  console.log("Creating new user:", newUser);
  
  // In a real application, we would hash the password before storing it
  // For this mock, we'll simulate password storage securely by not including it in the return value
  
  MOCK_USERS.push(newUser);
  return { ...newUser, password: undefined };
};

// Simulate updating a user
export const updateUser = async (id: string, userData: UserFormData): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const userIndex = MOCK_USERS.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    throw new Error("User not found");
  }

  const currentUser = getCurrentUserInfo();
  
  // Ensure roles is an array and filter out any empty values
  const validRoles = Array.isArray(userData.roles) 
    ? userData.roles.filter(role => role && role.trim() !== '')
    : [];
  
  const updatedUser: User = {
    ...MOCK_USERS[userIndex],
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone,
    designation: userData.designation,
    roles: validRoles,
    effectiveFrom: userData.effectiveFrom,
    effectiveTo: userData.effectiveTo,
    updatedBy: currentUser?.email || "system",
    updatedOn: new Date(),
  };

  MOCK_USERS[userIndex] = updatedUser;
  return { ...updatedUser, password: undefined };
};

// Permissions
export const getUserPermissions = (roles: UserRole[]): string[] => {
  // In a real application, these would be retrieved from a backend
  const allPermissions = [
    { role: "admin", permissions: ["view_users", "create_users", "edit_users", "create_role", "edit_roles", "view_roles", "access_settings", "access_admin"] },
    { role: "user", permissions: ["view_users", "view_roles"] },
    { role: "guest", permissions: [] },
  ];
  
  // Collect all permissions based on user roles
  const userPermissions = new Set<string>();
  
  roles.forEach(role => {
    const rolePermissions = allPermissions.find(p => p.role === role);
    if (rolePermissions) {
      rolePermissions.permissions.forEach(permission => userPermissions.add(permission));
    }
  });
  
  return Array.from(userPermissions);
};
