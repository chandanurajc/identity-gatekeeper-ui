
import {
  Home,
  LayoutDashboard,
  ListChecks,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  User,
  Users,
  Building2,
  Building,
  GitBranch,
  Handshake,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: keyof typeof Icons;
  label?: string;
  permission?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavigationGroup {
  title: string;
  items: NavItem[];
}

export interface MenuItem {
  label: string;
  path: string;
  icon: any;
  permission?: boolean;
}

export interface ModuleGroup {
  name: string;
  items: MenuItem[];
}

export const Icons = {
  home: Home,
  dashboard: LayoutDashboard,
  product: Package,
  orders: ShoppingBag,
  customers: Users,
  user: User,
  settings: Settings,
  roles: Shield,
  permissions: ListChecks,
  shield: Shield,
  building: Building2,
};

export const sidebarConfig: NavigationGroup[] = [
  {
    title: "Master Data",
    items: [
      {
        title: "Organizations",
        href: "/admin/organizations",
        permission: "view-organization",
        icon: "shield" as const,
      },
      {
        title: "Divisions",
        href: "/admin/divisions",
        permission: "view-division",
        icon: "shield" as const,
      },
      {
        title: "Partner Management",
        href: "/master-data/partners",
        permission: "manage_partner",
        icon: "shield" as const,
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: "user",
        permission: "view-user",
      },
      {
        title: "Roles",
        href: "/admin/roles",
        icon: "roles",
        permission: "view-role",
      },
      {
        title: "Permissions",
        href: "/admin/permissions",
        icon: "permissions",
        permission: "view-permission",
      },
    ],
  },
];

export const createModuleGroups = (permissions: any): ModuleGroup[] => {
  const moduleGroups: ModuleGroup[] = [];

  // Admin module
  const adminItems: MenuItem[] = [];
  
  if (permissions.canViewOrganization) {
    adminItems.push({
      label: "Organizations",
      path: "/admin/organizations",
      icon: Building,
      permission: true,
    });
  }
  
  if (permissions.canViewDivision) {
    adminItems.push({
      label: "Divisions",
      path: "/admin/divisions",
      icon: GitBranch,
      permission: true,
    });
  }
  
  if (permissions.canViewUsers) {
    adminItems.push({
      label: "Users",
      path: "/admin/users",
      icon: User,
      permission: true,
    });
  }
  
  if (permissions.canViewRoles) {
    adminItems.push({
      label: "Roles",
      path: "/admin/roles",
      icon: Shield,
      permission: true,
    });
  }
  
  if (permissions.canViewPermissions) {
    adminItems.push({
      label: "Permissions",
      path: "/admin/permissions",
      icon: ListChecks,
      permission: true,
    });
  }

  if (adminItems.length > 0) {
    moduleGroups.push({
      name: "Admin",
      items: adminItems,
    });
  }

  // Master Data module
  const masterDataItems: MenuItem[] = [];
  
  if (permissions.canManagePartner) {
    masterDataItems.push({
      label: "Partner Management",
      path: "/master-data/partners",
      icon: Handshake,
      permission: true,
    });
  }

  if (masterDataItems.length > 0) {
    moduleGroups.push({
      name: "Master Data",
      items: masterDataItems,
    });
  }

  return moduleGroups;
};
