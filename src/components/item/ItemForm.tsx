
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemFormData, ItemCostFormData, ItemPriceFormData } from "@/types/item";
import { ItemGroup } from "@/types/itemGroup";
import { SalesChannel } from "@/types/salesChannel";
import { itemGroupService } from "@/services/itemGroupService";
import { salesChannelService } from "@/services/salesChannelService";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ItemFormProps {
  initialData?: ItemFormData;
  onSubmit: (data: ItemFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const ItemForm = ({ initialData, onSubmit, onCancel, isEdit = false }: ItemFormProps) => {
  console.log("ItemForm: Initializing with data:", initialData);
  console.log("ItemForm: isEdit:", isEdit);
  
  const [formData, setFormData] = useState<ItemFormData>({
    description: "",
    classification: "",
    subClassification: "",
    status: "active",
    costs: [],
    prices: [],
    ...initialData,
  });
  
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  console.log("ItemForm: Current formData:", formData);

  useEffect(() => {
    fetchSelectData();
  }, []);

  const fetchSelectData = async () => {
    console.log("ItemForm: Fetching select data...");
    try {
      const [itemGroupsData, salesChannelsData] = await Promise.all([
        itemGroupService.getItemGroups(),
        salesChannelService.getActiveSalesChannels(),
      ]);
      
      console.log("ItemForm: Item groups fetched:", itemGroupsData);
      console.log("ItemForm: Sales channels fetched:", salesChannelsData);
      
      setItemGroups(itemGroupsData.filter(ig => ig.status === 'active'));
      setSalesChannels(salesChannelsData);
    } catch (error) {
      console.error("ItemForm: Error fetching select data:", error);
      toast.error("Failed to load form data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ItemForm: Starting form submission...");
    console.log("ItemForm: Form data to submit:", JSON.stringify(formData, null, 2));
    
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.description.trim()) {
        console.error("ItemForm: Description is required");
        toast.error("Description is required");
        return;
      }
      
      if (!formData.classification.trim()) {
        console.error("ItemForm: Classification is required");
        toast.error("Classification is required");
        return;
      }
      
      if (!formData.subClassification.trim()) {
        console.error("ItemForm: Sub-classification is required");
        toast.error("Sub-classification is required");
        return;
      }

      console.log("ItemForm: Validation passed, calling onSubmit...");
      await onSubmit(formData);
      console.log("ItemForm: onSubmit completed successfully");
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
    console.log(`ItemForm: Updating field ${field} with value:`, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log("ItemForm: Updated formData:", updated);
      return updated;
    });
  };

  const handleItemGroupChange = (itemGroupId: string) => {
    console.log("ItemForm: Item group changed to:", itemGroupId);
    const selectedGroup = itemGroups.find(group => group.id === itemGroupId);
    if (selectedGroup) {
      console.log("ItemForm: Found selected group:", selectedGroup);
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
    console.log("ItemForm: Adding new cost");
    setFormData(prev => ({
      ...prev,
      costs: [...prev.costs, { supplierId: "", cost: 0 }]
    }));
  };

  const removeCost = (index: number) => {
    console.log("ItemForm: Removing cost at index:", index);
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.filter((_, i) => i !== index)
    }));
  };

  const updateCost = (index: number, field: keyof ItemCostFormData, value: any) => {
    console.log(`ItemForm: Updating cost ${index} field ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.map((cost, i) => 
        i === index ? { ...cost, [field]: value } : cost
      )
    }));
  };

  const addPrice = () => {
    console.log("ItemForm: Adding new price");
    setFormData(prev => ({
      ...prev,
      prices: [...prev.prices, { salesChannelId: "", price: 0 }]
    }));
  };

  const removePrice = (index: number) => {
    console.log("ItemForm: Removing price at index:", index);
    setFormData(prev => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index)
    }));
  };

  const updatePrice = (index: number, field: keyof ItemPriceFormData, value: any) => {
    console.log(`ItemForm: Updating price ${index} field ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      prices: prev.prices.map((price, i) => 
        i === index ? { ...price, [field]: value } : price
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="physical">Physical Properties</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
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
        </TabsContent>

        <TabsContent value="physical">
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
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.001"
                    value={formData.weight || ""}
                    onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
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
                    <Label>Supplier ID</Label>
                    <Input
                      value={cost.supplierId}
                      onChange={(e) => updateCost(index, "supplierId", e.target.value)}
                      placeholder="Enter supplier ID"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cost.cost}
                      onChange={(e) => updateCost(index, "cost", parseFloat(e.target.value) || 0)}
                    />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
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
                    <Label>Sales Channel</Label>
                    <Select 
                      value={price.salesChannelId} 
                      onValueChange={(value) => updatePrice(index, "salesChannelId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sales channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price.price}
                      onChange={(e) => updatePrice(index, "price", parseFloat(e.target.value) || 0)}
                    />
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
