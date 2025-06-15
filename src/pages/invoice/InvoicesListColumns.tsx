"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Invoice } from "@/types/invoice"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { Link } from "react-router-dom"

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice #" />
    ),
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <Link to={`/invoices/${invoice.id}`} className="font-medium text-blue-600 hover:underline">
          {invoice.invoiceNumber}
        </Link>
      )
    }
  },
  {
    accessorKey: "poNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PO #" />
    ),
  },
  {
    accessorKey: "supplier.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      return <span>{format(new Date(row.original.dueDate), 'PPP')}</span>
    }
  },
  {
    accessorKey: "totalInvoiceAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("totalInvoiceAmount") as number;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
 
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === 'Approved') variant = 'default';
      if (status === 'Paid') variant = 'default';
      if (status === 'Created') variant = 'outline';
      
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdOn",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created On" />
    ),
    cell: ({ row }) => {
        return <span>{format(row.original.createdOn, 'PPP')}</span>
    }
  },
]
