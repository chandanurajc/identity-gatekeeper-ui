
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFormData } from "@/types/item";

interface PhysicalPropertiesSectionProps {
  formData: ItemFormData;
  onInputChange: (field: keyof ItemFormData, value: any) => void;
}

const WEIGHT_UOM_OPTIONS = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
];

export const PhysicalPropertiesSection = ({
  formData,
  onInputChange
}: PhysicalPropertiesSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Physical Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="length">Length (cm)</Label>
            <Input
              id="length"
              type="number"
              step="0.01"
              value={formData.length || ""}
              onChange={(e) => onInputChange("length", parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div>
            <Label htmlFor="width">Width (cm)</Label>
            <Input
              id="width"
              type="number"
              step="0.01"
              value={formData.width || ""}
              onChange={(e) => onInputChange("width", parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.01"
              value={formData.height || ""}
              onChange={(e) => onInputChange("height", parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                step="0.001"
                value={formData.weight || ""}
                onChange={(e) => onInputChange("weight", parseFloat(e.target.value) || undefined)}
                placeholder="Enter weight"
                className="flex-1"
              />
              <Select 
                value={formData.weightUom || "kg"} 
                onValueChange={(value: "g" | "kg") => onInputChange("weightUom", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_UOM_OPTIONS.map((uom) => (
                    <SelectItem key={uom.value} value={uom.value}>
                      {uom.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
