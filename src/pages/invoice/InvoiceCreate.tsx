
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { InvoiceFormData, InvoiceLineFormData, TaxMaster } from "@/types/invoice";
import { Division } from "@/types/division";
import { Organization } from "@/types/organization";
import { Item } from "@/types/item";
import { invoiceService } from "@/services/invoiceService";
import { divisionService } from "@/services/divisionService";
import { partnerService } from "@/services/partnerService";
import { itemService } from "@/services/itemService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { useInvoicePermissions } from "@/hooks/useInvoicePermissions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const InvoiceCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization } = useMultiTenant();
  const { user } = useAuth();
  const { canCreateInvoice } = useInvoicePermissions();
  
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [partners, setPartners] = useState<Organization[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [taxMaster, setTaxMaster] = useState<TaxMaster[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<InvoiceFormData>({
    defaultValues: {
      invoice_number: "",
      invoice_date: new Date().toISOString().split('T')[0],
      invoice_type: "Payable",
      division_id: "",
      bill_to_organization_id: "",
      remit_to_organization_id: "",
      ship_to_same_as_division: true,
      payment_terms: "Net 30",
      due_date: "",
      lines: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines"
  });

  const watchedInvoiceType = form.watch("invoice_type");
  const watchedShipToSameAsDivision = form.watch("ship_to_same_as_division");
  const watchedPaymentTerms = form.watch("payment_terms");
  const watchedInvoiceDate = form.watch("invoice_date");

  useEffect(() => {
    if (!canCreateInvoice) {
      navigate('/unauthorized');
      return;
    }
    
    if (currentOrganization?.id && user?.organizationId) {
      loadInitialData();
    }
  }, [currentOrganization?.id, user?.organizationId, canCreateInvoice]);

  useEffect(() => {
    generateInvoiceNumber();
  }, [watchedInvoiceType]);

  useEffect(() => {
    calculateDueDate();
  }, [watchedPaymentTerms, watchedInvoiceDate]);

  const loadInitialData = async () => {
    if (!currentOrganization?.id || !user?.organizationId) return;
    
    try {
      const [divisionsData, partnersData, itemsData, taxData] = await Promise.all([
        divisionService.getDivisions(user.organizationId),
        partnerService.getPartners(user.organizationId),
        itemService.getItems(),
        invoiceService.getTaxMaster(user.organizationId)
      ]);
      
      setDivisions(divisionsData);
      setPartners(partnersData);
      setItems(itemsData);
      setTaxMaster(taxData);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast({ title: "Error", description: "Failed to load form data", variant: "destructive" });
    }
  };

  const generateInvoiceNumber = async () => {
    if (!currentOrganization?.id || !watchedInvoiceType) return;
    
    try {
      const invoiceNumber = await invoiceService.generateInvoiceNumber(
        currentOrganization.id,
        watchedInvoiceType
      );
      form.setValue("invoice_number", invoiceNumber);
    } catch (error) {
      console.error("Error generating invoice number:", error);
      toast({ title: "Error", description: "Failed to generate invoice number", variant: "destructive" });
    }
  };

  const calculateDueDate = () => {
    if (!watchedInvoiceDate || !watchedPaymentTerms) return;
    
    const invoiceDate = new Date(watchedInvoiceDate);
    let daysToAdd = 30;
    
    if (watchedPaymentTerms === "Net 60") daysToAdd = 60;
    else if (watchedPaymentTerms === "Net 90") daysToAdd = 90;
    else if (watchedPaymentTerms === "Due on Receipt") daysToAdd = 0;
    
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    
    form.setValue("due_date", dueDate.toISOString().split('T')[0]);
  };

  const addInvoiceLine = () => {
    const newLine: InvoiceLineFormData = {
      line_number: fields.length + 1,
      item_id: "",
      quantity: 0,
      uom: "",
      unit_cost: 0,
      gst_percent: 0,
      total_item_cost: 0,
      gst_value: 0,
      line_total: 0
    };
    append(newLine);
  };

  const calculateLineTotal = (index: number) => {
    const lines = form.getValues("lines");
    const line = lines[index];
    
    if (line) {
      const totalItemCost = line.quantity * line.unit_cost;
      const gstValue = (totalItemCost * line.gst_percent) / 100;
      const lineTotal = totalItemCost + gstValue;
      
      form.setValue(`lines.${index}.total_item_cost`, totalItemCost);
      form.setValue(`lines.${index}.gst_value`, gstValue);
      form.setValue(`lines.${index}.line_total`, lineTotal);
      
      if (line.weight_per_unit) {
        form.setValue(`lines.${index}.total_weight`, line.quantity * line.weight_per_unit);
      }
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!currentOrganization?.id || !user?.id) return;
    
    setLoading(true);
    try {
      await invoiceService.createInvoice(data, currentOrganization.id, user.id);
      toast({ title: "Success", description: "Invoice created successfully" });
      navigate("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ title: "Error", description: "Failed to create invoice", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateInvoice) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          Back to Invoices
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="invoice_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Payable">Payable</SelectItem>
                        <SelectItem value="Receivable">Receivable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="division_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {divisions.map((division) => (
                          <SelectItem key={division.id} value={division.id}>
                            {division.name} ({division.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Net 90">Net 90</SelectItem>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Line Items
                <Button type="button" onClick={addInvoiceLine}>
                  Add Line
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No line items added. Click "Add Line" to start.
                </p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Line {index + 1}</h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.item_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Item" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.id} - {item.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`lines.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    calculateLineTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`lines.${index}.unit_cost`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Cost</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    calculateLineTotal(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`lines.${index}.gst_percent`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GST %</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(parseFloat(value));
                                  calculateLineTotal(index);
                                }}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select GST%" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {taxMaster.map((tax) => (
                                    <SelectItem key={tax.id} value={tax.tax_percent.toString()}>
                                      {tax.tax_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted p-3 rounded">
                        <div>
                          <Label>Total Item Cost</Label>
                          <Input
                            value={form.watch(`lines.${index}.total_item_cost`)?.toFixed(2) || "0.00"}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <Label>GST Value</Label>
                          <Input
                            value={form.watch(`lines.${index}.gst_value`)?.toFixed(2) || "0.00"}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <Label>Line Total</Label>
                          <Input
                            value={form.watch(`lines.${index}.line_total`)?.toFixed(2) || "0.00"}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fields.length === 0}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InvoiceCreate;
