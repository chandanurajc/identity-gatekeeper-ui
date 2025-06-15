
import { useQuery } from "@tanstack/react-query";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { columns } from "./POReceiveListColumns";
import { DataTable } from "@/components/ui/data-table"; // Assuming a generic DataTable component exists
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PurchaseOrderReceiveList() {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const { data: purchaseOrders, isLoading, error } = useQuery({
    queryKey: ["purchaseOrders", organizationId, "receivable"],
    queryFn: async () => {
      if (!organizationId) return [];
      const allPOs = await purchaseOrderService.getAllPurchaseOrders(organizationId);
      return allPOs.filter(po => po.status === 'Created' || po.status === 'Partially Received');
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error fetching purchase orders: {error.message}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>PO Receive</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={purchaseOrders || []} />
        </CardContent>
      </Card>
    </div>
  );
}
