
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
import { PurchaseOrderFormData, PurchaseOrderLine, ShippingAddress, PurchaseOrderGSTBreakdown } from "@/types/purchaseOrder";
import { divisionService } from "@/services/divisionService";
import { itemService } from "@/services/itemService";
import { organizationService } from "@/services/organizationService";
import { partnerSupplierService } from "@/services/partnerSupplierService";
import { generatePONumber, getDivisionShippingAddress } from "@/services/purchaseOrder/queries";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { Division } from "@/types/division";
import { Item } from "@/types/item";
import { Organization } from "@/types/organization";
import ShipToAddressSection from "./ShipToAddressSection";
import PurchaseOrderLinesSection from "./PurchaseOrderLinesSection";
import SupplierSelect from "./SupplierSelect";
import { Building2, Package } from "lucide-react";
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

interface BillToInfo {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  stateCode: number | null;
  country: string;
  postalCode: string;
  email: string;
  phone: string;
  gstin: string;
  cin: string;
}

interface RemitToInfo {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  stateCode: number | null;
  country: string;
  postalCode: string;
  email: string;
  phone: string;
  gstin: string;
  cin: string;
}

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
  const [billToInfo, setBillToInfo] = useState<BillToInfo | null>(null);
  const [remitToInfo, setRemitToInfo] = useState<RemitToInfo | null>(null);
  const [suppliers, setSuppliers] = useState<Organization[]>([]);

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

  // Load division Bill To info when division changes
  useEffect(() => {
    if (watchedDivisionId) {
      loadDivisionBillToInfo(watchedDivisionId);
    }
  }, [watchedDivisionId]);

  // Load supplier Remit To info when supplier changes
  useEffect(() => {
    if (watchedSupplierId) {
      loadSupplierRemitToInfo(watchedSupplierId);
    }
  }, [watchedSupplierId]);

  // Load suppliers data
  useEffect(() => {
    if (currentOrganization?.id) {
      loadSuppliers();
    }
  }, [currentOrganization?.id]);

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

  const loadSuppliers = async () => {
    if (!currentOrganization?.id) return;
    try {
      const suppliersData = await partnerSupplierService.getPartnerSuppliers(currentOrganization.id);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadDivisionBillToInfo = async (divisionId: string) => {
    try {
      const division = await divisionService.getDivisionById(divisionId);
      if (division) {
        const billToContact = division.contacts?.find(c => c.type === 'Bill To' || c.type === 'Registered location');
        const gstinRef = division.references?.find(r => r.type === 'GST');
        const cinRef = division.references?.find(r => r.type === 'CIN');
        
        if (billToContact) {
          setBillToInfo({
            name: `${billToContact.firstName} ${billToContact.lastName || ''}`.trim(),
            address1: billToContact.address1 || '',
            address2: billToContact.address2 || '',
            city: billToContact.city || '',
            state: billToContact.state || '',
            stateCode: billToContact.stateCode || null,
            country: billToContact.country || '',
            postalCode: billToContact.postalCode || '',
            email: billToContact.email || '',
            phone: billToContact.phoneNumber || '',
            gstin: gstinRef?.value || '',
            cin: cinRef?.value || ''
          });
        }
      }
    } catch (error) {
      console.error("Error loading division Bill To info:", error);
    }
  };

  const loadSupplierRemitToInfo = async (supplierId: string) => {
    try {
      const organization = await organizationService.getOrganizationById(supplierId);
      if (organization) {
        const remitToContact = organization.contacts?.find(c => c.type === 'Remit To' || c.type === 'Registered location');
        const gstinRef = organization.references?.find(r => r.type === 'GST');
        const cinRef = organization.references?.find(r => r.type === 'CIN');
        
        if (remitToContact) {
          setRemitToInfo({
            name: `${remitToContact.firstName} ${remitToContact.lastName || ''}`.trim(),
            address1: remitToContact.address1 || '',
            address2: remitToContact.address2 || '',
            city: remitToContact.city || '',
            state: remitToContact.state || '',
            stateCode: remitToContact.stateCode || null,
            country: remitToContact.country || '',
            postalCode: remitToContact.postalCode || '',
            email: remitToContact.email || '',
            phone: remitToContact.phoneNumber || '',
            gstin: gstinRef?.value || '',
            cin: cinRef?.value || ''
          });
        }
      }
    } catch (error) {
      console.error("Error loading supplier Remit To info:", error);
    }
  };

  const calculateGSTBreakdown = (): PurchaseOrderGSTBreakdown[] => {
    const lines = watchedLines || [];
    const shipToStateCode = watch("shipToStateCode");
    const gstGroups = new Map<number, { taxableAmount: number; gstValue: number }>();
    
    lines.forEach(line => {
      const existing = gstGroups.get(line.gstPercent) || { taxableAmount: 0, gstValue: 0 };
      gstGroups.set(line.gstPercent, {
        taxableAmount: existing.taxableAmount + line.totalUnitPrice,
        gstValue: existing.gstValue + line.gstValue
      });
    });

    const breakdown: PurchaseOrderGSTBreakdown[] = [];
    gstGroups.forEach((value, gstPercentage) => {
      const isSameState = shipToStateCode === remitToInfo?.stateCode;
      
      breakdown.push({
        gstPercentage,
        taxableAmount: value.taxableAmount,
        cgstAmount: isSameState ? value.gstValue / 2 : 0,
        sgstAmount: isSameState ? value.gstValue / 2 : 0,
        igstAmount: isSameState ? 0 : value.gstValue,
        totalGstAmount: value.gstValue
      });
    });

    return breakdown;
  };

  const calculateTotals = () => {
    const lines = watchedLines || [];
    const subtotal = lines.reduce((sum, line) => sum + line.totalUnitPrice, 0);
    const totalGst = lines.reduce((sum, line) => sum + line.gstValue, 0);
    const total = subtotal + totalGst;
    
    return { subtotal, totalGst, total };
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
    // Merge Bill To and Remit To info into form data
    const mergedData = {
      ...data,
      billToOrgId: currentOrganization?.id,
      billToName: billToInfo?.name || '',
      billToAddress1: billToInfo?.address1 || '',
      billToAddress2: billToInfo?.address2 || '',
      billToCity: billToInfo?.city || '',
      billToState: billToInfo?.state || '',
      billToStateCode: billToInfo?.stateCode || null,
      billToCountry: billToInfo?.country || '',
      billToPostalCode: billToInfo?.postalCode || '',
      billToEmail: billToInfo?.email || '',
      billToPhone: billToInfo?.phone || '',
      billToGstin: billToInfo?.gstin || '',
      billToCin: billToInfo?.cin || '',
      remitToOrgId: data.supplierId,
      remitToName: remitToInfo?.name || '',
      remitToAddress1: remitToInfo?.address1 || '',
      remitToAddress2: remitToInfo?.address2 || '',
      remitToCity: remitToInfo?.city || '',
      remitToState: remitToInfo?.state || '',
      remitToStateCode: remitToInfo?.stateCode || null,
      remitToCountry: remitToInfo?.country || '',
      remitToPostalCode: remitToInfo?.postalCode || '',
      remitToEmail: remitToInfo?.email || '',
      remitToPhone: remitToInfo?.phone || '',
      remitToGstin: remitToInfo?.gstin || '',
      remitToCin: remitToInfo?.cin || ''
    };

    console.log("Submitting PO Form Data:", JSON.stringify(mergedData, null, 2));
    setLoading(true);
    try {
      await onSubmit(mergedData);
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
              <FormField
                control={control}
                name="poType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select PO Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Consumables">Consumables</SelectItem>
                        <SelectItem value="Assets">Assets</SelectItem>
                        <SelectItem value="Finished goods">Finished goods</SelectItem>
                        <SelectItem value="Raw materials">Raw materials</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Parties Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bill To */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bill To
              </h3>
              <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
                {billToInfo ? (
                  <>
                    <div className="font-medium">{billToInfo.name}</div>
                    <div>{billToInfo.address1}</div>
                    {billToInfo.address2 && <div>{billToInfo.address2}</div>}
                    <div>
                      {[billToInfo.city, billToInfo.state, billToInfo.postalCode].filter(Boolean).join(', ')}
                    </div>
                    <div>{billToInfo.country}</div>
                    {billToInfo.email && <div className="text-muted-foreground">{billToInfo.email}</div>}
                    {billToInfo.phone && <div className="text-muted-foreground">{billToInfo.phone}</div>}
                    {billToInfo.gstin && <div className="text-xs text-muted-foreground">GSTIN: {billToInfo.gstin}</div>}
                    {billToInfo.cin && <div className="text-xs text-muted-foreground">CIN: {billToInfo.cin}</div>}
                  </>
                ) : (
                  <div className="text-muted-foreground">Select a division to load Bill To information</div>
                )}
              </div>
            </div>

            {/* Remit To */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Remit To
              </h3>
              <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
                {remitToInfo ? (
                  <>
                    <div className="font-medium">{remitToInfo.name}</div>
                    <div>{remitToInfo.address1}</div>
                    {remitToInfo.address2 && <div>{remitToInfo.address2}</div>}
                    <div>
                      {[remitToInfo.city, remitToInfo.state, remitToInfo.postalCode].filter(Boolean).join(', ')}
                    </div>
                    <div>{remitToInfo.country}</div>
                    {remitToInfo.email && <div className="text-muted-foreground">{remitToInfo.email}</div>}
                    {remitToInfo.phone && <div className="text-muted-foreground">{remitToInfo.phone}</div>}
                    {remitToInfo.gstin && <div className="text-xs text-muted-foreground">GSTIN: {remitToInfo.gstin}</div>}
                    {remitToInfo.cin && <div className="text-xs text-muted-foreground">CIN: {remitToInfo.cin}</div>}
                  </>
                ) : (
                  <div className="text-muted-foreground">Select a supplier to load Remit To information</div>
                )}
              </div>
            </div>
          </div>

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

          {/* GST Breakdown */}
          {watchedLines && watchedLines.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                GST Breakdown
              </h3>
              <div className="rounded-lg border bg-card">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">GST %</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Taxable Amount</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">CGST</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">SGST</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">IGST</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Total GST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {calculateGSTBreakdown().map((breakdown, index) => (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="px-3 py-3 text-sm font-medium">{breakdown.gstPercentage}%</td>
                          <td className="px-3 py-3 text-sm text-right">
                            ₹{breakdown.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-sm text-right">
                            ₹{breakdown.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-sm text-right">
                            ₹{breakdown.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-sm text-right">
                            ₹{breakdown.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-sm text-right font-medium">
                            ₹{breakdown.totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary */}
                <div className="border-t p-4">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between">
                        <span>Item Total:</span>
                        <span>₹{calculateTotals().subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total GST:</span>
                        <span>₹{calculateTotals().totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Grand Total:</span>
                          <span>₹{calculateTotals().total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
