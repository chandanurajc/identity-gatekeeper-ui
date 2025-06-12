
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PurchaseOrderFormData, PurchaseOrderLine, ShippingAddress } from "@/types/purchaseOrder";
import { organizationService } from "@/services/organizationService";
import { itemService } from "@/services/itemService";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { Organization } from "@/types/organization";
import { Item } from "@/types/item";

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
  
  const [divisions, setDivisions] = useState<Organization[]>([]);
  const [suppliers, setSuppliers] = useState<Organization[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [sameAsDivisionAddress, setSameAsDivisionAddress] = useState(false);

  const defaultFormData: PurchaseOrderFormData = {
    poNumber: "",
    divisionId: "",
    supplierId: "",
    poDate: new Date(),
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

  useEffect(() => {
    if (sameAsDivisionAddress && watchedDivisionId) {
      loadDivisionShippingAddress();
    }
  }, [sameAsDivisionAddress, watchedDivisionId]);

  const fetchDropdownData = async () => {
    if (!currentOrganization?.id) return;

    try {
      const [divisionsData, suppliersData, itemsData] = await Promise.all([
        organizationService.getOrganizations(),
        organizationService.getOrganizations(),
        itemService.getItems()
      ]);

      // Filter divisions (type = 'Admin' for divisions in this context)
      setDivisions(divisionsData.filter(org => org.type === 'Admin'));
      // Filter suppliers
      setSuppliers(suppliersData.filter(org => org.type === 'Supplier'));
      setItems(itemsData);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      });
    }
  };

  const generatePONumber = async () => {
    try {
      const poNumber = await purchaseOrderService.generatePONumber();
      setValue("poNumber", poNumber);
    } catch (error) {
      console.error("Error generating PO number:", error);
      toast({
        title: "Error",
        description: "Failed to generate PO number",
        variant: "destructive",
      });
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
      }
    } catch (error) {
      console.error("Error loading division shipping address:", error);
      toast({
        title: "Warning",
        description: "Could not load division shipping address",
        variant: "default",
      });
    }
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

  const handleItemChange = (lineIndex: number, itemId: string) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      setValue(`lines.${lineIndex}.itemId`, itemId);
      setValue(`lines.${lineIndex}.uom`, selectedItem.uom || "");
      setValue(`lines.${lineIndex}.gstPercent`, selectedItem.gstPercentage || 0);
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

  const calculateSummary = () => {
    const itemTotal = watchedLines.reduce((sum, line) => sum + (line.totalUnitPrice || 0), 0);
    const totalGST = watchedLines.reduce((sum, line) => sum + (line.gstValue || 0), 0);
    return { itemTotal, totalGST };
  };

  const onFormSubmit = async (data: PurchaseOrderFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSameAsDivisionAddressChange = (checked: boolean | "indeterminate") => {
    setSameAsDivisionAddress(checked === true);
  };

  const { itemTotal, totalGST } = calculateSummary();

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="poNumber">PO Number *</Label>
            <Input
              id="poNumber"
              {...register("poNumber", { required: "PO Number is required" })}
              readOnly={isEdit}
              className={isEdit ? "bg-muted" : ""}
            />
            {errors.poNumber && <p className="text-sm text-red-500">{errors.poNumber.message}</p>}
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
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.divisionId && <p className="text-sm text-red-500">Division is required</p>}
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
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplierId && <p className="text-sm text-red-500">Supplier is required</p>}
          </div>

          <div>
            <Label htmlFor="poDate">PO Date *</Label>
            <Input
              id="poDate"
              type="date"
              {...register("poDate", { required: "PO Date is required" })}
            />
            {errors.poDate && <p className="text-sm text-red-500">{errors.poDate.message}</p>}
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
        </CardContent>
      </Card>

      {/* Ship to Address */}
      <Card>
        <CardHeader>
          <CardTitle>Ship to Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsDivisionAddress"
              checked={sameAsDivisionAddress}
              onCheckedChange={handleSameAsDivisionAddressChange}
            />
            <Label htmlFor="sameAsDivisionAddress">Same as Division's Shipping address?</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipToAddress1">Address 1 *</Label>
              <Input
                id="shipToAddress1"
                {...register("shipToAddress1", { required: "Address 1 is required" })}
                disabled={sameAsDivisionAddress}
              />
              {errors.shipToAddress1 && <p className="text-sm text-red-500">{errors.shipToAddress1.message}</p>}
            </div>

            <div>
              <Label htmlFor="shipToAddress2">Address 2</Label>
              <Input
                id="shipToAddress2"
                {...register("shipToAddress2")}
                disabled={sameAsDivisionAddress}
              />
            </div>

            <div>
              <Label htmlFor="shipToPostalCode">Postal Code *</Label>
              <Input
                id="shipToPostalCode"
                {...register("shipToPostalCode", { required: "Postal Code is required" })}
                disabled={sameAsDivisionAddress}
              />
              {errors.shipToPostalCode && <p className="text-sm text-red-500">{errors.shipToPostalCode.message}</p>}
            </div>

            <div>
              <Label htmlFor="shipToCity">City *</Label>
              <Input
                id="shipToCity"
                {...register("shipToCity", { required: "City is required" })}
                disabled={sameAsDivisionAddress}
              />
              {errors.shipToCity && <p className="text-sm text-red-500">{errors.shipToCity.message}</p>}
            </div>

            <div>
              <Label htmlFor="shipToState">State *</Label>
              <Input
                id="shipToState"
                {...register("shipToState", { required: "State is required" })}
                disabled={sameAsDivisionAddress}
              />
              {errors.shipToState && <p className="text-sm text-red-500">{errors.shipToState.message}</p>}
            </div>

            <div>
              <Label htmlFor="shipToCountry">Country *</Label>
              <Input
                id="shipToCountry"
                {...register("shipToCountry", { required: "Country is required" })}
                disabled={sameAsDivisionAddress}
              />
              {errors.shipToCountry && <p className="text-sm text-red-500">{errors.shipToCountry.message}</p>}
            </div>

            <div>
              <Label htmlFor="shipToPhone">Phone *</Label>
              <Input
                id="shipToPhone"
                {...register("shipToPhone", { required: "Phone is required" })}
                disabled={sameAsDivisionAddress}
              />
              {errors.shipToPhone && <p className="text-sm text-red-500">{errors.shipToPhone.message}</p>}
            </div>

            <div>
              <Label htmlFor="shipToEmail">Email *</Label>
              <Input
                id="shipToEmail"
                type="email"
                {...register("shipToEmail", { required: "Email is required" })}
                disabled={sameAsDivisionAddress}
              />
              {errors.shipToEmail && <p className="text-sm text-red-500">{errors.shipToEmail.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PO Lines */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Purchase Order Lines</CardTitle>
            <Button type="button" onClick={addPOLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add PO Line
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line #</TableHead>
                  <TableHead>Item *</TableHead>
                  <TableHead>Qty *</TableHead>
                  <TableHead>UOM *</TableHead>
                  <TableHead>Unit Price *</TableHead>
                  <TableHead>Total Unit Price</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>GST Value</TableHead>
                  <TableHead>Line Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Select 
                        onValueChange={(value) => handleItemChange(index, value)} 
                        defaultValue={watchedLines[index]?.itemId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.id} - {item.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.quantity`, { 
                          required: "Quantity is required",
                          min: { value: 0.01, message: "Quantity must be greater than 0" }
                        })}
                        onChange={(e) => {
                          setValue(`lines.${index}.quantity`, parseFloat(e.target.value) || 0);
                          calculateLineTotal(index);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        {...register(`lines.${index}.uom`, { required: "UOM is required" })}
                        readOnly
                        className="bg-muted"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.unitPrice`, { 
                          required: "Unit Price is required",
                          min: { value: 0, message: "Unit Price must be non-negative" }
                        })}
                        onChange={(e) => {
                          setValue(`lines.${index}.unitPrice`, parseFloat(e.target.value) || 0);
                          calculateLineTotal(index);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.totalUnitPrice?.toFixed(2) || "0.00"}
                        readOnly
                        className="bg-muted"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.gstPercent`)}
                        onChange={(e) => {
                          setValue(`lines.${index}.gstPercent`, parseFloat(e.target.value) || 0);
                          calculateLineTotal(index);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.gstValue?.toFixed(2) || "0.00"}
                        readOnly
                        className="bg-muted"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.lineTotal?.toFixed(2) || "0.00"}
                        readOnly
                        className="bg-muted"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePOLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No line items added yet. Click "Add PO Line" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {fields.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Card className="w-80">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Item Total Price:</span>
                      <span>₹{itemTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total GST Value:</span>
                      <span>₹{totalGST.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Grand Total:</span>
                        <span>₹{(itemTotal + totalGST).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info and Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Enter any additional notes..."
            />
          </div>

          <div>
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              {...register("trackingNumber")}
              placeholder="Enter tracking number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Purchase Order" : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;
