import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Edit, FileText, Building, Calendar, DollarSign, CreditCard, Hash, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { usePaymentPermissions } from "@/hooks/usePaymentPermissions";
import { paymentService } from "@/services/paymentService";
import { PaymentStatus } from "@/types/payment";

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canEditPayments, canViewPayments, canApprovePayments, canRejectPayments, user } = usePaymentPermissions();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => paymentService.getPaymentById(id!),
    enabled: !!id && canViewPayments,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["paymentAuditLogs", id],
    queryFn: () => paymentService.getPaymentAuditLogs(id!),
    enabled: !!id && canViewPayments,
  });

  const getStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Created': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    if (!payment) return;
    setIsApproving(true);
    try {
      await paymentService.updatePaymentStatus(payment.id, "Approved", user?.email || "");
      window.location.reload();
    } catch (error) {
      setIsApproving(false);
      alert("Failed to approve payment: " + (error instanceof Error ? error.message : error));
    }
  };

  const handleReject = async () => {
    if (!payment) return;
    const comments = window.prompt("Enter rejection reason (optional):", "");
    setIsRejecting(true);
    try {
      await paymentService.updatePaymentStatus(payment.id, "Rejected", user?.email || "", comments || undefined);
      window.location.reload();
    } catch (error) {
      setIsRejecting(false);
      alert("Failed to reject payment: " + (error instanceof Error ? error.message : error));
    }
  };

  if (!canViewPayments) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to view payment details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Payment not found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = canEditPayments && payment.status === "Created";

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/finance/payments")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{payment.paymentNumber}</h1>
              <p className="text-muted-foreground">Payment Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(payment.status)} className="text-sm">
              {payment.status}
            </Badge>
            {canEditPayments && payment.status === "Created" && (
              <Button 
                onClick={() => navigate(`/finance/payments/${payment.id}/edit`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Payment Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Payment Date
                </div>
                <div className="text-lg font-semibold">
                  {format(new Date(payment.paymentDate), "dd MMMM yyyy")}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Payment Type
                </div>
                <div className="text-lg font-semibold">{payment.paymentType}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Amount
                </div>
                <div className="text-lg font-semibold">
                  {payment.currency} {Number(payment.amount).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  Payment Mode
                </div>
                <div className="text-lg font-semibold">{payment.paymentMode}</div>
              </div>

              {payment.referenceNumber && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    Reference Number
                  </div>
                  <div className="text-lg font-semibold">{payment.referenceNumber}</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building className="h-4 w-4" />
                  Division
                </div>
                <div className="text-lg font-semibold">{payment.division?.name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Payee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-semibold">{payment.payeeOrganization?.name}</div>
              <div className="text-sm text-muted-foreground">Organization ID: {payment.payeeOrganizationId}</div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Invoice Information */}
        {payment.linkedInvoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Linked Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-lg font-semibold">
                  Invoice Number: {payment.linkedInvoice.invoiceNumber || "-"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Invoice Value: {payment.linkedInvoice.totalInvoiceValue != null
                    ? payment.currency + " " + Number(payment.linkedInvoice.totalInvoiceValue).toLocaleString()
                    : "-"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {!payment.linkedInvoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Linked Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-lg font-semibold">Invoice Number: -</div>
                <div className="text-sm text-muted-foreground">Invoice Value: -</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {payment.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{payment.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Creation entry */}
              <div className="flex items-start gap-4 pb-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Payment Created</p>
                      <p className="text-sm text-muted-foreground">
                        Created by {payment.createdBy}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(payment.createdOn, "dd/MM/yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit log entries */}
              {auditLogs.map((log, index) => (
                <div key={log.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            Status changed from {log.oldStatus || "Created"} to {log.newStatus}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Changed by {log.changedBy}
                          </p>
                          {log.comments && (
                            <p className="text-sm text-muted-foreground mt-1">
                              "{log.comments}"
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(log.changedOn, "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Last updated */}
              {payment.updatedOn && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Payment Updated</p>
                          <p className="text-sm text-muted-foreground">
                            Updated by {payment.updatedBy}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(payment.updatedOn, "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}