
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PurchaseOrderFormData, PurchaseOrderLine, ShippingAddress } from "@/types/purchaseOrder";
import { divisionService } from "@/services/divisionService";
import { organizationService } from "@/services/organizationService";
import { itemService } from "@/services/itemService";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { Division } from "@/types/division";
import { Organization } from "@/types/organization";
import { Item } from "@/types/item";
import ShipToAddressSection from "./ShipToAddressSection";
import PurchaseOrderLinesSection from "./PurchaseOrderLinesSection";

// --- UI Clean: helper styles for lean form ---
const sectionTitleClass = "text-base font-semibold text-muted-foreground tracking-tight mb-1";
const formGridClass = "grid grid-cols-1 md:grid-cols-3 gap-4";
// Removed card backgrounds, added 'w-full' max, padding reduced, removed cardBaseClass etc

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrderFormData;
  onSubmit: (data: PurchaseOrderFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const { toast } = useToast();
  const { currentOrganization } = useMultiTenant();
  
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [suppliers, setSuppliers] = useState<Organization[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultFormData: PurchaseOrderFormData = {
    poNumber: "",
    divisionId: "",
    supplierId: "",
    poDate: new Date().toISOString().split('T')[0],
    requestedDeliveryDate: undefined,
    sameAsDivisionAddress: false,
    shipToAddress1: "",
    shipToAddress2: "",
    shipToPostalCode: "",
    shipToCity: "",
    shipToState: "",
    shipToCountry: "",
    shipToPhone: "",
    shipToEmail: "",
    paymentTerms: "Net 30",
    notes: "",
    trackingNumber: "",
    lines: []
  };

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PurchaseOrderFormData>({
    defaultValues: initialData || defaultFormData
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  });

  const watchedLines = watch("lines");
  const watchedDivisionId = watch("divisionId");
  const watchedSupplierId = watch("supplierId");
  // watchedSameAsDivisionAddress is no longer needed here, it's handled in ShipToAddressSection

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchDropdownData();
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (!isEdit) {
      generatePONumber();
    }
  }, [isEdit]);

  const resetShippingFields = () => {
    setValue("shipToAddress1", "");
    setValue("shipToAddress2", "");
    setValue("shipToPostalCode", "");
    setValue("shipToCity", "");
    setValue("shipToState", "");
    setValue("shipToCountry", "");
    setValue("shipToPhone", "");
    setValue("shipToEmail", "");
  };

  // This useEffect is redundant, as ShipToAddressSection has its own.
  /* useEffect(() => {
    if (watchedSameAsDivisionAddress && watchedDivisionId) {
      loadDivisionShippingAddress();
    } else if (!watchedSameAsDivisionAddress) {
      resetShippingFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSameAsDivisionAddress, watchedDivisionId]); */

  const fetchDropdownData = async () => {
    if (!currentOrganization?.id) return;
    try {
      const [divisionsData, suppliersData, itemsData] = await Promise.all([
        divisionService.getActiveDivisions(),
        organizationService.getOrganizations(),
        itemService.getItems()
      ]);
      setDivisions(divisionsData);
      setSuppliers(suppliersData.filter(org => org.type === 'Supplier' && org.status === 'active'));
      setItems(itemsData);
      setFilteredItems(itemsData.slice(0, 5));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load form data", variant: "destructive" });
    }
  };

  const generatePONumber = async () => {
    try {
      const poNumber = await purchaseOrderService.generatePONumber();
      setValue("poNumber", poNumber);
    } catch {
      toast({ title: "Error", description: "Failed to generate PO number", variant: "destructive" });
    }
  };

  const loadDivisionShippingAddress = async () => {
    try {
      const address = await purchaseOrderService.getDivisionShippingAddress(watchedDivisionId);
      if (address) {
        setValue("shipToAddress1", address.address1 || "");
        setValue("shipToAddress2", address.address2 || "");
        setValue("shipToPostalCode", address.postal_code || "");
        setValue("shipToCity", address.city || "");
        setValue("shipToState", address.state || "");
        setValue("shipToCountry", address.country || "");
        setValue("shipToPhone", address.phone_number || "");
        setValue("shipToEmail", address.email || "");
      } else {
        resetShippingFields();
      }
    } catch {
      toast({title: "Warning", description: "Could not load division shipping address", variant: "default"});
      resetShippingFields();
    }
  };

  const searchItems = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredItems(items.slice(0, 5));
      return;
    }
    const filtered = items.filter(item => 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
    setFilteredItems(filtered);
  };

  const addPOLine = () => {
    const newLineNumber = fields.length + 1;
    const newLine: PurchaseOrderLine = {
      lineNumber: newLineNumber,
      itemId: "",
      quantity: 0,
      uom: "",
      unitPrice: 0,
      totalUnitPrice: 0,
      gstPercent: 0,
      gstValue: 0,
      lineTotal: 0
    };
    append(newLine);
  };

  const removePOLine = (index: number) => {
    remove(index);
    // Renumber remaining lines
    fields.forEach((_, idx) => {
      if (idx > index) {
        setValue(`lines.${idx - 1}.lineNumber`, idx);
      }
    });
  };

  const getItemCostForSupplier = async (itemId: string, supplierId: string): Promise<number | null> => {
    try {
      const item = await itemService.getItemById(itemId);
      if (!item || !item.costs) return null;
      const supplierCost = item.costs.find(cost => cost.supplierId === supplierId);
      if (supplierCost) return supplierCost.cost;
      const defaultCost = item.costs.find(cost => !cost.supplierId || cost.supplierId === "");
      if (defaultCost) return defaultCost.cost;
      return null;
    } catch {
      return null;
    }
  };

  const handleItemChange = async (lineIndex: number, itemId: string) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      setValue(`lines.${lineIndex}.itemId`, itemId);
      setValue(`lines.${lineIndex}.uom`, selectedItem.uom || "");
      setValue(`lines.${lineIndex}.gstPercent`, selectedItem.gstPercentage || 0);
      if (watchedSupplierId) {
        const itemCost = await getItemCostForSupplier(itemId, watchedSupplierId);
        if (itemCost !== null) setValue(`lines.${lineIndex}.unitPrice`, itemCost);
      }
      calculateLineTotal(lineIndex);
    }
  };

  const calculateLineTotal = (lineIndex: number) => {
    const line = watchedLines[lineIndex];
    if (line) {
      const totalUnitPrice = line.quantity * line.unitPrice;
      const gstValue = (totalUnitPrice * line.gstPercent) / 100;
      const lineTotal = totalUnitPrice + gstValue;
      setValue(`lines.${lineIndex}.totalUnitPrice`, totalUnitPrice);
      setValue(`lines.${lineIndex}.gstValue`, gstValue);
      setValue(`lines.${lineIndex}.lineTotal`, lineTotal);
    }
  };

  const onFormSubmit = async (data: PurchaseOrderFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      // error handling is outside for clarity/UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl px-2 mx-auto">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 w-full">
        {/* Purchase Order Details */}
        <section className="bg-transparent">
          <h2 className={sectionTitleClass}>Purchase Order Details</h2>
          <div className={formGridClass + " mt-2"}>
            <div>
              <Label htmlFor="poNumber">PO Number *</Label>
              <Input
                id="poNumber"
                {...register("poNumber", { required: "PO Number is required" })}
                readOnly={isEdit}
                className={isEdit ? "bg-muted" : ""}
              />
              {errors.poNumber && <p className="text-xs text-red-500">{errors.poNumber.message}</p>}
            </div>
            <div>
              <Label htmlFor="divisionId">Division *</Label>
              <Select onValueChange={(value) => setValue("divisionId", value)} defaultValue={watch("divisionId")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name} ({division.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.divisionId && <p className="text-xs text-red-500">Division is required</p>}
            </div>
            <div>
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select onValueChange={(value) => setValue("supplierId", value)} defaultValue={watch("supplierId")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && <p className="text-xs text-red-500">Supplier is required</p>}
            </div>
            <div>
              <Label htmlFor="poDate">PO Date *</Label>
              <Input
                id="poDate"
                type="date"
                {...register("poDate", { required: "PO Date is required" })}
              />
              {errors.poDate && <p className="text-xs text-red-500">{errors.poDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="requestedDeliveryDate">Requested Delivery Date</Label>
              <Input
                id="requestedDeliveryDate"
                type="date"
                {...register("requestedDeliveryDate")}
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select onValueChange={(value) => setValue("paymentTerms", value)} defaultValue={watch("paymentTerms")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
        {/* Ship to Address section */}
        <ShipToAddressSection
          control={control}
          register={register}
          errors={errors}
          watchedDivisionId={watchedDivisionId}
          loadDivisionShippingAddress={loadDivisionShippingAddress}
          resetShippingFields={resetShippingFields}
        />
        {/* PO Lines Section */}
        <PurchaseOrderLinesSection
          fields={fields}
          append={append}
          remove={removePOLine}
          watchedLines={watchedLines}
          setValue={setValue}
          items={items}
          filteredItems={filteredItems}
          searchItems={searchItems}
          handleItemChange={handleItemChange}
          calculateLineTotal={calculateLineTotal}
          errors={errors}
          addPOLine={addPOLine}
        />
        {/* Notes */}
        <section className="bg-transparent">
          <h2 className={sectionTitleClass}>Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Enter any additional notes..."
                className="min-h-[50px]"
              />
            </div>
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                {...register("trackingNumber")}
                placeholder="Enter tracking number if available"
              />
            </div>
          </div>
        </section>
        {/* Form Actions */}
        <div className="flex justify-end gap-3 border-none mt-2 p-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update PO" : "Create PO"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderForm;
