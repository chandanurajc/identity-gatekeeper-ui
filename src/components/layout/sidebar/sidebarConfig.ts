
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
  Folder,
  Radio,
  Box,
  ShoppingCart,
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
  purchaseOrder: ShoppingCart,
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
      {
        title: "Item Categories",
        href: "/master-data/item-category",
        permission: "view-category",
        icon: "shield" as const,
      },
      {
        title: "Item Groups",
        href: "/master-data/item-groups",
        permission: "view-item-group",
        icon: "shield" as const,
      },
      {
        title: "Sales Channels",
        href: "/master-data/sales-channels",
        permission: "view-sales-channel",
        icon: "shield" as const,
      },
      {
        title: "Item Master",
        href: "/master-data/items",
        permission: "view-item",
        icon: "shield" as const,
      },
    ],
  },
  {
    title: "Order Management",
    items: [
      {
        title: "Purchase Orders",
        href: "/order-management/purchase-orders",
        permission: "View PO",
        icon: "purchaseOrder" as const,
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

  // Master Data module
  const masterDataItems: MenuItem[] = [];
  
  if (permissions.canViewCategory) {
    masterDataItems.push({
      label: "Item Categories",
      path: "/master-data/item-category",
      icon: Folder,
      permission: true,
    });
  }
  
  if (permissions.canViewItemGroup) {
    masterDataItems.push({
      label: "Item Groups",
      path: "/master-data/item-groups",
      icon: Folder,
      permission: true,
    });
  }
  
  if (permissions.canManagePartner) {
    masterDataItems.push({
      label: "Partner Management",
      path: "/master-data/partners",
      icon: Handshake,
      permission: true,
    });
  }

  if (permissions.canViewSalesChannel) {
    masterDataItems.push({
      label: "Sales Channels",
      path: "/master-data/sales-channels",
      icon: Radio,
      permission: true,
    });
  }

  if (permissions.canViewItem) {
    masterDataItems.push({
      label: "Item Master",
      path: "/master-data/items",
      icon: Box,
      permission: true,
    });
  }

  if (masterDataItems.length > 0) {
    moduleGroups.push({
      name: "Master Data",
      items: masterDataItems,
    });
  }

  // Order Management module
  const orderManagementItems: MenuItem[] = [];
  
  if (permissions.canViewPurchaseOrders) {
    orderManagementItems.push({
      label: "Purchase Orders",
      path: "/order-management/purchase-orders",
      icon: ShoppingCart,
      permission: true,
    });
  }

  if (orderManagementItems.length > 0) {
    moduleGroups.push({
      name: "Order Management",
      items: orderManagementItems,
    });
  }

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

  return moduleGroups;
};
