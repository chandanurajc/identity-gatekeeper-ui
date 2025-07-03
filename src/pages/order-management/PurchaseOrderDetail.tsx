import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, Building2, MapPin, Phone, Mail, Package, Hash, Weight, CheckCircle, XCircle } from "lucide-react";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";

const statusColors: Record<string, string> = {
  Created: "bg-blue-100 text-blue-800",
  Approved: "bg-green-100 text-green-800",
  Received: "bg-purple-100 text-purple-800",
  "Partially Received": "bg-yellow-100 text-yellow-800",
  Cancelled: "bg-red-100 text-red-800",
};

const PurchaseOrderDetail = () => {
  const { id: poId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canApprovePO, canCancelPO } = usePurchaseOrderPermissions();

  const { data: purchaseOrder, isLoading, error } = useQuery({
    queryKey: ["purchaseOrder", poId, organizationId],
    queryFn: () => purchaseOrderService.getPurchaseOrderById(poId!, organizationId!),
    enabled: !!poId && !!organizationId,
  });

  const approveMutation = useMutation({
    mutationFn: () => purchaseOrderService.approvePurchaseOrder(poId!, organizationId!, user!.id, user!.email!),
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase Order approved successfully." });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error approving purchase order",
        description: error.message,
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrderService.cancelPurchaseOrder(poId!, organizationId!),
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase Order cancelled successfully." });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error cancelling purchase order",
        description: error.message,
      });
    },
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

  if (error || !purchaseOrder) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load purchase order details. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalAmount = purchaseOrder.lines?.reduce((sum, line) => sum + (line.lineTotal || 0), 0) || 0;
  const totalItems = purchaseOrder.lines?.length || 0;
  const totalQuantity = purchaseOrder.lines?.reduce((sum, line) => sum + (line.quantity || 0), 0) || 0;
  const totalReceivedQuantity = purchaseOrder.lines?.reduce((sum, line) => sum + (line.receivedQuantity || 0), 0) || 0;

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
          <Button variant="outline" size="icon" onClick={() => navigate("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <FileText className="h-8 w-8" />
              <span>{purchaseOrder.poNumber}</span>
            </h1>
            <p className="text-muted-foreground">Purchase Order Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={statusColors[purchaseOrder.status] || "bg-gray-100 text-gray-800"}>
            {purchaseOrder.status}
          </Badge>
          {purchaseOrder.status === 'Created' && canApprovePO && (
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          )}
          {purchaseOrder.status !== 'Cancelled' && canCancelPO && (
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              <XCircle className="h-4 w-4 mr-2" />
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/purchase-orders/${poId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {purchaseOrder.poDate ? format(new Date(purchaseOrder.poDate), 'PPP') : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {totalReceivedQuantity}/{totalQuantity}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalQuantity > 0 ? Math.round((totalReceivedQuantity / totalQuantity) * 100) : 0}% received
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Supplier Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Supplier Name" value={purchaseOrder.supplier?.name} icon={Building2} />
            <InfoRow label="Supplier Code" value={purchaseOrder.supplier?.code} icon={Hash} />
            <InfoRow label="Supplier Type" value={purchaseOrder.supplier?.type} />
            <InfoRow label="Status" value={purchaseOrder.supplier?.status} />
          </CardContent>
        </Card>

        {/* Division Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Division Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Division Name" value={purchaseOrder.division?.name} icon={Building2} />
            <InfoRow label="Division Code" value={purchaseOrder.division?.code} icon={Hash} />
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Order Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="PO Number" value={purchaseOrder.poNumber} icon={Hash} />
            <InfoRow label="Order Date" value={purchaseOrder.poDate ? format(new Date(purchaseOrder.poDate), 'PPP') : null} icon={Calendar} />
            <InfoRow label="Requested Delivery" value={purchaseOrder.requestedDeliveryDate ? format(new Date(purchaseOrder.requestedDeliveryDate), 'PPP') : null} icon={Calendar} />
            <InfoRow label="Payment Terms" value={purchaseOrder.paymentTerms} />
            <InfoRow label="Tracking Number" value={purchaseOrder.trackingNumber} />
          </CardContent>
        </Card>

        {/* Shipping Address */}
        {(purchaseOrder.shipToAddress1 || purchaseOrder.shipToCity) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Shipping Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="Address Line 1" value={purchaseOrder.shipToAddress1} icon={MapPin} />
              <InfoRow label="Address Line 2" value={purchaseOrder.shipToAddress2} icon={MapPin} />
              <InfoRow label="City" value={purchaseOrder.shipToCity} icon={MapPin} />
              <InfoRow label="State" value={purchaseOrder.shipToState} icon={MapPin} />
              <InfoRow label="Postal Code" value={purchaseOrder.shipToPostalCode} icon={MapPin} />
              <InfoRow label="Country" value={purchaseOrder.shipToCountry} />
              <InfoRow label="Phone" value={purchaseOrder.shipToPhone} icon={Phone} />
              <InfoRow label="Email" value={purchaseOrder.shipToEmail} icon={Mail} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Order Lines</span>
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">UOM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">GST %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">GST Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Received</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {purchaseOrder.lines?.map((line) => (
                  <tr key={line.id} className="hover:bg-muted/50">
                    <td className="px-4 py-4 whitespace-nowrap font-medium">{line.lineNumber || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{line.itemId || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">{line.quantity || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{line.uom || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      ₹{(line.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      ₹{(line.totalUnitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">{line.gstPercent || 0}%</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      ₹{(line.gstValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                      ₹{(line.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">{line.receivedQuantity || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{(totalAmount - (purchaseOrder.lines?.reduce((sum, line) => sum + (line.gstValue || 0), 0) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total GST:</span>
                  <span className="font-medium">₹{(purchaseOrder.lines?.reduce((sum, line) => sum + (line.gstValue || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {purchaseOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{purchaseOrder.notes}</p>
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
              <InfoRow label="Created By" value={purchaseOrder.createdBy} />
              <InfoRow label="Created On" value={purchaseOrder.createdOn ? purchaseOrder.createdOn.toLocaleString() : null} icon={Calendar} />
            </div>
            <div className="space-y-1">
              <InfoRow label="Updated By" value={purchaseOrder.updatedBy} />
              <InfoRow label="Updated On" value={purchaseOrder.updatedOn ? purchaseOrder.updatedOn.toLocaleString() : null} icon={Calendar} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;