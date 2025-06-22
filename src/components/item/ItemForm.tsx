import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFormData, ItemCostFormData, ItemPriceFormData } from "@/types/item";
import { ItemGroup } from "@/types/itemGroup";
import { SalesChannel } from "@/types/salesChannel";
import { Organization } from "@/types/organization";
import { itemGroupService } from "@/services/itemGroupService";
import { salesChannelService } from "@/services/salesChannelService";
import { partnerSupplierService } from "@/services/partnerSupplierService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ItemFormProps {
  initialData?: ItemFormData;
  onSubmit: (data: ItemFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  activeSection?: string;
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

const WEIGHT_UOM_OPTIONS = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
];

const ItemForm = ({ initialData, onSubmit, onCancel, isEdit = false, activeSection }: ItemFormProps) => {
  const [formData, setFormData] = useState<ItemFormData>({
    description: "",
    classification: "",
    subClassification: "",
    status: "active",
    gstPercentage: 0,
    uom: "Unit",
    costs: [],
    prices: [],
    ...initialData,
  });
  
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [suppliers, setSuppliers] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const { getCurrentOrganizationId } = useMultiTenant();

  useEffect(() => {
    fetchSelectData();
  }, []);

  const fetchSelectData = async () => {
    try {
      const currentOrganizationId = getCurrentOrganizationId();
      if (!currentOrganizationId) {
        console.error("No current organization ID found");
        setLoadingData(false);
        return;
      }

      const [itemGroupsData, salesChannelsData, suppliersData] = await Promise.all([
        itemGroupService.getItemGroups(),
        salesChannelService.getActiveSalesChannels(),
        partnerSupplierService.getPartnerSuppliers(currentOrganizationId),
      ]);
      
      setItemGroups(itemGroupsData.filter(ig => ig.status === 'active'));
      setSalesChannels(salesChannelsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("ItemForm: Error fetching select data:", error);
      toast.error("Failed to load form data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.description.trim()) {
        toast.error("Description is required");
        return;
      }
      
      if (!formData.classification.trim()) {
        toast.error("Classification is required");
        return;
      }
      
      if (!formData.subClassification.trim()) {
        toast.error("Sub-classification is required");
        return;
      }

      const filteredFormData = {
        ...formData,
        costs: formData.costs.filter(cost => cost.cost !== undefined && cost.cost !== null && cost.cost > 0),
        prices: formData.prices.filter(price => price.price !== undefined && price.price !== null && price.price > 0)
      };

      await onSubmit(filteredFormData);
      toast.success(`Item ${isEdit ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error(`ItemForm: Error ${isEdit ? 'updating' : 'creating'} item:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} item: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ItemFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemGroupChange = (itemGroupId: string) => {
    const selectedGroup = itemGroups.find(group => group.id === itemGroupId);
    if (selectedGroup) {
      setFormData(prev => ({
        ...prev,
        itemGroupId,
        classification: selectedGroup.classification,
        subClassification: selectedGroup.subClassification
      }));
    } else {
      handleInputChange("itemGroupId", itemGroupId);
    }
  };

  const addCost = () => {
    setFormData(prev => ({
      ...prev,
      costs: [...prev.costs, { supplierId: "", cost: 0 }]
    }));
  };

  const removeCost = (index: number) => {
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.filter((_, i) => i !== index)
    }));
  };

  const updateCost = (index: number, field: keyof ItemCostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.map((cost, i) => 
        i === index ? { 
          ...cost, 
          [field]: field === 'cost' ? (value === "" ? 0 : parseFloat(value) || 0) : value 
        } : cost
      )
    }));
  };

  const addPrice = () => {
    setFormData(prev => ({
      ...prev,
      prices: [...prev.prices, { salesChannelId: "", price: 0 }]
    }));
  };

  const removePrice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index)
    }));
  };

  const updatePrice = (index: number, field: keyof ItemPriceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      prices: prev.prices.map((price, i) => 
        i === index ? { 
          ...price, 
          [field]: field === 'price' ? (value === "" ? 0 : parseFloat(value) || 0) : value 
        } : price
      )
    }));
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading form data...</p>
      </div>
    );
  }

  const renderBasicSection = () => (
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
            onChange={(e) => handleInputChange("id", e.target.value)}
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
            onChange={(e) => handleInputChange("description", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="itemGroup">Item Group</Label>
          <Select 
            value={formData.itemGroupId || ""} 
            onValueChange={handleItemGroupChange}
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
            onChange={(e) => handleInputChange("classification", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="subClassification">Sub-Classification *</Label>
          <Input
            id="subClassification"
            value={formData.subClassification}
            onChange={(e) => handleInputChange("subClassification", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: "active" | "inactive") => handleInputChange("status", value)}
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
            onValueChange={(value) => handleInputChange("gstPercentage", parseInt(value))}
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
            onValueChange={(value) => handleInputChange("uom", value)}
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
            onChange={(e) => handleInputChange("barcode", e.target.value)}
            placeholder="Auto-generated if empty"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderPhysicalSection = () => (
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
              onChange={(e) => handleInputChange("length", parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div>
            <Label htmlFor="width">Width (cm)</Label>
            <Input
              id="width"
              type="number"
              step="0.01"
              value={formData.width || ""}
              onChange={(e) => handleInputChange("width", parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.01"
              value={formData.height || ""}
              onChange={(e) => handleInputChange("height", parseFloat(e.target.value) || undefined)}
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
                onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || undefined)}
                placeholder="Enter weight"
                className="flex-1"
              />
              <Select 
                value={formData.weightUom || "kg"} 
                onValueChange={(value: "g" | "kg") => handleInputChange("weightUom", value)}
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

  const renderCostsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supplier Costs
          <Button type="button" onClick={addCost} size="sm">
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
                onChange={(e) => updateCost(index, "cost", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Supplier (Optional)</Label>
              <Select 
                value={cost.supplierId || ""} 
                onValueChange={(value) => updateCost(index, "supplierId", value === "none" ? "" : value)}
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
              onClick={() => removeCost(index)}
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

  const renderPricesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Sales Channel Prices
          <Button type="button" onClick={addPrice} size="sm">
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
                onChange={(e) => updatePrice(index, "price", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Sales Channel (Optional)</Label>
              <Select 
                value={price.salesChannelId || ""} 
                onValueChange={(value) => updatePrice(index, "salesChannelId", value === "none" ? "" : value)}
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
              onClick={() => removePrice(index)}
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

  const renderContent = () => {
    switch (activeSection) {
      case "basic":
        return renderBasicSection();
      case "physical":
        return renderPhysicalSection();
      case "costs":
        return renderCostsSection();
      case "prices":
        return renderPricesSection();
      default:
        return renderBasicSection();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderContent()}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
};

export default ItemForm;
