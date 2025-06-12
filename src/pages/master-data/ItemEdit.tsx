
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Item, ItemFormData } from "@/types/item";
import { itemService } from "@/services/itemService";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { useAuth } from "@/context/AuthContext";
import ItemForm from "@/components/item/ItemForm";
import { toast } from "sonner";

const ItemEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canEditItem } = useItemPermissions();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canEditItem && id) {
      fetchItem();
    } else {
      setLoading(false);
    }
  }, [canEditItem, id]);

  const fetchItem = async () => {
    if (!id) return;
    
    try {
      const itemData = await itemService.getItemById(id);
      if (itemData) {
        setItem(itemData);
      } else {
        toast.error("Item not found");
        navigate("/master-data/items");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      toast.error("Failed to fetch item");
      navigate("/master-data/items");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: ItemFormData) => {
    if (!user?.email || !id) {
      throw new Error("User not authenticated or item ID missing");
    }

    await itemService.updateItem(id, formData, user.email);
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">Loading item...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Item Not Found</h2>
          <p>The requested item could not be found.</p>
        </div>
      </div>
    );
  }

  const initialData: ItemFormData = {
    id: item.id,
    description: item.description,
    itemGroupId: item.itemGroupId,
    classification: item.classification,
    subClassification: item.subClassification,
    status: item.status,
    barcode: item.barcode,
    gstPercentage: item.gstPercentage || 0,
    uom: item.uom || "Unit",
    length: item.length,
    width: item.width,
    height: item.height,
    weight: item.weight,
    costs: item.costs?.map(cost => ({
      supplierId: cost.supplierId,
      price: cost.price,
    })) || [],
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Item</h1>
        <p className="text-muted-foreground">Update item information</p>
      </div>

      <ItemForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEdit={true}
      />
    </div>
  );
};

export default ItemEdit;
