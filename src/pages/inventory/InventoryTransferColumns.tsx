import { ColumnDef } from "@tanstack/react-table";
import { InventoryTransfer } from "@/types/inventoryTransfer";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getUserNameById } from "@/lib/userUtils";

export function getInventoryTransferColumns(canViewInventoryTransfer: boolean): ColumnDef<InventoryTransfer>[] {
  return [
    {
      accessorKey: "transfer_number",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Transfer ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const transferNumber = row.getValue("transfer_number") as string;
        if (canViewInventoryTransfer) {
          return (
            <Link 
              to={`/inventory/transfer/${row.original.id}`}
              className="text-primary hover:underline font-medium"
            >
              {transferNumber}
            </Link>
          );
        } else {
          return <span className="text-muted-foreground font-medium">{transferNumber}</span>;
        }
      },
    },
    {
      accessorKey: "origin_division_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          From Division
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "destination_division_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          To Division
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "transfer_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Transfer Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("transfer_date") as string;
        return format(new Date(date), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "Transfer confirmed" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_by",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created By
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue("created_by") as string;
        return <span>{value}</span>;
      },
    },
    {
      accessorKey: "created_on",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created On
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_on") as Date;
        return format(new Date(date), "MMM dd, yyyy HH:mm");
      },
    },
    {
      accessorKey: "updated_by",
      header: "Updated By",
    },
    {
      accessorKey: "updated_on",
      header: "Updated On",
      cell: ({ row }) => {
        const date = row.getValue("updated_on") as Date;
        return date ? format(new Date(date), "MMM dd, yyyy HH:mm") : "-";
      },
    },
  ];
}