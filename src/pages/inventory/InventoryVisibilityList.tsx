
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { columns } from "./InventoryVisibilityColumns";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Table } from "@tanstack/react-table";
import { InventoryStockSummaryItem } from "@/types/inventory";

function InventoryVisibilityToolbar({ table }: { table: Table<InventoryStockSummaryItem> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-4">
      <Input
        placeholder="Filter by item description..."
        value={
          (table.getColumn("item_description")?.getFilterValue() as string) ?? ""
        }
        onChange={(event) =>
          table.getColumn("item_description")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by item group..."
        value={
          (table.getColumn("item_group_name")?.getFilterValue() as string) ?? ""
        }
        onChange={(event) =>
          table.getColumn("item_group_name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by classification..."
        value={
          (table.getColumn("classification")?.getFilterValue() as string) ?? ""
        }
        onChange={(event) =>
          table.getColumn("classification")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by sub classification..."
        value={
          (table.getColumn("sub_classification")?.getFilterValue() as string) ?? ""
        }
        onChange={(event) =>
          table.getColumn("sub_classification")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
    </div>
  );
}


export default function InventoryVisibilityList() {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const [includeZeroStock, setIncludeZeroStock] = useState(false);

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ["inventoryStockSummary", organizationId, includeZeroStock],
    queryFn: () => {
      if (!organizationId) return [];
      return inventoryService.getInventoryStockSummary(organizationId, includeZeroStock);
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Skeleton className="h-9 w-48 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error fetching stock: {error.message}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Visibility</CardTitle>
          <CardDescription>Real-time visibility into available stock across divisions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="include-zero-stock"
              checked={includeZeroStock}
              onCheckedChange={setIncludeZeroStock}
            />
            <Label htmlFor="include-zero-stock">Include zero stock</Label>
          </div>
          <DataTable 
            columns={columns} 
            data={stock || []} 
            toolbar={(table) => <InventoryVisibilityToolbar table={table} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
