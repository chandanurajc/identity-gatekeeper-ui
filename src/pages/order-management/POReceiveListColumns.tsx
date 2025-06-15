
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PurchaseOrder } from "@/types/purchaseOrder";
import { ArrowUpDown, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import PermissionButton from "@/components/PermissionButton";

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: "poNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          PO Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link to={`/order-management/purchase-orders/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
        {row.getValue("poNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "supplier.name",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier?.name || "N/A",
  },
  {
    accessorKey: "poDate",
    header: "PO Date",
    cell: ({ row }) => new Date(row.getValue("poDate")).toLocaleDateString(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === 'Partially Received') variant = 'outline';
      if (status === 'Received') variant = 'default';

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
  },
  {
    accessorKey: "createdOn",
    header: "Created On",
    cell: ({ row }) => new Date(row.getValue("createdOn")).toLocaleString(),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const po = row.original;
      return (
        <div className="text-right">
            <Link to={`/order-management/po-receive/${po.id}`}>
                <PermissionButton
                    permission="Create PO Receive"
                    onClick={() => {}}
                    variant="outline"
                    size="sm"
                    title="Receive PO"
                >
                    <Truck className="h-4 w-4 mr-2" />
                    Receive
                </PermissionButton>
            </Link>
        </div>
      );
    },
  },
];
