"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InventoryStockSummaryItem } from "@/types/inventory";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isValid } from "date-fns";
import { Link } from "react-router-dom";

export const columns: ColumnDef<InventoryStockSummaryItem>[] = [
  {
    accessorKey: "item_id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Item ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const itemId = row.getValue("item_id") as string;
      return <Link to={`/master-data/items/${itemId}`} className="text-blue-600 hover:underline">{itemId}</Link>;
    },
  },
  {
    accessorKey: "item_description",
    header: "Item Description",
  },
  {
    accessorKey: "item_group_name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Item Group
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.getValue("item_group_name") || "N/A",
  },
  {
    accessorKey: "classification",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Classification
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "sub_classification",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Sub Classification
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "division_name",
    header: "Division Name",
  },
  {
    accessorKey: "available_quantity",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc") }>
        Available Quantity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("available_quantity"));
      return <div className="text-right">{quantity.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "in_process_quantity",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc") }>
        In Process Quantity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("in_process_quantity"));
      return <div className="text-right">{quantity.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "uom",
    header: "UOM",
  },
  {
    accessorKey: "last_updated_on",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Last Updated On
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue("last_updated_on");
      if (dateValue) {
        const date = new Date(dateValue as string);
        if (isValid(date)) {
          return format(date, "dd/MM/yyyy HH:mm");
        }
      }
      return "N/A";
    },
  },
];
