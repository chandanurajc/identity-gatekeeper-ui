
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Invoice } from "@/types/invoice"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { Link } from "react-router-dom"

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoice_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice #" />
    ),
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <Link to={`/invoices/${invoice.id}`} className="font-medium text-blue-600 hover:underline">
          {invoice.invoice_number}
        </Link>
      )
    }
  },
  {
    accessorKey: "reference_transaction_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference #" />
    ),
  },
  {
    id: "parties",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parties" />
    ),
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <div>
          <div>
            <span className="text-xs text-muted-foreground">Bill To: </span>
            <span>{invoice.bill_to_name}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Remit To: </span>
            <span>{invoice.remit_to_name}</span>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "invoice_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice Type" />
    ),
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      return <span>{format(new Date(row.original.due_date), 'PPP')}</span>
    }
  },
  {
    accessorKey: "total_invoice_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("total_invoice_amount") as number;
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
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
      if (status === 'Draft') variant = 'outline';
      
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: "created",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <span>{format(row.original.created_on, 'PPP')}</span>
          <div className="text-xs text-muted-foreground">{row.original.created_by}</div>
        </div>
      )
    }
  },
  {
    id: "updated",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      if (!row.original.updated_on) return "-";
      return (
        <div>
          <span>{format(row.original.updated_on, 'PPP')}</span>
          <div className="text-xs text-muted-foreground">{row.original.updated_by}</div>
        </div>
      )
    }
  },
]
