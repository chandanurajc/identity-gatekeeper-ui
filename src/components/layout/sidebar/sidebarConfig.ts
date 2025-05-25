
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  Shield, 
  Lock, 
  Folder,
  Building,
  GitBranch
} from "lucide-react";

export interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  permission: boolean;
}

export interface ModuleGroup {
  name: string;
  items: MenuItem[];
}

export const createModuleGroups = (permissions: {
  canViewUsers: boolean;
  canViewRoles: boolean;
  canViewPermissions: boolean;
  canViewCategory: boolean;
  canViewOrganization: boolean;
  canViewDivision: boolean;
}): ModuleGroup[] => [
  {
    name: "Main",
    items: [
      {
        path: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: true
      }
    ]
  },
  {
    name: "Administration",
    items: [
      {
        path: "/admin/users",
        label: "User Management",
        icon: Users,
        permission: permissions.canViewUsers
      },
      {
        path: "/admin/roles",
        label: "Role Management",
        icon: Shield,
        permission: permissions.canViewRoles
      },
      {
        path: "/admin/permissions",
        label: "System Permissions",
        icon: Lock,
        permission: permissions.canViewPermissions
      },
      {
        path: "/admin/organizations",
        label: "Organizations",
        icon: Building,
        permission: permissions.canViewOrganization
      },
      {
        path: "/admin/divisions",
        label: "Divisions",
        icon: GitBranch,
        permission: permissions.canViewDivision
      }
    ]
  },
  {
    name: "Master Data",
    items: [
      {
        path: "/master-data/item-category",
        label: "Item Category",
        icon: Folder,
        permission: permissions.canViewCategory
      }
    ]
  },
  {
    name: "System",
    items: [
      {
        path: "/settings",
        label: "Settings",
        icon: Settings,
        permission: true
      }
    ]
  }
];
