import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { POReceiveFormData, PurchaseOrder, POReceiveLineData } from "@/types/purchaseOrder";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { POReceiveLinesSection } from "./POReceiveLinesSection";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useAuth } from "@/context/AuthContext";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";

interface POReceiveFormProps {
  purchaseOrder: PurchaseOrder;
}

interface ReceivePOVariables {
    poId: string;
    linesToReceive: POReceiveLineData[];
    organizationId: string;
    userId: string;
}

interface ReceivePOResponse {
  warning?: string;
}

const receiveSchema = z.object({
  poId: z.string(),
  lines: z.array(z.object({
      purchaseOrderLineId: z.string(),
      itemId: z.string(),
      itemDescription: z.string(),
      orderedQuantity: z.number(),
      totalReceivedQuantity: z.number(),
      quantityToReceive: z.coerce.number().min(0, "Cannot be negative").default(0),
      uom: z.string(),
      lineNumber: z.number(),
    })
  ).refine(
    (lines) => lines.some(line => line.quantityToReceive > 0), 
    { message: "You must receive at least one item." }
  ).refine(
    (lines) => lines.every(line => line.quantityToReceive <= (line.orderedQuantity - line.totalReceivedQuantity)),
    { message: "Cannot receive more than remaining quantity." } // This is a line-level check, but a global refine is a fallback
  ),
});

export function POReceiveForm({ purchaseOrder }: POReceiveFormProps) {
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<POReceiveFormData>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      poId: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
      supplierName: purchaseOrder.supplier?.name || "N/A",
      poDate: purchaseOrder.poDate,
      divisionName: purchaseOrder.division?.name || "N/A",
      lines: purchaseOrder.lines?.map(line => ({
        purchaseOrderLineId: line.id!,
        itemId: line.itemId,
        itemDescription: line.item?.description || "N/A",
        orderedQuantity: line.quantity,
        totalReceivedQuantity: line.receivedQuantity || 0,
        quantityToReceive: 0,
        uom: line.uom,
        lineNumber: line.lineNumber,
      })) || [],
    },
  });

  const { mutate: receivePO, isPending } = useMutation<ReceivePOResponse, Error, ReceivePOVariables>({
    mutationFn: ({ poId, linesToReceive, organizationId, userId }) => 
      purchaseOrderService.receivePurchaseOrder( poId, linesToReceive, organizationId, userId ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", purchaseOrder.id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      if (data?.warning) {
        toast.warning("PO Received with a Warning", {
          description: data.warning,
          duration: 10000,
        });
      } else {
        toast.success("Purchase Order received successfully.");
      }
      
      navigate("/order-management/po-receive"); // Redirect to PO receive list after receive
    },
    onError: (error) => {
      toast.error("Failed to receive Purchase Order", {
        description: error.message,
      });
    },
  });
  
  const onSubmit = (data: POReceiveFormData) => {
    const organizationId = getCurrentOrganizationId();
    if (!user || !organizationId) {
        toast.error("Error", { description: "User or organization not found." });
        return;
    }
    const linesToReceive = data.lines.filter(l => l.quantityToReceive > 0);
    receivePO({ poId: data.poId, linesToReceive, organizationId, userId: user.id });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Receive Purchase Order: {purchaseOrder.poNumber}</CardTitle>
                <CardDescription>
                    Enter the quantities received for each line item.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Supplier</Label>
                    <p className="text-sm text-muted-foreground">{purchaseOrder.supplier?.name}</p>
                </div>
                <div className="space-y-2">
                    <Label>PO Date</Label>
                    <p className="text-sm text-muted-foreground">{new Date(purchaseOrder.poDate).toLocaleDateString()}</p>
                </div>
                 <div className="space-y-2">
                    <Label>Division</Label>
                    <p className="text-sm text-muted-foreground">{purchaseOrder.division?.name}</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Shipping Address</Label>
                    <p className="text-sm text-muted-foreground">
                        {purchaseOrder.shipToAddress1}, {purchaseOrder.shipToCity}, {purchaseOrder.shipToState} {purchaseOrder.shipToPostalCode}
                    </p>
                </div>
            </CardContent>
        </Card>
        
        <POReceiveLinesSection />
        
        <CardFooter>
            <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => navigate(-1)} type="button">Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Submitting..." : "Submit Receipt"}
                </Button>
            </div>
        </CardFooter>
      </form>
    </Form>
  );
}
