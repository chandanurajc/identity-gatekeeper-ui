
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Calendar, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { invoiceService } from "@/services/invoiceService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { usePermissions } from "@/hooks/usePermissions";
import type { Invoice, InvoiceStatus, InvoiceType } from "@/types/invoice";
import { ColumnDef } from "@tanstack/react-table";

const statusColors: Record<InvoiceStatus, string> = {
  Draft: "bg-gray-100 text-gray-800",
  "Awaiting Approval": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const typeColors: Record<InvoiceType, string> = {
  Payable: "bg-red-50 text-red-700",
  Receivable: "bg-blue-50 text-blue-700",
};

export default function InvoicesList() {
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { hasPermission } = usePermissions();
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);

  const organizationId = getCurrentOrganizationId();

  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ["invoices", organizationId],
    queryFn: () => invoiceService.getInvoices(organizationId!),
    enabled: !!organizationId,
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "invoiceNumber",
      header: "Invoice Number",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {hasPermission("View Invoices") ? (
              <button
                onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                className="text-primary hover:underline font-medium"
              >
                {invoice.invoiceNumber}
              </button>
            ) : (
              <span className="font-medium">{invoice.invoiceNumber}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "invoiceDate",
      header: "Invoice Date",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(row.getValue("invoiceDate")).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      accessorKey: "invoiceType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className={typeColors[row.getValue("invoiceType") as InvoiceType]}>
          {row.getValue("invoiceType")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.getValue("status") as InvoiceStatus]}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "totalInvoiceValue",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            ₹{row.getValue<number>("totalInvoiceValue").toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate") as string;
        if (!dueDate) return <span className="text-muted-foreground">-</span>;
        
        const date = new Date(dueDate);
        const isOverdue = date < new Date() && row.original.status !== 'Approved';
        
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
              {date.toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
    },
    {
      accessorKey: "createdOn",
      header: "Created On",
      cell: ({ row }) => (
        <span>{new Date(row.getValue("createdOn")).toLocaleDateString()}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load invoices. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = {
    total: invoices?.length || 0,
    draft: invoices?.filter(inv => inv.status === 'Draft').length || 0,
    pending: invoices?.filter(inv => inv.status === 'Awaiting Approval').length || 0,
    approved: invoices?.filter(inv => inv.status === 'Approved').length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage your payable and receivable invoices</p>
        </div>
        {hasPermission("Create Invoice") && (
          <Button onClick={() => navigate("/finance/invoices/create")} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            A list of all invoices in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={invoices || []}
            onSelectionChange={setSelectedInvoices}
          />
        </CardContent>
      </Card>
    </div>
  );
}
