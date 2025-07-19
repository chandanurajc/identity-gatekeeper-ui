
import {
  User,
  Shield,
  ListChecks,
  Building,
  GitBranch,
  Handshake,
  Folder,
  Radio,
  Box,
  ShoppingCart,
  Truck,
  Warehouse,
  List,
  BookCopy,
  FileText,
  DollarSign,
} from "lucide-react";
import { MenuItem, ModuleGroup } from "./types";

type PermissionsMap = {
    [key: string]: boolean | undefined;
}

export const createModuleGroups = (permissions: PermissionsMap): ModuleGroup[] => {
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

  if (permissions.canViewPOReceive) {
    orderManagementItems.push({
      label: "PO Receive",
      path: "/order-management/po-receive",
      icon: Truck,
      permission: true,
    });
  }

  if (orderManagementItems.length > 0) {
    moduleGroups.push({
      name: "Order Management",
      items: orderManagementItems,
    });
  }

  // Inventory module
  const inventoryItems: MenuItem[] = [];
  if (permissions.canViewInventory) {
    inventoryItems.push({
      label: "Inventory Visibility",
      path: "/inventory/visibility",
      icon: Warehouse,
      permission: true,
    });
    inventoryItems.push({
      label: "Inventory Ledger",
      path: "/inventory/stock-ledger",
      icon: List,
      permission: true,
    });
  }

  if (inventoryItems.length > 0) {
    moduleGroups.push({
      name: "Inventory",
      items: inventoryItems,
    });
  }

  // Finance module
  const financeItems: MenuItem[] = [];
  if (permissions.canViewGeneralLedger) {
    financeItems.push({
      label: "General Ledger",
      path: "/finance/general-ledger",
      icon: BookCopy,
      permission: true,
    });
  }

  if (permissions.canViewInvoices) {
    financeItems.push({
      label: "Invoices",
      path: "/finance/invoices",
      icon: FileText,
      permission: true,
    });
  }

  if (permissions.canViewCOA) {
    financeItems.push({
      label: "Chart of Accounts",
      path: "/finance/chart-of-accounts",
      icon: BookCopy,
      permission: true,
    });
  }

  if (permissions.canViewRules) {
    financeItems.push({
      label: "Accounting Rules",
      path: "/finance/accounting-rules",
      icon: ListChecks,
      permission: true,
    });
  }

  if (permissions.canViewJournal) {
    financeItems.push({
      label: "Journals",
      path: "/finance/journals",
      icon: FileText,
      permission: true,
    });
  }

  if (permissions.canViewSubledger) {
    financeItems.push({
      label: "Subledger",
      path: "/finance/subledger",
      icon: BookCopy,
      permission: true,
    });
  }

  if (permissions.canViewPayments) {
    financeItems.push({
      label: "Payments",
      path: "/finance/payments",
      icon: DollarSign,
      permission: true,
    });
  }

  if (financeItems.length > 0) {
    moduleGroups.push({
      name: "Finance",
      items: financeItems,
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
