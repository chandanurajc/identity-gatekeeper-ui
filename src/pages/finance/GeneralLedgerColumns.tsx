
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { GeneralLedgerEntry } from "@/types/generalLedger"
import { format } from 'date-fns'
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export const columns: ColumnDef<GeneralLedgerEntry>[] = [
  {
    accessorKey: "transaction_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GL Date" />
    ),
    cell: ({ row }) => format(new Date(row.getValue("transaction_date")), "PPP"),
  },
  {
    accessorKey: "reference_number",
    header: "Ref #",
  },
  {
    accessorKey: "transaction_type",
    header: "Transaction Type",
  },
  {
    accessorKey: "debit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Debit (₹)" />
    ),
    cell: ({ row }) => <div className="text-right">{row.getValue("debit") ? currencyFormatter.format(row.getValue("debit")) : null}</div>,
  },
  {
    accessorKey: "credit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Credit (₹)" />
    ),
    cell: ({ row }) => <div className="text-right">{row.getValue("credit") ? currencyFormatter.format(row.getValue("credit")) : null}</div>,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance (₹)" />
    ),
    cell: ({ row }) => <div className="text-right font-semibold">{currencyFormatter.format(row.getValue("balance"))}</div>,
  },
  {
    accessorKey: "created_by",
    header: "Created By",
  },
  {
    accessorKey: "created_on",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created On" />
    ),
    cell: ({ row }) => format(new Date(row.getValue("created_on")), "Pp"),
  },
]
