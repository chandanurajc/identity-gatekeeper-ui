
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useMemo } from "react";

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("=== usePermissions Hook Debug ===");
  console.log("Hook state:", {
    userId: user?.id,
    userEmail: user?.email,
    userRoles: user?.roles,
    isAuthenticated,
    permissions,
    loading
  });

  // Use stable userId to prevent infinite loops
  const userId = user?.id;

  useEffect(() => {
    const fetchPermissions = async () => {
      console.log("=== fetchPermissions called in usePermissions ===");
      setLoading(true);
      
      if (userId && isAuthenticated) {
        try {
          console.log("Fetching permissions for user:", userId);
          console.log("User email:", user?.email);
          console.log("User roles:", user?.roles);
          
          // Check if user has admin role - admins should have all permissions
          if (user?.roles.includes("Admin-Role") || user?.roles.includes("admin")) {
            console.log("User has admin role, granting all permissions");
            // Grant all possible permissions for admin users
            const allPermissions = [
              "view-user", "create-user", "edit-user",
              "view_roles", "create_role", "edit_roles", "view_permissions",
              "view-organization", "create-organization", "edit-organization",
              "view-division", "create-division", "edit-division",
              "view-category", "create-category", "edit-category",
              "View PO", "Create PO", "Edit PO", "Cancel PO",
              "View Invoices", "Create Invoice", "Edit Invoice", "Delete Invoice", 
              "Send Invoice for Approval", "Approve Invoice", "Reject Invoice",
              "Record Payment",
              "View Inventory transfer", "Create Inventory transfer", "Edit Inventory transfer", "Confirm Inventory transfer",
              "access_admin", "access_settings"
            ];
            setPermissions(allPermissions);
            console.log("Admin permissions set:", allPermissions);
          } else {
            console.log("User is not admin, fetching permissions from database for user roles");
            console.log("User roles to check:", user?.roles);
            
            // For non-admin users, fetch actual permissions assigned to their roles
            const { data: rolePermissions, error } = await supabase
              .from('roles')
              .select(`
                name,
                role_permissions (
                  permissions (*)
                )
              `)
              .in('name', user?.roles);

            if (error) {
              console.error("Error fetching role permissions:", error);
              setPermissions([]);
            } else {
              console.log("Raw role permissions data:", rolePermissions);
              
              // Extract all permissions from all user roles
              const userPermissions: string[] = [];
              
              rolePermissions?.forEach(role => {
                console.log(`Processing permissions for role: ${role.name}`);
                role.role_permissions?.forEach((rp: any) => {
                  if (rp.permissions) {
                    console.log("Adding permission:", rp.permissions);
                    userPermissions.push(rp.permissions.name);
                  }
                });
              });
              
              // Remove duplicates
              const uniquePermissions = [...new Set(userPermissions)];
              
              console.log("Final permissions for user:", uniquePermissions);
              setPermissions(uniquePermissions);
            }
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        }
      } else {
        console.log("No authenticated user, setting empty permissions");
        console.log("User ID exists:", !!userId);
        console.log("Is authenticated:", isAuthenticated);
        setPermissions([]);
      }
      
      console.log("Setting permissions loading to false");
      setLoading(false);
    };

    console.log("=== usePermissions useEffect triggered ===");
    fetchPermissions();
  }, [userId, isAuthenticated, user?.roles, user?.email]);

  // Stabilize hasPermission function with useCallback
  const hasPermission = useCallback((permissionName: string): boolean => {
    console.log(`=== Checking permission: ${permissionName} ===`);
    console.log("Current state:", { 
      user: !!user, 
      userEmail: user?.email,
      userRoles: user?.roles,
      isAuthenticated, 
      permissions 
    });
    
    if (!user || !isAuthenticated) {
      console.log("Permission denied: no user or not authenticated");
      return false;
    }
    
    // Admin users have all permissions
    if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) {
      console.log("Permission granted: user is admin");
      return true;
    }
    
    const hasPermission = permissions.includes(permissionName);
    console.log(`Permission ${permissionName}: ${hasPermission}`);
    console.log("Available permissions:", permissions);
    return hasPermission;
  }, [user, isAuthenticated, permissions]);

  // Use useMemo to properly memoize permission values and prevent re-computation
  const memoizedPermissions = useMemo(() => {
    console.log("=== Computing memoized permissions ===");
    
    if (!user || !isAuthenticated) {
      return {
        // User permissions
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        // Role permissions
        canViewRoles: false,
        canCreateRole: false,
        canEditRoles: false,
        canViewPermissions: false,
        // Organization permissions
        canViewOrganization: false,
        canCreateOrganization: false,
        canEditOrganization: false,
        // Division permissions
        canViewDivision: false,
        canCreateDivision: false,
        canEditDivision: false,
        // Category permissions
        canViewCategory: false,
        canCreateCategory: false,
        canEditCategory: false,
        // Item Group permissions
        canViewItemGroup: false,
        canCreateItemGroup: false,
        canEditItemGroup: false,
        // Sales Channel permissions
        canViewSalesChannel: false,
        canCreateSalesChannel: false,
        canEditSalesChannel: false,
        // Item permissions
        canViewItem: false,
        canCreateItem: false,
        canEditItem: false,
        // Purchase Order permissions
        canViewPurchaseOrders: false,
        canCreatePurchaseOrder: false,
        canEditPurchaseOrder: false,
        canCancelPurchaseOrder: false,
        // PO Receive permissions
        canViewPOReceive: false,
        canCreatePOReceive: false,
        // Invoice permissions
        canViewInvoices: false,
        canCreateInvoice: false,
        canEditInvoice: false,
        canDeleteInvoice: false,
        canSendInvoiceForApproval: false,
        canApproveInvoice: false,
        canRejectInvoice: false,
        canViewGeneralLedger: false,
        canRecordPayment: false,
        canViewPayments: false,
        canCreatePayments: false,
        canEditPayments: false,
        canApprovePayments: false,
        canRejectPayments: false,
        // Inventory permissions
        canViewInventory: false,
        canViewInventoryTransfer: false,
        // Module access
        canAccessAdminModule: false,
        canAccessSettingsModule: false,
      };
    }

    // Admin users have all permissions
    if (user.roles.includes("Admin-Role") || user.roles.includes("admin")) {
      return {
        // User permissions
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        // Role permissions
        canViewRoles: true,
        canCreateRole: true,
        canEditRoles: true,
        canViewPermissions: true,
        // Organization permissions
        canViewOrganization: true,
        canCreateOrganization: true,
        canEditOrganization: true,
        // Division permissions
        canViewDivision: true,
        canCreateDivision: true,
        canEditDivision: true,
        // Category permissions
        canViewCategory: true,
        canCreateCategory: true,
        canEditCategory: true,
        // Item Group permissions
        canViewItemGroup: true,
        canCreateItemGroup: true,
        canEditItemGroup: true,
        // Sales Channel permissions
        canViewSalesChannel: true,
        canCreateSalesChannel: true,
        canEditSalesChannel: true,
        // Item permissions
        canViewItem: true,
        canCreateItem: true,
        canEditItem: true,
        // Purchase Order permissions
        canViewPurchaseOrders: true,
        canCreatePurchaseOrder: true,
        canEditPurchaseOrder: true,
        canCancelPurchaseOrder: true,
        // PO Receive permissions
        canViewPOReceive: true,
        canCreatePOReceive: true,
        // Invoice permissions
        canViewInvoices: true,
        canCreateInvoice: true,
        canEditInvoice: true,
        canDeleteInvoice: true,
        canSendInvoiceForApproval: true,
        canApproveInvoice: true,
        canRejectInvoice: true,
        canViewGeneralLedger: true,
        canRecordPayment: true,
        canViewPayments: true,
        canCreatePayments: true,
        canEditPayments: true,
        canApprovePayments: true,
        canRejectPayments: true,
        // Inventory
        canViewInventory: true,
        canViewInventoryTransfer: true,
        // Module access
        canAccessAdminModule: true,
        canAccessSettingsModule: true,
      };
    }

    // Check individual permissions from database
    const computed = {
      // User permissions
      canViewUsers: permissions.includes("view-user"),
      canCreateUsers: permissions.includes("create-user"),
      canEditUsers: permissions.includes("edit-user"),
      // Role permissions
      canViewRoles: permissions.includes("view_roles"),
      canCreateRole: permissions.includes("create_role"),
      canEditRoles: permissions.includes("edit_roles"),
      canViewPermissions: permissions.includes("view_permissions"),
      // Organization permissions
      canViewOrganization: permissions.includes("view-organization"),
      canCreateOrganization: permissions.includes("create-organization"),
      canEditOrganization: permissions.includes("edit-organization"),
      // Division permissions
      canViewDivision: permissions.includes("view-division"),
      canCreateDivision: permissions.includes("create-division"),
      canEditDivision: permissions.includes("edit-division"),
      // Category permissions
      canViewCategory: permissions.includes("view-category"),
      canCreateCategory: permissions.includes("create-category"),
      canEditCategory: permissions.includes("edit-category"),
      // Item Group permissions
      canViewItemGroup: permissions.includes("view-item-group"),
      canCreateItemGroup: permissions.includes("create-item-group"),
      canEditItemGroup: permissions.includes("edit-item-group"),
      // Sales Channel permissions
      canViewSalesChannel: permissions.includes("view-sales-channel"),
      canCreateSalesChannel: permissions.includes("create-sales-channel"),
      canEditSalesChannel: permissions.includes("edit-sales-channel"),
      // Item permissions
      canViewItem: permissions.includes("view-item"),
      canCreateItem: permissions.includes("create-item"),
      canEditItem: permissions.includes("edit-item"),
      // Purchase Order permissions
      canViewPurchaseOrders: permissions.includes("View PO"),
      canCreatePurchaseOrder: permissions.includes("Create PO"),
      canEditPurchaseOrder: permissions.includes("Edit PO"),
      canCancelPurchaseOrder: permissions.includes("Cancel PO"),
      // PO Receive permissions
      canViewPOReceive: permissions.includes("View PO Receive"),
      canCreatePOReceive: permissions.includes("Create PO Receive"),
      // Invoice permissions
      canViewInvoices: permissions.includes("View Invoices"),
      canCreateInvoice: permissions.includes("Create Invoice"),
      canEditInvoice: permissions.includes("Edit Invoice"),
      canDeleteInvoice: permissions.includes("Delete Invoice"),
      canSendInvoiceForApproval: permissions.includes("Send Invoice for Approval"),
      canApproveInvoice: permissions.includes("Approve Invoice"),
      canRejectInvoice: permissions.includes("Reject Invoice"),
      // canViewGeneralLedger removed
      canRecordPayment: permissions.includes("Record Payment"),
      canViewPayments: permissions.includes("view_payments"),
      canCreatePayments: permissions.includes("create_payments"),
      canEditPayments: permissions.includes("edit_payments"),
      canApprovePayments: permissions.includes("approve_payments"),
      canRejectPayments: permissions.includes("reject_payments"),
      // Inventory permissions
      canViewInventory: permissions.includes("View Inventory"),
      canViewInventoryTransfer: permissions.includes("View Inventory transfer"),
      // Module access
      canAccessAdminModule: permissions.includes("access_admin") || permissions.length > 0,
      canAccessSettingsModule: permissions.includes("access_settings"),
    };
    
    console.log("Computed permissions:", computed);
    return computed;
  }, [user, isAuthenticated, permissions]);

  console.log("=== usePermissions returning ===");
  console.log("Final state:", {
    isLoading: loading,
    ...memoizedPermissions
  });

  return {
    hasPermission,
    isLoading: loading,
    user,
    // Spread memoized permissions
    ...memoizedPermissions,
    
    // For checking any permission dynamically
    checkPermission: hasPermission,
  };
};
