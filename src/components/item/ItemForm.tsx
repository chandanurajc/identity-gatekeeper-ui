
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ItemFormData, ItemCostFormData, ItemPriceFormData } from "@/types/item";
import { ItemGroup } from "@/types/itemGroup";
import { SalesChannel } from "@/types/salesChannel";
import { Organization } from "@/types/organization";
import { itemGroupService } from "@/services/itemGroupService";
import { salesChannelService } from "@/services/salesChannelService";
import { partnerSupplierService } from "@/services/partnerSupplierService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { toast } from "sonner";
import { BasicInformationSection } from "./sections/BasicInformationSection";
import { PhysicalPropertiesSection } from "./sections/PhysicalPropertiesSection";
import { CostsSection } from "./sections/CostsSection";
import { PricesSection } from "./sections/PricesSection";

interface ItemFormProps {
  initialData?: ItemFormData;
  onSubmit: (data: ItemFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  activeSection?: string;
}

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

  const renderContent = () => {
    switch (activeSection) {
      case "basic":
        return (
          <BasicInformationSection
            formData={formData}
            itemGroups={itemGroups}
            isEdit={isEdit}
            onInputChange={handleInputChange}
            onItemGroupChange={handleItemGroupChange}
          />
        );
      case "physical":
        return (
          <PhysicalPropertiesSection
            formData={formData}
            onInputChange={handleInputChange}
          />
        );
      case "costs":
        return (
          <CostsSection
            formData={formData}
            suppliers={suppliers}
            onCostAdd={addCost}
            onCostRemove={removeCost}
            onCostUpdate={updateCost}
          />
        );
      case "prices":
        return (
          <PricesSection
            formData={formData}
            salesChannels={salesChannels}
            onPriceAdd={addPrice}
            onPriceRemove={removePrice}
            onPriceUpdate={updatePrice}
          />
        );
      default:
        return (
          <BasicInformationSection
            formData={formData}
            itemGroups={itemGroups}
            isEdit={isEdit}
            onInputChange={handleInputChange}
            onItemGroupChange={handleItemGroupChange}
          />
        );
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
