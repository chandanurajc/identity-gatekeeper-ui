
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
import { itemService } from "@/services/itemService";
import { generatePONumber, getDivisionShippingAddress } from "@/services/purchaseOrder/queries";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { Division } from "@/types/division";
import { Item } from "@/types/item";
import ShipToAddressSection from "./ShipToAddressSection";
import PurchaseOrderLinesSection from "./PurchaseOrderLinesSection";
import SupplierSelect from "./SupplierSelect";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// --- UI Clean: helper styles for lean form ---
const sectionTitleClass = "text-base font-semibold text-muted-foreground tracking-tight mb-1";
const formGridClass = "grid grid-cols-1 md:grid-cols-3 gap-4";

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
  const { user } = useAuth();
  
  const [divisions, setDivisions] = useState<Division[]>([]);
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

  const form = useForm<PurchaseOrderFormData>({
    defaultValues: initialData || defaultFormData
  });

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  });

  const watchedLines = watch("lines");
  const watchedDivisionId = watch("divisionId");
  const watchedSupplierId = watch("supplierId");

  useEffect(() => {
    if (currentOrganization?.id && user?.organizationId) {
      fetchDropdownData();
    }
  }, [currentOrganization?.id, user?.organizationId]);

  useEffect(() => {
    if (!isEdit) {
      generatePONumberAsync();
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

  const fetchDropdownData = async () => {
    if (!currentOrganization?.id || !user?.organizationId) return;
    
    try {
      console.log("Fetching divisions for organization:", user.organizationId);
      
      // Filter divisions by user's organization - only show divisions from user's org
      const [allDivisions, itemsData] = await Promise.all([
        divisionService.getDivisions(user.organizationId),
        itemService.getItems()
      ]);
      
      console.log("All divisions:", allDivisions);
      console.log("User organization ID:", user.organizationId);
      
      setDivisions(allDivisions);
      setItems(itemsData);
      setFilteredItems(itemsData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      toast({ title: "Error", description: "Failed to load form data", variant: "destructive" });
    }
  };

  const generatePONumberAsync = async () => {
    try {
      console.log("Generating PO number...");
      const poNumber = await generatePONumber();
      console.log("Generated PO number:", poNumber);
      setValue("poNumber", poNumber);
    } catch (error) {
      console.error("Error generating PO number:", error);
      toast({ 
        title: "Error", 
        description: "Failed to generate PO number. Please refresh the page.", 
        variant: "destructive" 
      });
    }
  };

  const loadDivisionShippingAddress = async () => {
    try {
      const address = await getDivisionShippingAddress(watchedDivisionId);
      if (address) {
        setValue("shipToAddress1", address.address1 || "");
        setValue("shipToAddress2", address.address2 || "");
        setValue("shipToPostalCode", address.postal_code || "");
        setValue("shipToCity", address.city || "");
        setValue("shipToState", address.state || "");
        setValue("shipToStateCode", address.state_code || null);
        setValue("shipToCountry", address.country || "");
        setValue("shipToPhone", address.phone_number || "");
        setValue("shipToEmail", address.email || "");
      } else {
        resetShippingFields();
      }
    } catch {
      toast({title: "Warning", description: "Could not load division registered location address", variant: "default"});
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
    console.log("Submitting PO Form Data:", JSON.stringify(data, null, 2));
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
      <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 w-full">
          {/* Purchase Order Details */}
          <section className="bg-transparent">
            <h2 className={sectionTitleClass}>Purchase Order Details</h2>
            <div className={formGridClass + " mt-2"}>
              <FormField
                control={control}
                name="poNumber"
                rules={{ required: "PO Number is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={isEdit}
                        className={isEdit ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="divisionId"
                rules={{ required: "Division is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {divisions.length === 0 ? (
                          <SelectItem value="no-divisions" disabled>
                            No divisions available for your organization
                          </SelectItem>
                        ) : (
                          divisions.map((division) => (
                            <SelectItem key={division.id} value={division.id}>
                              {division.name} ({division.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SupplierSelect
                value={watchedSupplierId}
                onChange={(value) => setValue("supplierId", value)}
                label="Supplier"
                placeholder="Select Supplier"
                required
              />
              <FormField
                control={control}
                name="poDate"
                rules={{ required: "PO Date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="requestedDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Payment Terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            setValue={setValue}
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
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter any additional notes..."
                        className="min-h-[50px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="trackingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter tracking number if available"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
      </Form>
    </div>
  );
};

export default PurchaseOrderForm;
