import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { invoiceService } from "@/services/invoiceService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { usePermissions } from "@/hooks/usePermissions";
import type { Invoice, InvoiceStatus, InvoiceType } from "@/types/invoice";

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

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { hasPermission } = usePermissions();

  const organizationId = getCurrentOrganizationId();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", id, organizationId],
    queryFn: () => invoiceService.getInvoiceById(id!, organizationId!),
    enabled: !!id && !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load invoice details. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/finance/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <FileText className="h-8 w-8" />
              <span>{invoice.invoiceNumber}</span>
            </h1>
            <p className="text-muted-foreground">Invoice Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={typeColors[invoice.invoiceType]}>
            {invoice.invoiceType}
          </Badge>
          <Badge variant="outline" className={statusColors[invoice.status]}>
            {invoice.status}
          </Badge>
          {hasPermission("Edit Invoice") && (
            <Button onClick={() => navigate(`/finance/invoices/${invoice.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{invoice.totalInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill To & Remit To */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-medium">{invoice.billToName || "N/A"}</div>
              {invoice.billToAddress1 && <div>{invoice.billToAddress1}</div>}
              {invoice.billToAddress2 && <div>{invoice.billToAddress2}</div>}
              {(invoice.billToCity || invoice.billToState) && (
                <div>
                  {invoice.billToCity && invoice.billToState
                    ? `${invoice.billToCity}, ${invoice.billToState}`
                    : invoice.billToCity || invoice.billToState}
                  {invoice.billToPostalCode && ` - ${invoice.billToPostalCode}`}
                </div>
              )}
              {invoice.billToCountry && <div>{invoice.billToCountry}</div>}
              {invoice.billToEmail && <div>Email: {invoice.billToEmail}</div>}
              {invoice.billToPhone && <div>Phone: {invoice.billToPhone}</div>}
              {invoice.billToGstin && <div>GSTIN: {invoice.billToGstin}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remit To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-medium">{invoice.remitToName || "N/A"}</div>
              {invoice.remitToAddress1 && <div>{invoice.remitToAddress1}</div>}
              {invoice.remitToAddress2 && <div>{invoice.remitToAddress2}</div>}
              {(invoice.remitToCity || invoice.remitToState) && (
                <div>
                  {invoice.remitToCity && invoice.remitToState
                    ? `${invoice.remitToCity}, ${invoice.remitToState}`
                    : invoice.remitToCity || invoice.remitToState}
                  {invoice.remitToPostalCode && ` - ${invoice.remitToPostalCode}`}
                </div>
              )}
              {invoice.remitToCountry && <div>{invoice.remitToCountry}</div>}
              {invoice.remitToEmail && <div>Email: {invoice.remitToEmail}</div>}
              {invoice.remitToPhone && <div>Phone: {invoice.remitToPhone}</div>}
              {invoice.remitToGstin && <div>GSTIN: {invoice.remitToGstin}</div>}
            </CardContent>
          </Card>
        </div>

        {/* Invoice Lines */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Lines</CardTitle>
            <CardDescription>Items and quantities on this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoice.invoiceLines?.map((line) => (
                <div key={line.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{line.itemDescription}</div>
                    <div className="text-right">
                      <div className="font-bold">
                        ₹{line.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>Quantity: {line.quantity} {line.uom}</div>
                    <div>Unit Price: ₹{line.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div>GST: {line.gstPercentage}%</div>
                    <div>GST Amount: ₹{line.gstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span>Item Value:</span>
                <span>₹{invoice.totalItemValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Amount:</span>
                <span>₹{invoice.totalGstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>₹{invoice.totalInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Payment Terms:</span>
              <span className="font-medium">{invoice.paymentTerms}</span>
            </div>
            {invoice.referenceTransactionType && (
              <>
                <div className="flex justify-between">
                  <span>Reference Type:</span>
                  <span className="font-medium">{invoice.referenceTransactionType}</span>
                </div>
                {invoice.referenceTransactionNumber && (
                  <div className="flex justify-between">
                    <span>Reference Number:</span>
                    <span className="font-medium">{invoice.referenceTransactionNumber}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Audit Information */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Created By:</span>
              <span className="font-medium">{invoice.createdBy}</span>
            </div>
            <div className="flex justify-between">
              <span>Created On:</span>
              <span className="font-medium">{invoice.createdOn.toLocaleDateString()}</span>
            </div>
            {invoice.updatedBy && (
              <div className="flex justify-between">
                <span>Updated By:</span>
                <span className="font-medium">{invoice.updatedBy}</span>
              </div>
            )}
            {invoice.updatedOn && (
              <div className="flex justify-between">
                <span>Updated On:</span>
                <span className="font-medium">{invoice.updatedOn.toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}