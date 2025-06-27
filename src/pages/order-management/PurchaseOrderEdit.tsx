
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { PurchaseOrderFormData, PurchaseOrder } from "@/types/purchaseOrder";
import PurchaseOrderForm from "@/components/purchase-order/PurchaseOrderForm";

const PurchaseOrderEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { user } = useAuth();
  const { canEditPurchaseOrder } = usePurchaseOrderPermissions();
  
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && canEditPurchaseOrder) {
      fetchPurchaseOrder();
    }
  }, [id, canEditPurchaseOrder]);

  const fetchPurchaseOrder = async () => {
    if (!id) return;
    
    const organizationId = getCurrentOrganizationId();
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const data = await purchaseOrderService.getPurchaseOrderById(id, organizationId);
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

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    const organizationId = getCurrentOrganizationId();
    if (!organizationId || !user?.id || !id) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedPO = await purchaseOrderService.updatePurchaseOrder(
        id, 
        data, 
        organizationId, 
        user.id
      );
      
      toast({
        title: "Success",
        description: `Purchase Order ${updatedPO.poNumber} updated successfully`,
      });
      
      navigate(`/order-management/purchase-orders/${id}`);
    } catch (error) {
      console.error("Error updating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to update purchase order",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate(`/order-management/purchase-orders/${id}`);
  };

  const convertToFormData = (po: PurchaseOrder): PurchaseOrderFormData => {
    return {
      poNumber: po.poNumber,
      divisionId: po.divisionId,
      supplierId: po.supplierId,
      poDate: po.poDate,
      requestedDeliveryDate: po.requestedDeliveryDate,
      sameAsDivisionAddress: false,
      shipToAddress1: po.shipToAddress1 || "",
      shipToAddress2: po.shipToAddress2,
      shipToPostalCode: po.shipToPostalCode || "",
      shipToCity: po.shipToCity || "",
      shipToState: po.shipToState || "",
      shipToCountry: po.shipToCountry || "",
      shipToPhone: po.shipToPhone || "",
      shipToEmail: po.shipToEmail || "",
      paymentTerms: po.paymentTerms,
      notes: po.notes,
      trackingNumber: po.trackingNumber,
      lines: po.lines || []
    };
  };

  if (!canEditPurchaseOrder) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to edit purchase orders.
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
            <p className="text-center">Loading purchase order...</p>
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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Purchase Order {purchaseOrder.poNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            initialData={convertToFormData(purchaseOrder)}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderEdit;
