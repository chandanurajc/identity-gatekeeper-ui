import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, ArrowLeft, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { invoiceService } from "@/services/invoiceService";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";
import { PurchaseOrder } from "@/types/purchaseOrder";
import { format } from "date-fns";
import PermissionButton from "@/components/PermissionButton";
import { useAuth } from "@/context/AuthContext";

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canEditPurchaseOrder } = usePurchaseOrderPermissions();
  
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    if (id && canEditPurchaseOrder) {
      fetchPurchaseOrder();
    }
  }, [id, canEditPurchaseOrder]);

  const fetchPurchaseOrder = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await purchaseOrderService.getPurchaseOrderById(id);
      if (data) {
        setPurchaseOrder(data);
      } else {
        toast({
          title: "Error",
          description: "Purchase order not found",
          variant: "destructive",
        });
        navigate("/order-management/purchase-orders");
      }
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPO = async () => {
    if (!id || !user) return;

    if (purchaseOrder?.status !== 'Created') {
      toast({
        title: "Action not allowed",
        description: "This purchase order cannot be cancelled as it's not in 'Created' status.",
        variant: "destructive",
      });
      return;
    }

    try {
      await purchaseOrderService.cancelPurchaseOrder(id, user.id);
      toast({
        title: "Success",
        description: "Purchase order has been cancelled.",
      });
      fetchPurchaseOrder(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel purchase order.",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = async () => {
    if (!id || !user || !purchaseOrder) return;

    setIsCreatingInvoice(true);
    try {
      const newInvoice = await invoiceService.createInvoiceFromReceivedPO(id, purchaseOrder.organizationId, user.id, user.email);
      toast({
        title: "Success",
        description: `Invoice ${newInvoice.invoice_number} has been created.`,
      });
      fetchPurchaseOrder(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Created": return "secondary";
      case "Approved": return "default";
      case "Received": return "default";
      case "Partially Received": return "outline";
      case "Cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const calculateSummary = () => {
    if (!purchaseOrder?.lines) return { itemTotal: 0, totalGST: 0, grandTotal: 0 };
    
    const itemTotal = purchaseOrder.lines.reduce((sum, line) => sum + line.totalUnitPrice, 0);
    const totalGST = purchaseOrder.lines.reduce((sum, line) => sum + line.gstValue, 0);
    const grandTotal = itemTotal + totalGST;
    
    return { itemTotal, totalGST, grandTotal };
  };

  if (!canEditPurchaseOrder) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to view or edit purchase orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading purchase order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Purchase order not found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { itemTotal, totalGST, grandTotal } = calculateSummary();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigate("/order-management/purchase-orders")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Button>
        <div className="flex items-center gap-2">
          {purchaseOrder.status === 'Received' && (
            <PermissionButton
              permission="Create Invoice"
              onClick={handleCreateInvoice}
              disabled={isCreatingInvoice}
              title="Create Invoice from this PO"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreatingInvoice ? 'Creating...' : 'Create Invoice'}
            </PermissionButton>
          )}
          {canEditPurchaseOrder && (
            <Button 
              onClick={() => navigate(`/order-management/purchase-orders/${id}/edit`)}
              disabled={purchaseOrder.status !== 'Created'}
              title={purchaseOrder.status !== 'Created' ? 'Can only edit POs with "Created" status' : ''}
              >
              <Edit className="mr-2 h-4 w-4" />
              Edit Purchase Order
            </Button>
          )}
          <PermissionButton
            permission="Cancel PO"
            onClick={handleCancelPO}
            disabled={purchaseOrder.status !== 'Created'}
            variant="destructive"
            title={purchaseOrder.status !== 'Created' ? 'Can only cancel POs with "Created" status' : ''}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel PO
          </PermissionButton>
        </div>
      </div>

      {/* Header Information */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Purchase Order {purchaseOrder.poNumber}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Status: <Badge variant={getStatusBadgeVariant(purchaseOrder.status)}>
                  {purchaseOrder.status}
                </Badge>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Division</p>
              <p className="text-sm text-muted-foreground">{purchaseOrder.division?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Supplier</p>
              <p className="text-sm text-muted-foreground">{purchaseOrder.supplier?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">PO Date</p>
              <p className="text-sm text-muted-foreground">{format(purchaseOrder.poDate, "dd/MM/yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Requested Delivery Date</p>
              <p className="text-sm text-muted-foreground">
                {purchaseOrder.requestedDeliveryDate 
                  ? format(purchaseOrder.requestedDeliveryDate, "dd/MM/yyyy") 
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Payment Terms</p>
              <p className="text-sm text-muted-foreground">{purchaseOrder.paymentTerms}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Tracking Number</p>
              <p className="text-sm text-muted-foreground">{purchaseOrder.trackingNumber || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-muted-foreground">
                {purchaseOrder.shipToAddress1}
                {purchaseOrder.shipToAddress2 && <><br />{purchaseOrder.shipToAddress2}</>}
                <br />
                {purchaseOrder.shipToCity}, {purchaseOrder.shipToState} {purchaseOrder.shipToPostalCode}
                <br />
                {purchaseOrder.shipToCountry}
              </p>
            </div>
            <div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{purchaseOrder.shipToPhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{purchaseOrder.shipToEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Order Lines */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line #</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Received Qty</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Unit Price</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>GST Value</TableHead>
                  <TableHead>Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.lines && purchaseOrder.lines.length > 0 ? (
                  purchaseOrder.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.lineNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{line.item?.description}</p>
                          <p className="text-xs text-muted-foreground">ID: {line.itemId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{line.item?.classification}</p>
                          <p className="text-muted-foreground">{line.item?.subClassification}</p>
                        </div>
                      </TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell>{line.receivedQuantity || 0}</TableCell>
                      <TableCell>{line.uom}</TableCell>
                      <TableCell>₹{line.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>₹{line.totalUnitPrice.toFixed(2)}</TableCell>
                      <TableCell>{line.gstPercent}%</TableCell>
                      <TableCell>₹{line.gstValue.toFixed(2)}</TableCell>
                      <TableCell>₹{line.lineTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No line items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {purchaseOrder.lines && purchaseOrder.lines.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Card className="w-80">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Item Total Price:</span>
                      <span>₹{itemTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total GST Value:</span>
                      <span>₹{totalGST.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Grand Total:</span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {purchaseOrder.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{purchaseOrder.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Created By</p>
              <p className="text-sm text-muted-foreground">{purchaseOrder.createdBy}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Created On</p>
              <p className="text-sm text-muted-foreground">
                {format(purchaseOrder.createdOn, "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {purchaseOrder.updatedBy && (
              <div>
                <p className="text-sm font-medium">Updated By</p>
                <p className="text-sm text-muted-foreground">{purchaseOrder.updatedBy}</p>
              </div>
            )}
            {purchaseOrder.updatedOn && (
              <div>
                <p className="text-sm font-medium">Updated On</p>
                <p className="text-sm text-muted-foreground">
                  {format(purchaseOrder.updatedOn, "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;
