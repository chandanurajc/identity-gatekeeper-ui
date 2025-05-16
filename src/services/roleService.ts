
import { Permission, Role } from "@/types/role";
import { v4 as uuidv4 } from "uuid";

// Mock data for permissions
const mockPermissions: Permission[] = [
  { id: "1", name: "create_users", module: "Administration", component: "Users" },
  { id: "2", name: "edit_users", module: "Administration", component: "Users" },
  { id: "3", name: "view_users", module: "Administration", component: "Users" },
  { id: "4", name: "create_role", module: "Administration", component: "Roles" },
  { id: "5", name: "edit_roles", module: "Administration", component: "Roles" },
  { id: "6", name: "view_roles", module: "Administration", component: "Roles" },
  { id: "7", name: "access_settings", module: "Administration", component: "Settings" },
  { id: "8", name: "access_admin", module: "Administration", component: "General" },
];

// Mock data for roles
const mockRoles: Role[] = [
  {
    id: "1",
    name: "Administrator",
    permissions: mockPermissions,
    createdBy: "System",
    createdOn: new Date("2025-01-01"),
    updatedBy: "System",
    updatedOn: new Date("2025-01-01"),
  },
  {
    id: "2",
    name: "User Manager",
    permissions: mockPermissions.filter(p => p.component === "Users"),
    createdBy: "System",
    createdOn: new Date("2025-01-01"),
    updatedBy: "System",
    updatedOn: new Date("2025-01-01"),
  },
  {
    id: "3",
    name: "Basic User",
    permissions: [mockPermissions[2]], // Only view_users
    createdBy: "System",
    createdOn: new Date("2025-01-01"),
  },
];

// In-memory storage for roles
let roles = [...mockRoles];

export const roleService = {
  getAllRoles: (): Promise<Role[]> => {
    return Promise.resolve([...roles]);
  },

  getRoleById: (id: string): Promise<Role | undefined> => {
    const role = roles.find(role => role.id === id);
    return Promise.resolve(role);
  },

  createRole: (role: Omit<Role, "id" | "createdBy" | "createdOn">): Promise<Role> => {
    const newRole: Role = {
      ...role,
      id: uuidv4(),
      createdBy: "Current User", // In a real app, this would come from the authenticated user
      createdOn: new Date(),
    };
    roles.push(newRole);
    return Promise.resolve(newRole);
  },

  updateRole: (id: string, roleData: Partial<Role>): Promise<Role | undefined> => {
    let updatedRole: Role | undefined;
    roles = roles.map(role => {
      if (role.id === id) {
        updatedRole = {
          ...role,
          ...roleData,
          updatedBy: "Current User", // In a real app, this would come from the authenticated user
          updatedOn: new Date(),
        };
        return updatedRole;
      }
      return role;
    });
    return Promise.resolve(updatedRole);
  },

  deleteRole: (id: string): Promise<boolean> => {
    const initialLength = roles.length;
    roles = roles.filter(role => role.id !== id);
    return Promise.resolve(roles.length !== initialLength);
  },

  getAllPermissions: (): Promise<Permission[]> => {
    return Promise.resolve([...mockPermissions]);
  },

  getPermissionsByModule: (module: string): Promise<Permission[]> => {
    return Promise.resolve(mockPermissions.filter(p => p.module === module));
  },

  getPermissionsByComponent: (component: string): Promise<Permission[]> => {
    return Promise.resolve(mockPermissions.filter(p => p.component === component));
  },

  getPermissionsByModuleAndComponent: (module: string, component: string): Promise<Permission[]> => {
    return Promise.resolve(mockPermissions.filter(p => p.module === module && p.component === component));
  },

  getUniqueModules: (): Promise<string[]> => {
    const modules = [...new Set(mockPermissions.map(p => p.module))];
    return Promise.resolve(modules);
  },

  getUniqueComponents: (): Promise<string[]> => {
    const components = [...new Set(mockPermissions.map(p => p.component))];
    return Promise.resolve(components);
  },

  getComponentsByModule: (module: string): Promise<string[]> => {
    const components = [...new Set(mockPermissions
      .filter(p => p.module === module)
      .map(p => p.component))];
    return Promise.resolve(components);
  }
};
