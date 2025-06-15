
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { columns } from "./InventoryStockLedgerColumns";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryStockLedger() {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const { data: stockLedger, isLoading, error } = useQuery({
    queryKey: ["inventoryStockLedger", organizationId],
    queryFn: () => {
      if (!organizationId) return [];
      return inventoryService.getInventoryStockLedger(organizationId);
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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
          <CardTitle>Inventory Stock Ledger</CardTitle>
          <CardDescription>A detailed log of all inventory transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={stockLedger || []} 
            filterColumn="item_description"
            filterPlaceholder="Filter by item description..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
