
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { getInvoicesPendingApprovalCount } from "@/services/invoiceService";

export function InvoicesPendingApprovalWidget({ organizationId }: { organizationId: string }) {
  const { hasPermission } = usePermissions();
  const { data: count, isLoading, error } = useQuery({
    queryKey: ["invoicesPendingApproval", organizationId],
    queryFn: () => getInvoicesPendingApprovalCount(organizationId),
    enabled: !!organizationId && hasPermission("Invoice awaiting approval"),
  });

  if (!hasPermission("Invoice awaiting approval")) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Invoices Pending for Approval</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : error ? (
          <div className="text-red-500 text-xs">{error.message || String(error)}</div>
        ) : (
          <div className="text-2xl font-bold">{count}</div>
        )}
      </CardContent>
    </Card>
  );
}
