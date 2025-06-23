
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFormData, ItemPriceFormData } from "@/types/item";
import { SalesChannel } from "@/types/salesChannel";
import { Plus, Trash2 } from "lucide-react";

interface PricesSectionProps {
  formData: ItemFormData;
  salesChannels: SalesChannel[];
  onPriceAdd: () => void;
  onPriceRemove: (index: number) => void;
  onPriceUpdate: (index: number, field: keyof ItemPriceFormData, value: any) => void;
}

export const PricesSection = ({
  formData,
  salesChannels,
  onPriceAdd,
  onPriceRemove,
  onPriceUpdate
}: PricesSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Sales Channel Prices
          <Button type="button" onClick={onPriceAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Price
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.prices.map((price, index) => (
          <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter price"
                value={price.price || ""}
                onChange={(e) => onPriceUpdate(index, "price", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Sales Channel (Optional)</Label>
              <Select 
                value={price.salesChannelId || ""} 
                onValueChange={(value) => onPriceUpdate(index, "salesChannelId", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel or leave blank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default price (no channel)</SelectItem>
                  {salesChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPriceRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {formData.prices.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No sales channel prices added yet. Click "Add Price" to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
