import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { itemService } from "@/services/itemService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { Item } from "@/types/item";
import { ItemThumbnailViewer } from "@/components/item/ItemThumbnailViewer";
import { Badge } from "@/components/ui/badge";

const ItemsList = () => {
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { canViewItem, canCreateItem } = useItemPermissions();
  const organizationId = getCurrentOrganizationId();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["items", organizationId],
    queryFn: () => itemService.getItems(),
    enabled: !!organizationId,
  });

  const columns: ColumnDef<Item>[] = [
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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                Manage your item master data
              </CardDescription>
            </div>
            {canCreateItem && (
              <Button onClick={() => navigate("/master-data/items/create")}>
                Create Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={items}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemsList;
