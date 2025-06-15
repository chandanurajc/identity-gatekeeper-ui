
import { useQuery } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoiceService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./InvoicesListColumns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const InvoicesList = () => {
  const { organizationId } = useMultiTenant();
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["invoices", organizationId],
    queryFn: () => invoiceService.getInvoices(organizationId!),
    enabled: !!organizationId,
  });

  if (isLoading) return <div>Loading invoices...</div>;
  if (error) return <div>Error fetching invoices: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={invoices || []} />
      </CardContent>
    </Card>
  );
};

export default InvoicesList;
