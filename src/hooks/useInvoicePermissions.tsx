
import { usePermissions } from "@/hooks/usePermissions";

export const useInvoicePermissions = () => {
  const { hasPermission } = usePermissions();

  const canViewInvoices = hasPermission("View Invoices");
  const canApproveInvoice = hasPermission("Approve Invoice");

  return { canViewInvoices, canApproveInvoice };
};
