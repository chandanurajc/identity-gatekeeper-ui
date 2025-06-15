
import { usePermissions } from "@/hooks/usePermissions";

export const useInvoicePermissions = () => {
  const { hasPermission } = usePermissions();

  const canViewInvoices = hasPermission("view-invoice");
  const canApproveInvoice = hasPermission("approve-invoice");

  return { canViewInvoices, canApproveInvoice };
};
