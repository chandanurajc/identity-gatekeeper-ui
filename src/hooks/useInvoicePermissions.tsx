
import { useAuth } from "@/context/AuthContext";

export const useInvoicePermissions = () => {
  const { hasPermission } = useAuth();

  const canViewInvoices = hasPermission("view-invoice");
  const canApproveInvoice = hasPermission("approve-invoice");

  return { canViewInvoices, canApproveInvoice };
};
