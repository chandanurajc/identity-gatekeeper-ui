import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Send, Search } from "lucide-react";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { divisionService } from "@/services/divisionService";
import { partnerSupplierService } from "@/services/partnerSupplierService";
import { itemService } from "@/services/itemService";
import { invoiceService } from "@/services/invoiceService";
import { organizationService } from "@/services/organizationService";
import { supabase } from "@/integrations/supabase/client";
import PermissionButton from "@/components/PermissionButton";
import type { InvoiceFormData, InvoiceType, InvoiceLineFormData, PaymentTerms, ReferenceTransactionSearchParams, ReferenceTransactionResult } from "@/types/invoice";
import { Organization } from "@/types/organization";
import { Item } from "@/types/item";

interface ShipToAddress {
  name: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  state: string;
  stateCode: number | null;
  country: string;
  phone: string;
  email?: string;
}

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

export default function InvoiceEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { user } = useAuth();
  const organizationId = getCurrentOrganizationId();

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    invoiceLines: []
  });

  const [suppliers, setSuppliers] = useState<Organization[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [billToInfo, setBillToInfo] = useState<BillToInfo | null>(null);
  const [remitToInfo, setRemitToInfo] = useState<RemitToInfo | null>(null);
  const [shipToAddress, setShipToAddress] = useState<ShipToAddress | null>(null);
  const [showShipToDialog, setShowShipToDialog] = useState(false);
  const [tempShipTo, setTempShipTo] = useState<ShipToAddress>({
    name: '',
    address1: '',
    address2: '',
    postalCode: '',
    city: '',
    state: '',
    stateCode: null,
    country: '',
    phone: '',
    email: ''
  });

  // Fetch invoice data
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", id, organizationId],
    queryFn: () => invoiceService.getInvoiceById(id!, organizationId!),
    enabled: !!id && !!organizationId,
  });

  // Fetch divisions for the dropdown
  const { data: divisions, isLoading: divisionsLoading } = useQuery({
    queryKey: ["divisions", organizationId],
    queryFn: () => divisionService.getDivisions(organizationId!),
    enabled: !!organizationId,
  });

  // Load invoice data into form when available
  useEffect(() => {
    if (invoice) {
      setFormData({
        divisionId: invoice.divisionId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        invoiceType: invoice.invoiceType,
        billToOrgId: invoice.billToOrgId,
        remitToOrgId: invoice.remitToOrgId,
        sameAsDivisionAddress: invoice.sameAsDivisionAddress,
        referenceTransactionType: invoice.referenceTransactionType,
        referenceTransactionNumber: invoice.referenceTransactionNumber,
        referenceTransactionDate: invoice.referenceTransactionDate,
        paymentTerms: invoice.paymentTerms,
        dueDate: invoice.dueDate,
        invoiceLines: invoice.invoiceLines?.map(line => ({
          lineNumber: line.lineNumber,
          itemId: line.itemId,
          itemDescription: line.itemDescription,
          quantity: line.quantity,
          uom: line.uom,
          weightPerUnit: line.weightPerUnit || 0,
          weightUom: line.weightUom || 'kg',
          totalWeight: line.totalWeight || 0,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          gstPercentage: line.gstPercentage,
          gstValue: line.gstValue,
          lineTotal: line.lineTotal
        })) || []
      });

      // Set address info
      setBillToInfo({
        name: invoice.billToName || '',
        address1: invoice.billToAddress1 || '',
        address2: invoice.billToAddress2 || '',
        city: invoice.billToCity || '',
        state: invoice.billToState || '',
        stateCode: invoice.billToStateCode || null,
        country: invoice.billToCountry || '',
        postalCode: invoice.billToPostalCode || '',
        email: invoice.billToEmail || '',
        phone: invoice.billToPhone || '',
        gstin: invoice.billToGstin || '',
        cin: invoice.billToCin || ''
      });

      setRemitToInfo({
        name: invoice.remitToName || '',
        address1: invoice.remitToAddress1 || '',
        address2: invoice.remitToAddress2 || '',
        city: invoice.remitToCity || '',
        state: invoice.remitToState || '',
        stateCode: invoice.remitToStateCode || null,
        country: invoice.remitToCountry || '',
        postalCode: invoice.remitToPostalCode || '',
        email: invoice.remitToEmail || '',
        phone: invoice.remitToPhone || '',
        gstin: invoice.remitToGstin || '',
        cin: invoice.remitToCin || ''
      });

      if (!invoice.sameAsDivisionAddress) {
        setShipToAddress({
          name: invoice.shipToName || '',
          address1: invoice.shipToAddress1 || '',
          address2: invoice.shipToAddress2 || '',
          city: invoice.shipToCity || '',
          state: invoice.shipToState || '',
          stateCode: invoice.shipToStateCode || null,
          country: invoice.shipToCountry || '',
          postalCode: invoice.shipToPostalCode || '',
          phone: invoice.shipToPhone || ''
        });
      }
    }
  }, [invoice]);

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
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      }
    };

    fetchData();
  }, [organizationId, toast]);

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  const handleSave = async () => {
    if (!id || !formData.divisionId || !formData.remitToOrgId) {
      toast({ title: "Error", description: "Division and Supplier are required", variant: "destructive" });
      return;
    }

    const mergedFormData = {
      ...formData,
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
      remitToCin: remitToInfo?.cin || '',
      shipToName: shipToAddress?.name || '',
      shipToAddress1: shipToAddress?.address1 || '',
      shipToAddress2: shipToAddress?.address2 || '',
      shipToCity: shipToAddress?.city || '',
      shipToState: shipToAddress?.state || '',
      shipToStateCode: shipToAddress?.stateCode || null,
      shipToCountry: shipToAddress?.country || '',
      shipToPostalCode: shipToAddress?.postalCode || '',
      shipToPhone: shipToAddress?.phone || '',
    };

    try {
      await invoiceService.updateInvoice(id, mergedFormData as InvoiceFormData, organizationId!, user?.email || '');
      toast({ title: "Success", description: "Invoice updated successfully" });
      navigate(`/finance/invoices/${id}`);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({ title: "Error", description: "Failed to update invoice", variant: "destructive" });
    }
  };

  const handleSendForApproval = async () => {
    if (!id || !invoice) return;
    
    if (invoice.status !== 'Draft') {
      toast({ title: "Error", description: "Invoice can only be sent for approval from Draft status", variant: "destructive" });
      return;
    }

    try {
      await invoiceService.updateInvoiceStatus(id, 'Awaiting Approval', organizationId!, user?.email || '', 'Sent for approval');
      toast({ title: "Success", description: "Invoice sent for approval" });
      navigate(`/finance/invoices/${id}`);
    } catch (error) {
      console.error("Error sending for approval:", error);
      toast({ title: "Error", description: "Failed to send for approval", variant: "destructive" });
    }
  };

  if (invoiceLoading || !invoice) {
    return <div className="p-6">Loading...</div>;
  }

  if (!organizationId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/finance/invoices/${id}`)}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Invoice</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSave}>
            Save Changes
          </Button>
          {invoice.status === 'Draft' && (
            <PermissionButton 
              permission="Send Invoice for Approval"
              onClick={handleSendForApproval}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send for Approval</span>
            </PermissionButton>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Invoice - {invoice.invoiceNumber}</h1>
        <p className="text-muted-foreground">Modify invoice details and line items</p>
      </div>

      {/* Invoice Header */}
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
                value={formData.invoiceNumber || ''}
                readOnly
                className="bg-muted/40"
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
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {billToInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
              <CardDescription>{billToInfo.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Address:</p>
                  <p>{billToInfo.address1}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">City:</p>
                  <p>{billToInfo.city}, {billToInfo.state}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {remitToInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Remit To</CardTitle>
              <CardDescription>{remitToInfo.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Address:</p>
                  <p>{remitToInfo.address1}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">City:</p>
                  <p>{remitToInfo.city}, {remitToInfo.state}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invoice Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Lines</CardTitle>
          <CardDescription>Items and quantities for this invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Line #</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="w-[100px]">Qty</TableHead>
                <TableHead className="w-[80px]">UOM</TableHead>
                <TableHead className="w-[100px]">Weight/Unit</TableHead>
                <TableHead className="w-[100px]">Total Weight</TableHead>
                <TableHead className="w-[120px]">Unit Price</TableHead>
                <TableHead className="w-[120px]">Total Price</TableHead>
                <TableHead className="w-[80px]">GST %</TableHead>
                <TableHead className="w-[120px]">GST Value</TableHead>
                <TableHead className="w-[120px]">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.invoiceLines?.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>{line.lineNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{line.itemDescription}</div>
                      <div className="text-xs text-muted-foreground">{line.itemId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>{line.uom}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.weightPerUnit || 0}
                      onChange={(e) => updateLineItem(index, 'weightPerUnit', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {line.totalWeight?.toFixed(2)} {line.weightUom}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>₹{line.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.gstPercentage}
                      onChange={(e) => updateLineItem(index, 'gstPercentage', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>₹{line.gstValue.toFixed(2)}</TableCell>
                  <TableCell>₹{line.lineTotal.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}