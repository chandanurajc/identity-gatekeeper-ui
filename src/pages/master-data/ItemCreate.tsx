
import React from "react";
import { useNavigate } from "react-router-dom";
import { ItemFormData } from "@/types/item";
import { itemService } from "@/services/itemService";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { useAuth } from "@/context/AuthContext";
import { ItemFormWithAttachments } from "@/components/item/ItemFormWithAttachments";

const ItemCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateItem } = useItemPermissions();

  const handleSubmit = async (formData: ItemFormData) => {
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const result = await itemService.createItem(formData, user.email);
    // Set the ID on the form data so the attachments tab can be enabled
    formData.id = result.id;
    return result;
  };

  const handleCancel = () => {
    navigate("/master-data/items");
  };

  if (!canCreateItem) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to create items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Item</h1>
        <p className="text-muted-foreground">Add a new item to the system</p>
      </div>

      <ItemFormWithAttachments
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode="create"
      />
    </div>
  );
};

export default ItemCreate;
