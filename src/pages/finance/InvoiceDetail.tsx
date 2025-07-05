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
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/finance/invoices")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={typeColors[invoice.invoiceType]}>
                    {invoice.invoiceType}
                  </Badge>
                  <Badge variant="outline" className={statusColors[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasPermission("Edit Invoice") && (
                <Button variant="outline" onClick={() => navigate(`/finance/invoices/${invoice.id}/edit`)}>
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
                      window.location.reload();
                    } catch (error) {
                      console.error("Error sending for approval:", error);
                    }
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send for Approval
                </PermissionButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Information Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg border bg-card">
            <div className="text-2xl font-bold">₹{invoice.totalInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div className="text-center p-4 rounded-lg border bg-card">
            <div className="text-lg font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString()}</div>
            <div className="text-sm text-muted-foreground">Invoice Date</div>
          </div>
          <div className="text-center p-4 rounded-lg border bg-card">
            <div className="text-lg font-semibold">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</div>
            <div className="text-sm text-muted-foreground">Due Date</div>
          </div>
          <div className="text-center p-4 rounded-lg border bg-card">
            <div className="text-lg font-semibold">{invoice.paymentTerms}</div>
            <div className="text-sm text-muted-foreground">Payment Terms</div>
          </div>
        </div>

        {/* Additional Info */}
        {(invoice.supplierInvoiceNumber || invoice.notes || divisionName) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {invoice.supplierInvoiceNumber && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="font-semibold">{invoice.supplierInvoiceNumber}</div>
                <div className="text-sm text-muted-foreground">Supplier Invoice #</div>
              </div>
            )}
            {divisionName && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="font-semibold">{divisionName}</div>
                <div className="text-sm text-muted-foreground">Division</div>
              </div>
            )}
            {invoice.notes && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-sm">{invoice.notes}</div>
                <div className="text-sm text-muted-foreground">Notes</div>
              </div>
            )}
          </div>
        )}

        {/* Parties Information - Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bill To */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bill To
            </h3>
            <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
              {billToOrgName && <div className="font-medium">{billToOrgName}</div>}
              {invoice.billToName && <div>{invoice.billToName}</div>}
              {invoice.billToAddress1 && <div>{invoice.billToAddress1}</div>}
              {invoice.billToAddress2 && <div>{invoice.billToAddress2}</div>}
              {(invoice.billToCity || invoice.billToState || invoice.billToPostalCode) && (
                <div>
                  {[invoice.billToCity, invoice.billToState, invoice.billToPostalCode].filter(Boolean).join(', ')}
                </div>
              )}
              {invoice.billToCountry && <div>{invoice.billToCountry}</div>}
              {invoice.billToEmail && <div className="text-muted-foreground">{invoice.billToEmail}</div>}
              {invoice.billToPhone && <div className="text-muted-foreground">{invoice.billToPhone}</div>}
              {invoice.billToGstin && <div className="text-xs text-muted-foreground">GSTIN: {invoice.billToGstin}</div>}
              {invoice.billToCin && <div className="text-xs text-muted-foreground">CIN: {invoice.billToCin}</div>}
            </div>
          </div>

          {/* Remit To */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Remit To
            </h3>
            <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
              {remitToOrgName && <div className="font-medium">{remitToOrgName}</div>}
              {invoice.remitToName && <div>{invoice.remitToName}</div>}
              {invoice.remitToAddress1 && <div>{invoice.remitToAddress1}</div>}
              {invoice.remitToAddress2 && <div>{invoice.remitToAddress2}</div>}
              {(invoice.remitToCity || invoice.remitToState || invoice.remitToPostalCode) && (
                <div>
                  {[invoice.remitToCity, invoice.remitToState, invoice.remitToPostalCode].filter(Boolean).join(', ')}
                </div>
              )}
              {invoice.remitToCountry && <div>{invoice.remitToCountry}</div>}
              {invoice.remitToEmail && <div className="text-muted-foreground">{invoice.remitToEmail}</div>}
              {invoice.remitToPhone && <div className="text-muted-foreground">{invoice.remitToPhone}</div>}
              {invoice.remitToGstin && <div className="text-xs text-muted-foreground">GSTIN: {invoice.remitToGstin}</div>}
              {invoice.remitToCin && <div className="text-xs text-muted-foreground">CIN: {invoice.remitToCin}</div>}
            </div>
          </div>

          {/* Ship To */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ship To
            </h3>
            <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
              {invoice.sameAsDivisionAddress && (
                <div className="text-xs text-muted-foreground mb-2">Same as Division Address</div>
              )}
              {invoice.shipToName && <div className="font-medium">{invoice.shipToName}</div>}
              {invoice.shipToAddress1 && <div>{invoice.shipToAddress1}</div>}
              {invoice.shipToAddress2 && <div>{invoice.shipToAddress2}</div>}
              {(invoice.shipToCity || invoice.shipToState || invoice.shipToPostalCode) && (
                <div>
                  {[invoice.shipToCity, invoice.shipToState, invoice.shipToPostalCode].filter(Boolean).join(', ')}
                </div>
              )}
              {invoice.shipToCountry && <div>{invoice.shipToCountry}</div>}
              {invoice.shipToPhone && <div className="text-muted-foreground">{invoice.shipToPhone}</div>}
            </div>
          </div>
        </div>

        {/* Reference Transaction */}
        {(invoice.referenceTransactionType || invoice.referenceTransactionNumber || invoice.referenceTransactionDate) && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reference Transaction
            </h3>
            <div className="p-4 rounded-lg border bg-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {invoice.referenceTransactionType && (
                  <div>
                    <div className="font-medium">{invoice.referenceTransactionType}</div>
                    <div className="text-muted-foreground">Type</div>
                  </div>
                )}
                {invoice.referenceTransactionNumber && (
                  <div>
                    <div className="font-medium">{invoice.referenceTransactionNumber}</div>
                    <div className="text-muted-foreground">Number</div>
                  </div>
                )}
                {invoice.referenceTransactionDate && (
                  <div>
                    <div className="font-medium">{new Date(invoice.referenceTransactionDate).toLocaleDateString()}</div>
                    <div className="text-muted-foreground">Date</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoice Lines */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Invoice Lines
          </h3>
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Line</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Price</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">GST</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.invoiceLines?.map((line) => (
                    <tr key={line.id} className="hover:bg-muted/30">
                      <td className="px-3 py-3 text-sm font-medium">{line.lineNumber}</td>
                      <td className="px-3 py-3 text-sm">{line.itemId}</td>
                      <td className="px-3 py-3 text-sm">{line.itemDescription}</td>
                      <td className="px-3 py-3 text-sm text-right">{line.quantity} {line.uom}</td>
                      <td className="px-3 py-3 text-sm text-right">
                        ₹{line.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 text-sm text-right">
                        {line.gstPercentage}% (₹{line.gstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-medium">
                        ₹{line.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Item Value:</span>
                <span>₹{invoice.totalItemValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total GST Value:</span>
                <span>₹{invoice.totalGstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Invoice Value:</span>
                <span>₹{invoice.totalInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GST Breakdown */}
        {invoice.gstBreakdown && invoice.gstBreakdown.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4" />
              GST Breakdown
            </h3>
            <div className="space-y-4">
              {invoice.gstBreakdown.map((breakdown) => (
                <div key={breakdown.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">GST Rate: {breakdown.gstPercentage}%</span>
                    <span className="font-bold">
                      ₹{breakdown.totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="font-medium">₹{breakdown.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="text-muted-foreground">Taxable Amount</div>
                    </div>
                    {breakdown.cgstAmount > 0 && (
                      <div>
                        <div className="font-medium">₹{breakdown.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div className="text-muted-foreground">CGST ({breakdown.cgstPercentage}%)</div>
                      </div>
                    )}
                    {breakdown.sgstAmount > 0 && (
                      <div>
                        <div className="font-medium">₹{breakdown.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div className="text-muted-foreground">SGST ({breakdown.sgstPercentage}%)</div>
                      </div>
                    )}
                    {breakdown.igstAmount > 0 && (
                      <div>
                        <div className="font-medium">₹{breakdown.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div className="text-muted-foreground">IGST ({breakdown.igstPercentage}%)</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Information */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Audit & History
          </h3>
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{invoice.createdBy}</div>
                <div className="text-muted-foreground">Created by</div>
              </div>
              <div>
                <div className="font-medium">{invoice.createdOn.toLocaleString()}</div>
                <div className="text-muted-foreground">Created on</div>
              </div>
              {invoice.updatedBy && (
                <div>
                  <div className="font-medium">{invoice.updatedBy}</div>
                  <div className="text-muted-foreground">Updated by</div>
                </div>
              )}
              {invoice.updatedOn && (
                <div>
                  <div className="font-medium">{invoice.updatedOn.toLocaleString()}</div>
                  <div className="text-muted-foreground">Updated on</div>
                </div>
              )}
            </div>

            {/* Status History */}
            {invoice.auditLog && invoice.auditLog.length > 0 && (
              <div className="pt-4 border-t">
                <div className="font-medium mb-3">Status History</div>
                <div className="space-y-2">
                  {invoice.auditLog.map((log) => (
                    <div key={log.id} className="flex justify-between items-center p-2 rounded border">
                      <div className="flex items-center gap-2">
                        {log.oldStatus && (
                          <Badge variant="outline" className="text-xs">{log.oldStatus}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">→</span>
                        <Badge variant="outline" className="text-xs">{log.newStatus}</Badge>
                        {log.comments && (
                          <span className="text-xs text-muted-foreground">- {log.comments}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.changedBy} • {log.changedOn.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}