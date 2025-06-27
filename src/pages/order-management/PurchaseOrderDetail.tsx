
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";

const PurchaseOrderDetail = () => {
  const { poId } = useParams<{ poId: string }>();
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
    mutationFn: () => purchaseOrderService.cancelPurchaseOrder(poId!, organizationId!, user!.id, user!.email!),
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

  if (isLoading) return <div>Loading purchase order details...</div>;
  if (error) return <div>Error fetching purchase order: {error.message}</div>;
  if (!purchaseOrder) return <div>Purchase order not found.</div>;

  const totalAmount = purchaseOrder.lines?.reduce((sum, line) => sum + line.line_total, 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Purchase Order {purchaseOrder.po_number}</CardTitle>
              <CardDescription>
                {purchaseOrder.supplier?.name && `Supplier: ${purchaseOrder.supplier.name}`}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{purchaseOrder.status}</div>
              <div className="text-sm text-muted-foreground">
                Created: {format(new Date(purchaseOrder.created_on), 'PPP')}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span>{format(new Date(purchaseOrder.po_date), 'PPP')}</span>
                </div>
                {purchaseOrder.requested_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested Delivery:</span>
                    <span>{format(new Date(purchaseOrder.requested_delivery_date), 'PPP')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Terms:</span>
                  <span>{purchaseOrder.payment_terms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
            
            {(purchaseOrder.ship_to_address_1 || purchaseOrder.ship_to_city) && (
              <div>
                <h3 className="font-semibold mb-2">Ship To Address</h3>
                <div className="text-sm space-y-1">
                  {purchaseOrder.ship_to_address_1 && <p>{purchaseOrder.ship_to_address_1}</p>}
                  {purchaseOrder.ship_to_address_2 && <p>{purchaseOrder.ship_to_address_2}</p>}
                  {purchaseOrder.ship_to_city && (
                    <p>
                      {purchaseOrder.ship_to_city}
                      {purchaseOrder.ship_to_state && `, ${purchaseOrder.ship_to_state}`}
                      {purchaseOrder.ship_to_postal_code && ` ${purchaseOrder.ship_to_postal_code}`}
                    </p>
                  )}
                  {purchaseOrder.ship_to_country && <p>{purchaseOrder.ship_to_country}</p>}
                </div>
              </div>
            )}
          </div>
          
          {purchaseOrder.notes && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          {purchaseOrder.status === 'Created' && canApprovePO && (
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          )}
          {purchaseOrder.status !== 'Cancelled' && canCancelPO && (
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
            Back to List
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Order Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item ID</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrder?.lines?.map((line) => (
                  <tr key={line.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{line.line_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{line.item_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{line.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{line.uom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(line.unit_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(line.total_unit_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{line.gst_percent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(line.line_total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{line.received_quantity || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;
