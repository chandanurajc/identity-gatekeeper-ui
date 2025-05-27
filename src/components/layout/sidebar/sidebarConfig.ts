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
};

export const sidebarConfig: NavigationGroup[] = [
  {
    title: "Master Data",
    items: [
      {
        title: "Organizations",
        path: "/admin/organizations",
        permission: "view-organization",
        icon: "Shield" as const,
      },
      {
        title: "Divisions",
        path: "/admin/divisions",
        permission: "view-division",
        icon: "Shield" as const,
      },
      {
        title: "Suppliers",
        path: "/master-data/suppliers",
        permission: "view-supplier",
        icon: "Shield" as const,
      },
      {
        title: "Partner Management",
        path: "/master-data/partners",
        permission: "manage_partner",
        icon: "Shield" as const,
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        title: "Users",
        path: "/admin/users",
        icon: "user",
        permission: "view-user",
      },
      {
        title: "Roles",
        path: "/admin/roles",
        icon: "roles",
        permission: "view-role",
      },
      {
        title: "Permissions",
        path: "/admin/permissions",
        icon: "permissions",
        permission: "view-permission",
      },
    ],
  },
];
