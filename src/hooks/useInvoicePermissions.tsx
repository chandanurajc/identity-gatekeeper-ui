
import { usePermissions } from "@/hooks/usePermissions";

export const useInvoicePermissions = () => {
  const { hasPermission } = usePermissions();

  const canViewInvoices = hasPermission("View Invoices");
  const canCreateInvoice = hasPermission("Create Invoice");
  const canEditInvoice = hasPermission("Edit Invoice");
  const canApproveInvoice = hasPermission("Approve Invoice");
  const canRejectInvoice = hasPermission("Reject Invoice");
  const canCancelInvoice = hasPermission("Cancel Invoice");

  return { 
    canViewInvoices, 
    canCreateInvoice,
    canEditInvoice,
    canApproveInvoice,
    canRejectInvoice,
    canCancelInvoice
  };
};
