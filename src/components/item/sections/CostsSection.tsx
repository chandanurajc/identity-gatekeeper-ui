
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFormData, ItemCostFormData } from "@/types/item";
import { Organization } from "@/types/organization";
import { Plus, Trash2 } from "lucide-react";

interface CostsSectionProps {
  formData: ItemFormData;
  suppliers: Organization[];
  onCostAdd: () => void;
  onCostRemove: (index: number) => void;
  onCostUpdate: (index: number, field: keyof ItemCostFormData, value: any) => void;
}

export const CostsSection = ({
  formData,
  suppliers,
  onCostAdd,
  onCostRemove,
  onCostUpdate
}: CostsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supplier Costs
          <Button type="button" onClick={onCostAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Cost
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.costs.map((cost, index) => (
          <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <Label>Cost (₹)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter cost"
                value={cost.cost || ""}
                onChange={(e) => onCostUpdate(index, "cost", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Supplier (Optional)</Label>
              <Select 
                value={cost.supplierId || ""} 
                onValueChange={(value) => onCostUpdate(index, "supplierId", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier or leave blank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCostRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {formData.costs.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No supplier costs added yet. Click "Add Cost" to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
