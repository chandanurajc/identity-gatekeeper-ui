
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InventoryStockLedgerItem } from "@/types/inventory";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isValid } from "date-fns";

export const columns: ColumnDef<InventoryStockLedgerItem>[] = [
  {
    accessorKey: "created_on",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue("created_on");
      if (dateValue) {
        const date = new Date(dateValue as string);
        if (isValid(date)) {
          return format(date, "dd/MM/yyyy HH:mm");
        }
      }
      return "N/A";
    },
  },
  {
    id: "item_description",
    accessorFn: (row) => row.item?.description,
    header: "Item Description",
  },
  {
    id: "division_name",
    accessorFn: (row) => row.division?.name,
    header: "Division",
  },
  {
    accessorKey: "transaction_type",
    header: "Transaction Type",
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Quantity</div>,
    cell: ({ row }) => {
        const quantity = parseFloat(row.getValue("quantity"));
        const type = row.original.transaction_type;
        const displayQuantity = (type === 'SALES_ORDER' || type === 'ADJUSTMENT_OUT') ? -Math.abs(quantity) : Math.abs(quantity);
        return <div className="text-right">{displayQuantity.toLocaleString()}</div>;
    }
  },
  {
    accessorKey: "uom",
    header: "UOM",
  },
  {
    accessorKey: "reference_number",
    header: "Reference",
  },
  {
    accessorKey: "created_by",
    header: "User",
  },
];
