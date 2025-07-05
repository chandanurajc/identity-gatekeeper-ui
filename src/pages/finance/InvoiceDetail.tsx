import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, Building2, MapPin, Phone, Mail, Globe, Hash, Weight, Package, Send, Users } from "lucide-react";
import PermissionButton from "@/components/PermissionButton";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { invoiceService } from "@/services/invoiceService";
import { divisionService } from "@/services/divisionService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { usePermissions } from "@/hooks/usePermissions";
import type { Invoice, InvoiceStatus, InvoiceType } from "@/types/invoice";
import { organizationService } from "@/services/organizationService";

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
  const { user } = useAuth();

  const organizationId = getCurrentOrganizationId();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", id, organizationId],
    queryFn: () => invoiceService.getInvoiceById(id!, organizationId!),
    enabled: !!id && !!organizationId,
  });

  const [billToOrgName, setBillToOrgName] = useState<string>("");
  const [remitToOrgName, setRemitToOrgName] = useState<string>("");
  const [divisionName, setDivisionName] = useState<string>("");

  useEffect(() => {
    if (invoice?.billToOrgId) {
      organizationService.getOrganizationById(invoice.billToOrgId).then(org => {
        setBillToOrgName(org?.name || "");
      });
    }
    if (invoice?.remitToOrgId) {
      organizationService.getOrganizationById(invoice.remitToOrgId).then(org => {
        setRemitToOrgName(org?.name || "");
      });
    }
    if (invoice?.divisionId) {
      divisionService.getDivisionById(invoice.divisionId).then(division => {
        setDivisionName(division?.name || "");
      });
    }
  }, [invoice?.billToOrgId, invoice?.remitToOrgId, invoice?.divisionId]);

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

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon?: any }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {Icon && <Icon className="h-3 w-3" />}
          <span>{label}:</span>
        </div>
        <span className="text-sm font-medium">{value}</span>
      </div>
    );
  };

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
          {invoice.status === 'Draft' && hasPermission("Send Invoice for Approval") && (
            <PermissionButton 
              permission="Send Invoice for Approval"
              onClick={async () => {
                try {
                  await invoiceService.updateInvoiceStatus(invoice.id, 'Awaiting Approval', organizationId!, user?.email || '', 'Sent for approval');
                  window.location.reload(); // Refresh to show updated status
                } catch (error) {
                  console.error("Error sending for approval:", error);
                }
              }}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send for Approval</span>
            </PermissionButton>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
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
            <div className="text-xl font-bold">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Terms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{invoice.paymentTerms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ₹{invoice.totalInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Division Information */}
      {divisionName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Division</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Division Name" value={divisionName} icon={Users} />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill To Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Bill To</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {billToOrgName && (
              <InfoRow label="Organization" value={billToOrgName} icon={Building2} />
            )}
            {invoice.billToName && (
              <InfoRow label="Name" value={invoice.billToName} icon={Mail} />
            )}
            <InfoRow label="Address Line 1" value={invoice.billToAddress1} icon={MapPin} />
            <InfoRow label="Address Line 2" value={invoice.billToAddress2} icon={MapPin} />
            <InfoRow label="City" value={invoice.billToCity} icon={MapPin} />
            <InfoRow label="State" value={invoice.billToState} icon={MapPin} />
            <InfoRow label="State Code" value={invoice.billToStateCode} icon={Hash} />
            <InfoRow label="Postal Code" value={invoice.billToPostalCode} icon={MapPin} />
            <InfoRow label="Country" value={invoice.billToCountry} icon={Globe} />
            <InfoRow label="Email" value={invoice.billToEmail} icon={Mail} />
            <InfoRow label="Phone" value={invoice.billToPhone} icon={Phone} />
            <InfoRow label="GSTIN" value={invoice.billToGstin} icon={Hash} />
            <InfoRow label="CIN" value={invoice.billToCin} icon={Hash} />
          </CardContent>
        </Card>

        {/* Remit To Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Remit To</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {remitToOrgName && (
              <InfoRow label="Organization" value={remitToOrgName} icon={Building2} />
            )}
            {invoice.remitToName && (
              <InfoRow label="Name" value={invoice.remitToName} icon={Mail} />
            )}
            <InfoRow label="Address Line 1" value={invoice.remitToAddress1} icon={MapPin} />
            <InfoRow label="Address Line 2" value={invoice.remitToAddress2} icon={MapPin} />
            <InfoRow label="City" value={invoice.remitToCity} icon={MapPin} />
            <InfoRow label="State" value={invoice.remitToState} icon={MapPin} />
            <InfoRow label="State Code" value={invoice.remitToStateCode} icon={Hash} />
            <InfoRow label="Postal Code" value={invoice.remitToPostalCode} icon={MapPin} />
            <InfoRow label="Country" value={invoice.remitToCountry} icon={Globe} />
            <InfoRow label="Email" value={invoice.remitToEmail} icon={Mail} />
            <InfoRow label="Phone" value={invoice.remitToPhone} icon={Phone} />
            <InfoRow label="GSTIN" value={invoice.remitToGstin} icon={Hash} />
            <InfoRow label="CIN" value={invoice.remitToCin} icon={Hash} />
          </CardContent>
        </Card>

        {/* Ship To Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Ship To</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Same as Division Address" value={invoice.sameAsDivisionAddress ? "Yes" : "No"} />
            <InfoRow label="Name" value={invoice.shipToName} icon={Building2} />
            <InfoRow label="Address Line 1" value={invoice.shipToAddress1} icon={MapPin} />
            <InfoRow label="Address Line 2" value={invoice.shipToAddress2} icon={MapPin} />
            <InfoRow label="City" value={invoice.shipToCity} icon={MapPin} />
            <InfoRow label="State" value={invoice.shipToState} icon={MapPin} />
            <InfoRow label="State Code" value={invoice.shipToStateCode} icon={Hash} />
            <InfoRow label="Postal Code" value={invoice.shipToPostalCode} icon={MapPin} />
            <InfoRow label="Country" value={invoice.shipToCountry} icon={Globe} />
            <InfoRow label="Phone" value={invoice.shipToPhone} icon={Phone} />
          </CardContent>
        </Card>

        {/* Reference Transaction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Reference Transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Type" value={invoice.referenceTransactionType} icon={FileText} />
            <InfoRow label="Number" value={invoice.referenceTransactionNumber} icon={Hash} />
            <InfoRow label="Date" value={invoice.referenceTransactionDate ? new Date(invoice.referenceTransactionDate).toLocaleDateString() : null} icon={Calendar} />
          </CardContent>
        </Card>
      </div>

      {/* Invoice Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Invoice Lines</span>
          </CardTitle>
          <CardDescription>Detailed breakdown of items and quantities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Line</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">UOM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight/Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Weight</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">GST %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">GST Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {invoice.invoiceLines?.map((line) => (
                  <tr key={line.id} className="hover:bg-muted/50">
                    <td className="px-4 py-4 whitespace-nowrap font-medium">{line.lineNumber}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{line.itemId}</td>
                    <td className="px-4 py-4">{line.itemDescription}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">{line.quantity}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{line.uom}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {line.weightPerUnit ? `${line.weightPerUnit} ${line.weightUom || 'kg'}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {line.totalWeight ? `${line.totalWeight} ${line.weightUom || 'kg'}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      ₹{line.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      ₹{line.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">{line.gstPercentage}%</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      ₹{line.gstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                      ₹{line.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Item Value:</span>
                <span className="font-medium">₹{invoice.totalItemValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total GST Value:</span>
                <span className="font-medium">₹{invoice.totalGstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Invoice Value:</span>
                <span>₹{invoice.totalInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GST Breakdown */}
      {invoice.gstBreakdown && invoice.gstBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Hash className="h-5 w-5" />
              <span>GST Breakdown</span>
            </CardTitle>
            <CardDescription>Detailed GST calculation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoice.gstBreakdown.map((breakdown, index) => (
                <div key={breakdown.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">GST Rate: {breakdown.gstPercentage}%</h4>
                    <div className="font-bold">
                      ₹{breakdown.totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <InfoRow label="Taxable Amount" value={`₹${breakdown.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
                    <InfoRow label="CGST %" value={breakdown.cgstPercentage > 0 ? `${breakdown.cgstPercentage}%` : null} />
                    <InfoRow label="CGST Amount" value={breakdown.cgstAmount > 0 ? `₹${breakdown.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : null} />
                    <InfoRow label="SGST %" value={breakdown.sgstPercentage > 0 ? `${breakdown.sgstPercentage}%` : null} />
                    <InfoRow label="SGST Amount" value={breakdown.sgstAmount > 0 ? `₹${breakdown.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : null} />
                    <InfoRow label="IGST %" value={breakdown.igstPercentage > 0 ? `${breakdown.igstPercentage}%` : null} />
                    <InfoRow label="IGST Amount" value={breakdown.igstAmount > 0 ? `₹${breakdown.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : null} />
                  </div>
                  
                  {index < invoice.gstBreakdown!.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Audit Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <InfoRow label="Created By" value={invoice.createdBy} />
              <InfoRow label="Created On" value={invoice.createdOn.toLocaleString()} icon={Calendar} />
              {invoice.approvalRequestedBy && (
                <InfoRow label="Approval Requested By" value={invoice.approvalRequestedBy} />
              )}
            </div>
            <div className="space-y-1">
              <InfoRow label="Updated By" value={invoice.updatedBy} />
              <InfoRow label="Updated On" value={invoice.updatedOn?.toLocaleString()} icon={Calendar} />
              {invoice.approvalRequestedOn && (
                <InfoRow label="Approval Requested On" value={invoice.approvalRequestedOn.toLocaleString()} icon={Calendar} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      {invoice.auditLog && invoice.auditLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Status Change History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.auditLog.map((log) => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        {log.oldStatus && (
                          <Badge variant="outline" className="text-xs">
                            {log.oldStatus}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">→</span>
                        <Badge variant="outline" className="text-xs">
                          {log.newStatus}
                        </Badge>
                      </div>
                      {log.comments && (
                        <p className="text-sm text-muted-foreground mt-1">{log.comments}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{log.changedBy}</div>
                      <div>{log.changedOn.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}