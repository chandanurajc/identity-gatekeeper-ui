import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, ArrowLeft, XCircle, Plus, Building2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPurchaseOrderById } from "@/services/purchaseOrder/queries";
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
    if (id && canEditPurchaseOrder && user?.organizationId) {
      fetchPurchaseOrder();
    }
  }, [id, canEditPurchaseOrder, user?.organizationId]);

  const fetchPurchaseOrder = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getPurchaseOrderById(id);
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
      // await purchaseOrderService.cancelPurchaseOrder(id, user.id); // This line was removed as per the new_code
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
      // Navigate to invoice creation page with PO data
      navigate(`/finance/invoices/create?source=po&poId=${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to navigate to invoice creation.",
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
    if (!purchaseOrder?.lines) return { itemTotal: 0, totalGST: 0, grandTotal: 0, totalWeight: 0 };
    
    const itemTotal = purchaseOrder.lines.reduce((sum, line) => sum + line.totalUnitPrice, 0);
    const totalGST = purchaseOrder.lines.reduce((sum, line) => sum + line.gstValue, 0);
    const grandTotal = itemTotal + totalGST;
    const totalWeight = purchaseOrder.lines.reduce((sum, line) => sum + (line.totalLineWeight || 0), 0);
    
    return { itemTotal, totalGST, grandTotal, totalWeight };
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

  const { itemTotal, totalGST, grandTotal, totalWeight } = calculateSummary();

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
              <p className="text-sm text-muted-foreground">
                {purchaseOrder.poDate ? format(new Date(purchaseOrder.poDate), "dd/MM/yyyy") : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">PO Type</p>
              <p className="text-sm text-muted-foreground">{purchaseOrder.poType || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Requested Delivery Date</p>
              <p className="text-sm text-muted-foreground">
                {purchaseOrder.requestedDeliveryDate 
                  ? format(new Date(purchaseOrder.requestedDeliveryDate), "dd/MM/yyyy") 
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

      {/* Parties Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bill To */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Bill To
          </h3>
          <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
            {purchaseOrder.billToName && <div className="font-medium">{purchaseOrder.billToName}</div>}
            {purchaseOrder.billToAddress1 && <div>{purchaseOrder.billToAddress1}</div>}
            {purchaseOrder.billToAddress2 && <div>{purchaseOrder.billToAddress2}</div>}
            {(purchaseOrder.billToCity || purchaseOrder.billToState || purchaseOrder.billToPostalCode) && (
              <div>
                {[purchaseOrder.billToCity, purchaseOrder.billToState, purchaseOrder.billToPostalCode].filter(Boolean).join(', ')}
              </div>
            )}
            {purchaseOrder.billToCountry && <div>{purchaseOrder.billToCountry}</div>}
            {purchaseOrder.billToEmail && <div className="text-muted-foreground">{purchaseOrder.billToEmail}</div>}
            {purchaseOrder.billToPhone && <div className="text-muted-foreground">{purchaseOrder.billToPhone}</div>}
            {purchaseOrder.billToGstin && <div className="text-xs text-muted-foreground">GSTIN: {purchaseOrder.billToGstin}</div>}
            {purchaseOrder.billToCin && <div className="text-xs text-muted-foreground">CIN: {purchaseOrder.billToCin}</div>}
          </div>
        </div>

        {/* Remit To */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Remit To
          </h3>
          <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
            {purchaseOrder.remitToName && <div className="font-medium">{purchaseOrder.remitToName}</div>}
            {purchaseOrder.remitToAddress1 && <div>{purchaseOrder.remitToAddress1}</div>}
            {purchaseOrder.remitToAddress2 && <div>{purchaseOrder.remitToAddress2}</div>}
            {(purchaseOrder.remitToCity || purchaseOrder.remitToState || purchaseOrder.remitToPostalCode) && (
              <div>
                {[purchaseOrder.remitToCity, purchaseOrder.remitToState, purchaseOrder.remitToPostalCode].filter(Boolean).join(', ')}
              </div>
            )}
            {purchaseOrder.remitToCountry && <div>{purchaseOrder.remitToCountry}</div>}
            {purchaseOrder.remitToEmail && <div className="text-muted-foreground">{purchaseOrder.remitToEmail}</div>}
            {purchaseOrder.remitToPhone && <div className="text-muted-foreground">{purchaseOrder.remitToPhone}</div>}
            {purchaseOrder.remitToGstin && <div className="text-xs text-muted-foreground">GSTIN: {purchaseOrder.remitToGstin}</div>}
            {purchaseOrder.remitToCin && <div className="text-xs text-muted-foreground">CIN: {purchaseOrder.remitToCin}</div>}
          </div>
        </div>

        {/* Ship To */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ship To
          </h3>
          <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
            {purchaseOrder.shipToAddress1 && <div>{purchaseOrder.shipToAddress1}</div>}
            {purchaseOrder.shipToAddress2 && <div>{purchaseOrder.shipToAddress2}</div>}
            {(purchaseOrder.shipToCity || purchaseOrder.shipToState || purchaseOrder.shipToPostalCode) && (
              <div>
                {[purchaseOrder.shipToCity, purchaseOrder.shipToState, purchaseOrder.shipToPostalCode].filter(Boolean).join(', ')}
              </div>
            )}
            {purchaseOrder.shipToCountry && <div>{purchaseOrder.shipToCountry}</div>}
            {purchaseOrder.shipToPhone && <div className="text-muted-foreground">{purchaseOrder.shipToPhone}</div>}
            {purchaseOrder.shipToEmail && <div className="text-muted-foreground">{purchaseOrder.shipToEmail}</div>}
          </div>
        </div>
      </div>

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
                  <TableHead>Item ID</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Received Qty</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Weight/Unit</TableHead>
                  <TableHead>Total Weight</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Unit Price</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>GST Value</TableHead>
                  <TableHead>Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder?.lines && purchaseOrder.lines.length > 0 ? (
                  purchaseOrder.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.lineNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{line.itemId}</TableCell>
                      <TableCell>
                        <p className="font-medium">{line.item?.description || 'No description available'}</p>
                      </TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell>{line.receivedQuantity || 0}</TableCell>
                      <TableCell>{line.uom}</TableCell>
                      <TableCell>
                        {line.itemWeightPerUnit ? `${line.itemWeightPerUnit.toFixed(2)} ${line.itemWeightUom || 'kg'}` : '-'}
                      </TableCell>
                      <TableCell>
                        {line.totalLineWeight ? `${line.totalLineWeight.toFixed(2)} ${line.itemWeightUom || 'kg'}` : '-'}
                      </TableCell>
                      <TableCell>₹{line.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>₹{line.totalUnitPrice.toFixed(2)}</TableCell>
                      <TableCell>{line.gstPercent}%</TableCell>
                      <TableCell>₹{line.gstValue.toFixed(2)}</TableCell>
                      <TableCell>₹{line.lineTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground">
                      No line items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* GST Breakdown Section */}
          {purchaseOrder?.gstBreakdown && purchaseOrder.gstBreakdown.length > 0 && (
            <div className="mt-6">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg">GST Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GST %</TableHead>
                        <TableHead>Taxable Amount</TableHead>
                        <TableHead>CGST %</TableHead>
                        <TableHead>CGST Amount</TableHead>
                        <TableHead>SGST %</TableHead>
                        <TableHead>SGST Amount</TableHead>
                        <TableHead>IGST %</TableHead>
                        <TableHead>IGST Amount</TableHead>
                        <TableHead>Total GST</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrder.gstBreakdown.map((gst, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{gst.gstPercentage}</TableCell>
                          <TableCell>₹{gst.taxableAmount.toFixed(2)}</TableCell>
                          <TableCell>{gst.cgstPercentage}</TableCell>
                          <TableCell>₹{gst.cgstAmount.toFixed(2)}</TableCell>
                          <TableCell>{gst.sgstPercentage}</TableCell>
                          <TableCell>₹{gst.sgstAmount.toFixed(2)}</TableCell>
                          <TableCell>{gst.igstPercentage}</TableCell>
                          <TableCell>₹{gst.igstAmount.toFixed(2)}</TableCell>
                          <TableCell>₹{gst.totalGstAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary */}
          {purchaseOrder?.lines && purchaseOrder.lines.length > 0 && (
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
                    <div className="flex justify-between">
                      <span>Total Weight:</span>
                      <span>{totalWeight.toFixed(2)} kg</span>
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
                {purchaseOrder.createdOn ? format(new Date(purchaseOrder.createdOn), "dd/MM/yyyy HH:mm") : "Not specified"}
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
                  {purchaseOrder.updatedOn ? format(new Date(purchaseOrder.updatedOn), "dd/MM/yyyy HH:mm") : "Not specified"}
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