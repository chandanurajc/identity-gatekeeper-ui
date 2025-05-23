
import { Permission, Role } from "@/types/role";
import { v4 as uuidv4 } from "uuid";
import { organizationService } from "./organizationService";

// Mock data for permissions
const mockPermissions: Permission[] = [
  { id: "1", name: "create_users", module: "Administration", component: "Users", description: "Create new user accounts in the system" },
  { id: "2", name: "edit_users", module: "Administration", component: "Users", description: "Edit existing user account details" },
  { id: "3", name: "view_users", module: "Administration", component: "Users", description: "View user accounts and their details" },
  { id: "4", name: "create_role", module: "Administration", component: "Roles", description: "Create new roles with custom permissions" },
  { id: "5", name: "edit_roles", module: "Administration", component: "Roles", description: "Edit existing role details and permissions" },
  { id: "6", name: "view_roles", module: "Administration", component: "Roles", description: "View roles and their assigned permissions" },
  { id: "7", name: "access_settings", module: "Administration", component: "Settings", description: "Access application settings configuration" },
  { id: "8", name: "access_admin", module: "Administration", component: "General", description: "General administration module access" },
  { id: "9", name: "view_permissions", module: "Administration", component: "Permissions", description: "View all system permissions" },
  { id: "10", name: "create_item_category", module: "Master data", component: "Item category", description: "Create new item categories" },
  { id: "11", name: "edit_item_category", module: "Master data", component: "Item category", description: "Edit existing item categories" },
  { id: "12", name: "view_item_category", module: "Master data", component: "Item category", description: "View item categories and their details" },
  { id: "13", name: "access_master_data", module: "Master data", component: "General", description: "General master data module access" },
  { id: "14", name: "view_organization", module: "Administration", component: "Organizations", description: "View organizations and their details" },
  { id: "15", name: "create_organization", module: "Administration", component: "Organizations", description: "Create new organizations" },
  { id: "16", name: "edit_organization", module: "Administration", component: "Organizations", description: "Edit existing organizations" },
];

// Mock data for roles
const mockRoles: Role[] = [
  {
    id: "1",
    name: "Admin",
    permissions: mockPermissions,
    createdBy: "System",
    createdOn: new Date("2024-05-01"),
  },
  {
    id: "2",
    name: "User",
    permissions: mockPermissions.filter(p => p.name === "view_users"),
    createdBy: "System",
    createdOn: new Date("2024-05-01"),
    organizationId: "1",
    organizationName: "ABC Corporation",
  }
];

// Mock data for roles
let roles = [...mockRoles];

export const roleService = {
  getAllRoles: async (): Promise<Role[]> => {
    try {
      const organizations = await organizationService.getAllOrganizations();
      
      // Update roles with organization names
      const rolesWithOrgNames = roles.map(role => {
        if (role.organizationId) {
          const org = organizations.find(o => o.id === role.organizationId);
          if (org) {
            return {
              ...role,
              organizationName: org.name
            };
          }
        }
        return role;
      });
      
      return rolesWithOrgNames;
    } catch (error) {
      console.error("Error loading roles with organizations:", error);
      return [...roles];
    }
  },

  getRoleById: async (id: string): Promise<Role | undefined> => {
    const role = roles.find(role => role.id === id);
    
    if (role && role.organizationId) {
      try {
        const org = await organizationService.getOrganizationById(role.organizationId);
        if (org) {
          return {
            ...role,
            organizationName: org.name
          };
        }
      } catch (error) {
        console.error("Error fetching organization for role:", error);
      }
    }
    
    return role;
  },

  createRole: async (role: Omit<Role, "id" | "createdBy" | "createdOn">): Promise<Role> => {
    let organizationName = "";
    
    if (role.organizationId) {
      try {
        const org = await organizationService.getOrganizationById(role.organizationId);
        if (org) {
          organizationName = org.name;
        }
      } catch (error) {
        console.error("Error fetching organization for new role:", error);
      }
    }
    
    const newRole: Role = {
      ...role,
      id: uuidv4(),
      createdBy: "Current User", // In a real app, this would come from the authenticated user
      createdOn: new Date(),
      organizationName
    };
    roles.push(newRole);
    return newRole;
  },

  updateRole: async (id: string, roleData: Partial<Role>): Promise<Role | undefined> => {
    let updatedRole: Role | undefined;
    let organizationName = undefined;
    
    if (roleData.organizationId) {
      try {
        const org = await organizationService.getOrganizationById(roleData.organizationId);
        if (org) {
          organizationName = org.name;
        }
      } catch (error) {
        console.error("Error fetching organization for updated role:", error);
      }
    }
    
    roles = roles.map(role => {
      if (role.id === id) {
        updatedRole = {
          ...role,
          ...roleData,
          organizationName: organizationName || role.organizationName,
          updatedBy: "Current User", // In a real app, this would come from the authenticated user
          updatedOn: new Date(),
        };
        return updatedRole;
      }
      return role;
    });
    return updatedRole;
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
