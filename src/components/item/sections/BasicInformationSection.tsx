
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFormData } from "@/types/item";
import { ItemGroup } from "@/types/itemGroup";

interface BasicInformationSectionProps {
  formData: ItemFormData;
  itemGroups: ItemGroup[];
  isEdit: boolean;
  onInputChange: (field: keyof ItemFormData, value: any) => void;
  onItemGroupChange: (itemGroupId: string) => void;
}

const GST_PERCENTAGES = [
  { value: 0, label: "0%" },
  { value: 5, label: "5%" },
  { value: 8, label: "8%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18%" },
  { value: 28, label: "28%" },
];

const UOM_OPTIONS = [
  { value: "Unit", label: "Unit" },
  { value: "Kilograms", label: "Kilograms" },
  { value: "Box", label: "Box" },
  { value: "Length", label: "Length" },
  { value: "Grams", label: "Grams" },
  { value: "Litres", label: "Litres" },
];

export const BasicInformationSection = ({
  formData,
  itemGroups,
  isEdit,
  onInputChange,
  onItemGroupChange
}: BasicInformationSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="id">Item ID</Label>
          <Input
            id="id"
            value={formData.id || ""}
            onChange={(e) => onInputChange("id", e.target.value)}
            placeholder={isEdit ? "Item ID (read-only)" : "Auto-generated if empty"}
            disabled={isEdit}
            className={isEdit ? "bg-gray-100" : ""}
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="itemGroup">Item Group</Label>
          <Select 
            value={formData.itemGroupId || ""} 
            onValueChange={onItemGroupChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select item group" />
            </SelectTrigger>
            <SelectContent>
              {itemGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="classification">Classification *</Label>
          <Input
            id="classification"
            value={formData.classification}
            onChange={(e) => onInputChange("classification", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="subClassification">Sub-Classification *</Label>
          <Input
            id="subClassification"
            value={formData.subClassification}
            onChange={(e) => onInputChange("subClassification", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: "active" | "inactive") => onInputChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="gstPercentage">GST Percentage *</Label>
          <Select 
            value={formData.gstPercentage.toString()} 
            onValueChange={(value) => onInputChange("gstPercentage", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GST_PERCENTAGES.map((gst) => (
                <SelectItem key={gst.value} value={gst.value.toString()}>
                  {gst.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="uom">Unit of Measure (UOM) *</Label>
          <Select 
            value={formData.uom} 
            onValueChange={(value) => onInputChange("uom", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UOM_OPTIONS.map((uom) => (
                <SelectItem key={uom.value} value={uom.value}>
                  {uom.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            id="barcode"
            value={formData.barcode || ""}
            onChange={(e) => onInputChange("barcode", e.target.value)}
            placeholder="Auto-generated if empty"
          />
        </div>
      </CardContent>
    </Card>
  );
};
