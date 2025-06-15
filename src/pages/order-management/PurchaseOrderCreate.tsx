
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { PurchaseOrderFormData } from "@/types/purchaseOrder";
import PurchaseOrderForm from "@/components/purchase-order/PurchaseOrderForm";

const PurchaseOrderCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization } = useMultiTenant();
  const { user } = useAuth();
  const { canCreatePurchaseOrder } = usePurchaseOrderPermissions();

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    if (!currentOrganization?.id || !user?.id) {
      toast({
        title: "Error",
        description: "Missing organization or user information",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdPO = await purchaseOrderService.createPurchaseOrder(
        data, 
        currentOrganization.id, 
        user.id
      );
      
      toast({
        title: "Success",
        description: `Purchase Order ${createdPO.poNumber} created successfully`,
      });
      
      navigate("/order-management/purchase-orders");
    } catch (error: any) {
      // Extract and show a more informative error message, fallback to default.
      const message =
        (error && typeof error === "object" && ("message" in error) && error.message)
          ? error.message
          : "Failed to create purchase order. Please check required fields or try again later.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/order-management/purchase-orders");
  };

  if (!canCreatePurchaseOrder) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to create purchase orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderCreate;
