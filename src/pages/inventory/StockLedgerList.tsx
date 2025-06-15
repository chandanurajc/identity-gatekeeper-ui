
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { columns } from "./StockLedgerColumns";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockLedgerList() {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ["inventoryStock", organizationId],
    queryFn: () => {
      if (!organizationId) return [];
      return inventoryService.getInventoryStock(organizationId);
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
    return <div className="text-red-500 p-4">Error fetching stock ledger: {error.message}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Stock Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={stock || []} />
        </CardContent>
      </Card>
    </div>
  );
}
