
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
  const [activeTab, setActiveTab] = useState("basic");
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
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="physical">Physical Properties</TabsTrigger>
        <TabsTrigger value="costs">Costs</TabsTrigger>
        <TabsTrigger value="prices">Prices</TabsTrigger>
        <TabsTrigger value="attachments" disabled={!showAttachmentsTab}>
          Attachments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-6">
        <ItemForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          activeSection="basic"
        />
      </TabsContent>

      <TabsContent value="physical" className="mt-6">
        <ItemForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          activeSection="physical"
        />
      </TabsContent>

      <TabsContent value="costs" className="mt-6">
        <ItemForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          activeSection="costs"
        />
      </TabsContent>

      <TabsContent value="prices" className="mt-6">
        <ItemForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          activeSection="prices"
        />
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
