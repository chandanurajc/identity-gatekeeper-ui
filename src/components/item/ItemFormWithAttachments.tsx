
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ItemForm from "./ItemForm";
import { ItemAttachmentsTab } from "./ItemAttachmentsTab";
import { ItemFormData } from "@/types/item";

interface ItemFormWithAttachmentsProps {
  initialData?: ItemFormData;
  onSubmit: (data: ItemFormData) => Promise<any>;
  onCancel: () => void;
  readonly?: boolean;
  mode: 'create' | 'edit' | 'view';
}

export function ItemFormWithAttachments({
  initialData,
  onSubmit,
  onCancel,
  readonly = false,
  mode
}: ItemFormWithAttachmentsProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [itemId, setItemId] = useState<string | undefined>(initialData?.id);

  const handleSubmit = async (data: ItemFormData) => {
    const result = await onSubmit(data);
    // If this is a create operation and we get an ID back, set it for the attachments tab
    if (mode === 'create' && result?.id) {
      data.id = result.id;
      setItemId(result.id);
      setActiveTab("attachments");
    }
  };

  const showAttachmentsTab = mode !== 'create' || itemId;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Item Details</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="attachments" disabled={!showAttachmentsTab}>
          Attachments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6">
        <ItemForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      </TabsContent>

      <TabsContent value="pricing" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Pricing Information</h3>
          <p className="text-sm text-muted-foreground">
            Configure pricing details for different sales channels and supplier costs.
          </p>
          {/* Pricing content will be implemented here */}
        </div>
      </TabsContent>

      {showAttachmentsTab && (
        <TabsContent value="attachments" className="mt-6">
          <ItemAttachmentsTab 
            itemId={itemId!} 
            readonly={readonly}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
