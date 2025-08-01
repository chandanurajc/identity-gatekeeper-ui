import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Search, Calendar, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { usePaymentPermissions } from "@/hooks/usePaymentPermissions";
import { paymentService } from "@/services/paymentService";
import { Payment, PaymentMode, PaymentStatus } from "@/types/payment";

export default function PaymentsList() {
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewPayments, canCreatePayments, canEditPayments } = usePaymentPermissions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [modeFilter, setModeFilter] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Payment[]>([]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", organizationId],
    queryFn: () => paymentService.getPayments(organizationId),
    enabled: !!organizationId && canViewPayments,
  });

  const getStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Created': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  let columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "paymentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Number" />
      ),
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-primary"
          onClick={() => navigate(`/finance/payments/${row.original.id}`)}
        >
          {row.getValue("paymentNumber")}
        </Button>
      ),
    },
    {
      accessorKey: "paymentDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Date" />
      ),
      cell: ({ row }) => format(new Date(row.getValue("paymentDate")), "dd/MM/yyyy"),
    },
    {
      accessorKey: "paymentType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Type" />
      ),
    },
    {
      accessorKey: "payeeOrganization",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payee" />
      ),
      cell: ({ row }) => row.original.payeeOrganization?.name || "-",
    },
    {
      accessorKey: "paymentMode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Mode" />
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => `₹${Number(row.getValue("amount")).toLocaleString()}`,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.getValue("status"))}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "createdBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
    },
    {
      accessorKey: "createdOn",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created On" />
      ),
      cell: ({ row }) => format(row.getValue("createdOn"), "dd/MM/yyyy"),
    },
  ];

  // Remove the linked invoice columns from the columns array (since columns don't use accessorKey)
  // This filtering is not needed as we don't have those columns

  // Filter payments based on search and filters
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payeeOrganization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesMode = !modeFilter || payment.paymentMode === modeFilter;
    
    return matchesSearch && matchesStatus && matchesMode;
  });

  if (!canViewPayments) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to view payments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (

    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Manage invoice payments and ad-hoc transactions
          </p>
        </div>
        {canCreatePayments && (
          <Button 
            onClick={() => navigate("/finance/payments/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Payment
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter payments by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="Created">Created</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Modes</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Online Payment">Online Payment</SelectItem>
                <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
              </SelectContent>
            </Select>
            
            {canEditPayments && selectedRows.length > 0 && (
              <Button 
                variant="outline"
                disabled={selectedRows.length !== 1}
                onClick={() => selectedRows.length === 1 && navigate(`/finance/payments/${selectedRows[0].id}/edit`)}
              >
                Edit Selected
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments List</CardTitle>
          <CardDescription>
            {filteredPayments.length} payment(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPayments}
          />
        </CardContent>
      </Card>
    </div>
  );
}