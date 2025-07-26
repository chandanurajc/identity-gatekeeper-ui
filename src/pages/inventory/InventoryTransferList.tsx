import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useInventoryTransferPermissions } from "@/hooks/useInventoryTransferPermissions";
import { inventoryTransferService } from "@/services/inventoryTransferService";
import { getInventoryTransferColumns } from "./InventoryTransferColumns";
import { InventoryTransfer } from "@/types/inventoryTransfer";
import { Table } from "@tanstack/react-table";
import PermissionButton from "@/components/PermissionButton";


function TransferListToolbar(table: Table<InventoryTransfer>) {
  return (
    <div className="flex items-center py-4 gap-4">
      <Input
        placeholder="Filter by Transfer ID..."
        value={(table.getColumn("transfer_number")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("transfer_number")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by From Division..."
        value={(table.getColumn("origin_division_name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("origin_division_name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by To Division..."
        value={(table.getColumn("destination_division_name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("destination_division_name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by Created By..."
        value={(table.getColumn("created_by")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("created_by")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
    </div>
  );
}

export default function InventoryTransferList() {
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canCreateInventoryTransfer, canViewInventoryTransfer } = useInventoryTransferPermissions();

  const { data: transfers, isLoading, error } = useQuery({
    queryKey: ["inventory-transfers", organizationId],
    queryFn: () => inventoryTransferService.getInventoryTransfers(organizationId),
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Error loading inventory transfers: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Transfers</h1>
        <PermissionButton
          permission="Create Inventory transfer"
          onClick={() => navigate("/inventory/transfer/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Transfer
        </PermissionButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={getInventoryTransferColumns(canViewInventoryTransfer)}
            data={transfers || []}
            toolbar={TransferListToolbar}
          />
        </CardContent>
      </Card>
    </div>
  );
}