
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InventoryStockLedgerItem } from "@/types/inventory";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<InventoryStockLedgerItem>[] = [
  {
    accessorKey: "createdOn",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.getValue("createdOn")).toLocaleString(),
  },
  {
    accessorKey: "item.description",
    header: "Item",
    cell: ({ row }) => row.original.item?.description || row.original.itemId,
  },
  {
    accessorKey: "division.name",
    header: "Division",
    cell: ({ row }) => row.original.division?.name || row.original.divisionId,
  },
  {
    accessorKey: "transactionType",
    header: "Transaction Type",
    cell: ({ row }) => {
      const type = row.getValue("transactionType") as string;
      if (!type) {
        return <Badge variant="outline">N/A</Badge>;
      }
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (type === 'PO_RECEIVE' || type === 'ADJUSTMENT_IN') variant = 'default';
      if (type === 'ADJUSTMENT_OUT' || type === 'SALES_ORDER') variant = 'destructive';
      
      const formattedType = type.replace(/_/g, ' ').toLowerCase();
      
      return <Badge variant={variant}>{formattedType}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
        const type = row.original.transactionType;
        const quantity = row.getValue("quantity") as number;
        const displayQty = ['ADJUSTMENT_OUT', 'SALES_ORDER'].includes(type) ? -quantity : quantity;
        const color = displayQty > 0 ? "text-green-600" : "text-red-600";
        return <span className={color}>{displayQty}</span>
    }
  },
  {
    accessorKey: "uom",
    header: "UOM",
  },
  {
    accessorKey: "referenceNumber",
    header: "Reference",
  },
  {
    accessorKey: "createdBy",
    header: "User",
  },
];
