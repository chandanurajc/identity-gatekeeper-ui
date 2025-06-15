
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { columns } from "./InventoryStockLedgerColumns";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { Table } from "@tanstack/react-table";

function StockLedgerToolbar<TData>({ table }: { table: Table<TData> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-4">
      <Input
        placeholder="Filter by item..."
        value={
          (table.getColumn("item_description")?.getFilterValue() as string) ?? ""
        }
        onChange={(event) =>
          table.getColumn("item_description")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by division..."
        value={
          (table.getColumn("division_name")?.getFilterValue() as string) ?? ""
        }
        onChange={(event) =>
          table.getColumn("division_name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by transaction type..."
        value={
          (table.getColumn("transaction_type")?.getFilterValue() as string) ??
          ""
        }
        onChange={(event) =>
          table.getColumn("transaction_type")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by reference..."
        value={
          (table.getColumn("reference_number")?.getFilterValue() as string) ?? ""
        }
        onChange={(event) =>
          table.getColumn("reference_number")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by user..."
        value={(table.getColumn("created_by")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("created_by")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
    </div>
  );
}


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
        <Skeleton className="h-20 w-full mb-4" />
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
          <CardTitle>Inventory Ledger</CardTitle>
          <CardDescription>A detailed log of all inventory transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={stockLedger || []} 
            toolbar={(table) => <StockLedgerToolbar table={table} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
