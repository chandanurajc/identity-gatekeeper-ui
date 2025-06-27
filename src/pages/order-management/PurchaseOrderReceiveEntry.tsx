
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { POReceiveForm } from "@/components/purchase-order/POReceiveForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useMultiTenant } from "@/hooks/useMultiTenant";

export default function PurchaseOrderReceiveEntry() {
  const { id } = useParams<{ id: string }>();
  const { getCurrentOrganizationId } = useMultiTenant();

  const { data: purchaseOrder, isLoading, error, isError } = useQuery({
    queryKey: ["purchaseOrder", id],
    queryFn: () => {
      const organizationId = getCurrentOrganizationId();
      if (!organizationId) throw new Error("Organization not found");
      return purchaseOrderService.getPurchaseOrderById(id!, organizationId);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-32 ml-auto" />
        </div>
    );
  }

  if (isError) {
    return (
        <div className="p-4">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        </div>
    );
  }

  if (!purchaseOrder) {
    return <div className="p-4">Purchase order not found.</div>;
  }
  
  if (purchaseOrder.status === 'Received') {
    return (
        <div className="p-4">
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Already Received</AlertTitle>
                <AlertDescription>This purchase order has already been fully received.</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <POReceiveForm purchaseOrder={purchaseOrder} />
    </div>
  );
}
