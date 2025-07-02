
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { divisionService } from "@/services/divisionService";
import { partnerSupplierService } from "@/services/partnerSupplierService";
import { itemService } from "@/services/itemService";
import type { InvoiceFormData, InvoiceType, InvoiceLineFormData, PaymentTerms } from "@/types/invoice";
import { Organization } from "@/types/organization";
import { Item } from "@/types/item";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    invoiceNumber: 'Auto-generated',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: 'Payable',
    paymentTerms: 'Net 30',
    sameAsDivisionAddress: true,
    invoiceLines: []
  });

  const [suppliers, setSuppliers] = useState<Organization[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Fetch divisions for the dropdown
  const { data: divisions, isLoading: divisionsLoading } = useQuery({
    queryKey: ["divisions", organizationId],
    queryFn: () => divisionService.getDivisions(organizationId!),
    enabled: !!organizationId,
  });

  // Fetch suppliers and items
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;
      
      try {
        const [suppliersData, itemsData] = await Promise.all([
          partnerSupplierService.getPartnerSuppliers(organizationId),
          itemService.getItems()
        ]);
        setSuppliers(suppliersData);
        setItems(itemsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [organizationId]);

  // Calculate due date based on payment terms
  useEffect(() => {
    if (formData.invoiceDate && formData.paymentTerms) {
      const invoiceDate = new Date(formData.invoiceDate);
      let daysToAdd = 0;
      
      switch (formData.paymentTerms) {
        case 'Net 15':
          daysToAdd = 15;
          break;
        case 'Net 30':
          daysToAdd = 30;
          break;
        case 'Net 60':
          daysToAdd = 60;
          break;
        case 'Net 90':
          daysToAdd = 90;
          break;
        case 'Due on Receipt':
        default:
          daysToAdd = 0;
          break;
      }
      
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.invoiceDate, formData.paymentTerms]);

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLineItem = () => {
    const newLine: InvoiceLineFormData = {
      lineNumber: (formData.invoiceLines?.length || 0) + 1,
      itemId: '',
      itemDescription: '',
      quantity: 1,
      uom: 'Unit',
      weightPerUnit: 0,
      weightUom: 'kg',
      totalWeight: 0,
      unitPrice: 0,
      totalPrice: 0,
      gstPercentage: 18,
      gstValue: 0,
      lineTotal: 0
    };

    setFormData(prev => ({
      ...prev,
      invoiceLines: [...(prev.invoiceLines || []), newLine]
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      invoiceLines: prev.invoiceLines?.filter((_, i) => i !== index) || []
    }));
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineFormData, value: any) => {
    setFormData(prev => {
      const lines = [...(prev.invoiceLines || [])];
      const line = { ...lines[index] };
      
      line[field] = value as never;
      
      // Auto-calculate totals
      if (field === 'quantity' || field === 'unitPrice') {
        line.totalPrice = line.quantity * line.unitPrice;
        line.gstValue = (line.totalPrice * line.gstPercentage) / 100;
        line.lineTotal = line.totalPrice + line.gstValue;
      }
      
      if (field === 'gstPercentage') {
        line.gstValue = (line.totalPrice * line.gstPercentage) / 100;
        line.lineTotal = line.totalPrice + line.gstValue;
      }
      
      // Auto-calculate weight
      if (field === 'quantity' || field === 'weightPerUnit') {
        line.totalWeight = line.quantity * (line.weightPerUnit || 0);
      }

      lines[index] = line;
      
      return {
        ...prev,
        invoiceLines: lines
      };
    });
  };

  const calculateTotals = () => {
    const lines = formData.invoiceLines || [];
    const subtotal = lines.reduce((sum, line) => sum + line.totalPrice, 0);
    const totalGst = lines.reduce((sum, line) => sum + line.gstValue, 0);
    const total = subtotal + totalGst;
    
    return { subtotal, totalGst, total };
  };

  const { subtotal, totalGst, total } = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Invoice form data:", formData);
    // TODO: Implement invoice creation
  };

  const handleSaveDraft = () => {
    console.log("Saving as draft:", formData);
    // TODO: Implement save as draft
  };

  const handleSubmitInvoice = () => {
    console.log("Submitting invoice:", formData);
    // TODO: Implement submit invoice
  };

  if (!organizationId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/finance/invoices")}
          className="flex items-center space-x-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <p className="text-muted-foreground">Create a new payable or receivable invoice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Section - Invoice Header */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Header</CardTitle>
            <CardDescription>Basic invoice details and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber || 'Auto-generated'}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="Auto-generated"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="division">Division *</Label>
                <Select
                  value={formData.divisionId || ''}
                  onValueChange={(value) => handleInputChange('divisionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisionsLoading ? (
                      <SelectItem value="">Loading...</SelectItem>
                    ) : (
                      divisions?.map((division) => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billTo">Bill To</Label>
                <Input
                  id="billTo"
                  value="Current Organization"
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                  value={formData.remitToOrgId || ''}
                  onValueChange={(value) => handleInputChange('remitToOrgId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search & select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remitTo">Remit To</Label>
                <Input
                  id="remitTo"
                  value={suppliers.find(s => s.id === formData.remitToOrgId)?.name || ''}
                  disabled
                  className="bg-muted"
                  placeholder="Auto-filled from supplier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipTo">Ship To</Label>
                <Select
                  value={formData.divisionId || ''}
                  onValueChange={(value) => handleInputChange('divisionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions?.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value: PaymentTerms) => handleInputChange('paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Line Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Line Items</CardTitle>
            <CardDescription>Add items to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-32">Item #</TableHead>
                      <TableHead className="min-w-48">Description</TableHead>
                      <TableHead className="w-20">Quantity</TableHead>
                      <TableHead className="w-20">UOM</TableHead>
                      <TableHead className="w-24">Rate/Unit</TableHead>
                      <TableHead className="w-24">Weight</TableHead>
                      <TableHead className="w-20">Taxable?</TableHead>
                      <TableHead className="w-20">GST %</TableHead>
                      <TableHead className="w-24">GST Value</TableHead>
                      <TableHead className="w-24">Line Total</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.invoiceLines?.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>{line.lineNumber}</TableCell>
                        <TableCell>
                          <Select
                            value={line.itemId}
                            onValueChange={(value) => {
                              updateLineItem(index, 'itemId', value);
                              const item = items.find(i => i.id === value);
                              if (item) {
                                updateLineItem(index, 'itemDescription', item.description);
                                updateLineItem(index, 'uom', item.uom || 'Unit');
                                updateLineItem(index, 'gstPercentage', item.gstPercentage || 18);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.itemDescription}
                            onChange={(e) => updateLineItem(index, 'itemDescription', e.target.value)}
                            placeholder="Item description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.uom}
                            onChange={(e) => updateLineItem(index, 'uom', e.target.value)}
                            placeholder="Unit"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.totalWeight || 0}
                            disabled
                            className="bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={line.gstPercentage > 0}
                            onCheckedChange={(checked) => 
                              updateLineItem(index, 'gstPercentage', checked ? 18 : 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={line.gstPercentage}
                            onChange={(e) => updateLineItem(index, 'gstPercentage', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.gstValue.toFixed(2)}
                            disabled
                            className="bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.lineTotal.toFixed(2)}
                            disabled
                            className="bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={addLineItem}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Line Item</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section - Totals and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              {/* Totals */}
              <div className="w-full md:w-auto">
                <div className="space-y-2 text-right min-w-64">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total GST:</span>
                    <span className="font-medium">₹ {totalGst.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Invoice Total:</span>
                    <span>₹ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/finance/invoices")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitInvoice}
                >
                  Submit Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
