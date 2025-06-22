import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ItemFormData } from "@/types/item";
import { itemService } from "@/services/itemService";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { useAuth } from "@/context/AuthContext";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { ItemFormWithAttachments } from "@/components/item/ItemFormWithAttachments";

const ItemEdit = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canEditItem } = useItemPermissions();
  const { getCurrentOrganizationId } = useMultiTenant();

  const organizationId = getCurrentOrganizationId();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", itemId, organizationId],
    queryFn: () => itemService.getItemById(itemId!),
    enabled: !!itemId && !!organizationId,
  });

  const handleSubmit = async (formData: ItemFormData) => {
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    await itemService.updateItem(itemId!, formData, user.email);
    navigate("/master-data/items");
  };

  const handleCancel = () => {
    navigate("/master-data/items");
  };

  if (!canEditItem) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to edit items.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div>Loading item...</div>;
  if (error) return <div>Error loading item: {error.message}</div>;
  if (!item) return <div>Item not found</div>;

  const initialData: ItemFormData = {
    id: item.id,
    description: item.description,
    itemGroupId: item.itemGroupId,
    classification: item.classification,
    subClassification: item.subClassification,
    status: item.status,
    barcode: item.barcode,
    gstPercentage: item.gstPercentage,
    uom: item.uom,
    length: item.length,
    width: item.width,
    height: item.height,
    weight: item.weight,
    weightUom: item.weightUom,
    image: item.image,
    costs: item.costs?.map(cost => ({
      supplierId: cost.supplierId,
      cost: cost.cost
    })) || [],
    prices: item.prices?.map(price => ({
      salesChannelId: price.salesChannelId,
      price: price.price
    })) || []
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Item</h1>
        <p className="text-muted-foreground">Update item information</p>
      </div>

      <ItemFormWithAttachments
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode="edit"
      />
    </div>
  );
};

export default ItemEdit;
