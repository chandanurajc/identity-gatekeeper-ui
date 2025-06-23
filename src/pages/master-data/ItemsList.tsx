
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { itemService } from "@/services/itemService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { Item } from "@/types/item";
import { ItemThumbnailViewer } from "@/components/item/ItemThumbnailViewer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";
import { format } from "date-fns";

const ItemsList = () => {
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { canViewItem, canCreateItem, canEditItem } = useItemPermissions();
  const organizationId = getCurrentOrganizationId();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["items", organizationId],
    queryFn: () => itemService.getItems(),
    enabled: !!organizationId,
  });

  const filteredItems = items.filter(item =>
    item.description.toLowerCase().includes(globalFilter.toLowerCase()) ||
    item.classification.toLowerCase().includes(globalFilter.toLowerCase()) ||
    item.id.toLowerCase().includes(globalFilter.toLowerCase())
  );

  const handleRowSelection = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, itemId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredItems.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  const columns: ColumnDef<Item>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={selectedRows.length === filteredItems.length && filteredItems.length > 0}
          onCheckedChange={(value) => handleSelectAll(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.includes(row.original.id)}
          onCheckedChange={(value) => handleRowSelection(row.original.id, !!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "Item ID",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            {canViewItem ? (
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => navigate(`/master-data/items/${item.id}`)}
              >
                {item.id}
              </Button>
            ) : (
              <span className="font-medium">{item.id}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{item.description}</span>
            <ItemThumbnailViewer itemId={item.id} />
          </div>
        );
      },
    },
    {
      accessorKey: "classification",
      header: "Classification",
    },
    {
      accessorKey: "subClassification",
      header: "Sub Classification",
    },
    {
      accessorKey: "uom",
      header: "UOM",
    },
    {
      accessorKey: "gstPercentage",
      header: "GST %",
      cell: ({ row }) => `${row.getValue("gstPercentage")}%`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => row.original.createdBy || "-",
    },
    {
      accessorKey: "createdOn",
      header: "Created On",
      cell: ({ row }) => {
        const date = row.original.createdOn;
        return date ? format(new Date(date), "dd/MM/yyyy HH:mm") : "-";
      },
    },
    {
      accessorKey: "updatedBy",
      header: "Updated By",
      cell: ({ row }) => row.original.updatedBy || "-",
    },
    {
      accessorKey: "updatedOn",
      header: "Updated On",
      cell: ({ row }) => {
        const date = row.original.updatedOn;
        return date ? format(new Date(date), "dd/MM/yyyy HH:mm") : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            {canEditItem && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/master-data/items/${item.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (!canViewItem) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to view items.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div>Loading items...</div>;
  if (error) return <div>Error loading items: {error.message}</div>;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                Manage your item master data
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              {canEditItem && selectedRows.length === 1 && (
                <Button
                  onClick={() => navigate(`/master-data/items/${selectedRows[0]}/edit`)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Selected
                </Button>
              )}
              {canCreateItem && (
                <Button onClick={() => navigate("/master-data/items/create")}>
                  Create Item
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter items..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredItems}
            />
          </div>
          {selectedRows.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {selectedRows.length} of {filteredItems.length} row(s) selected.
              {selectedRows.length > 1 && " (Edit button disabled for multiple selections)"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemsList;
