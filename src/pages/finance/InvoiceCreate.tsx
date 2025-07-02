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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { divisionService } from "@/services/divisionService";
import { partnerSupplierService } from "@/services/partnerSupplierService";
import { itemService } from "@/services/itemService";
import { invoiceService } from "@/services/invoiceService";
import PermissionButton from "@/components/PermissionButton";
import type { InvoiceFormData, InvoiceType, InvoiceLineFormData, PaymentTerms } from "@/types/invoice";
import { Organization } from "@/types/organization";
import { Item } from "@/types/item";
import { Division } from "@/types/division";

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

interface GSTBreakdown {
  gstPercentage: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
}

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { user } = useAuth();
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
    phone: ''
  });

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
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      }
    };

    fetchData();
  }, [organizationId, toast]);

  // Generate invoice number on load
  useEffect(() => {
    const generateInvoiceNumber = async () => {
      if (!organizationId) return;
      
      try {
        const invoiceNumber = await invoiceService.generateInvoiceNumber(organizationId);
        setFormData(prev => ({
          ...prev,
          invoiceNumber
        }));
      } catch (error) {
        console.error("Error generating invoice number:", error);
      }
    };

    generateInvoiceNumber();
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

  // Load division Bill To info when division changes
  useEffect(() => {
    if (formData.divisionId) {
      loadDivisionBillToInfo(formData.divisionId);
    }
  }, [formData.divisionId]);

  // Load supplier Remit To info when supplier changes
  useEffect(() => {
    if (formData.remitToOrgId) {
      loadSupplierRemitToInfo(formData.remitToOrgId);
    }
  }, [formData.remitToOrgId]);

  // Load ship to address when same as division is checked
  useEffect(() => {
    if (formData.sameAsDivisionAddress && formData.divisionId) {
      loadDivisionRegisteredLocation(formData.divisionId);
    } else if (!formData.sameAsDivisionAddress) {
      setShipToAddress(null);
    }
  }, [formData.sameAsDivisionAddress, formData.divisionId]);

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
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier) {
        const remitToContact = supplier.contacts?.find(c => c.type === 'Remit To' || c.type === 'Registered location');
        const gstinRef = supplier.references?.find(r => r.type === 'GST');
        const cinRef = supplier.references?.find(r => r.type === 'CIN');
        
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

  const loadDivisionRegisteredLocation = async (divisionId: string) => {
    try {
      const division = await divisionService.getDivisionById(divisionId);
      if (division) {
        const registeredContact = division.contacts?.find(c => c.type === 'Registered location');
        if (registeredContact) {
          setShipToAddress({
            name: `${registeredContact.firstName} ${registeredContact.lastName || ''}`.trim(),
            address1: registeredContact.address1 || '',
            address2: registeredContact.address2 || '',
            city: registeredContact.city || '',
            state: registeredContact.state || '',
            stateCode: registeredContact.stateCode || null,
            country: registeredContact.country || '',
            postalCode: registeredContact.postalCode || '',
            phone: registeredContact.phoneNumber || ''
          });
        }
      }
    } catch (error) {
      console.error("Error loading division registered location:", error);
    }
  };

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

  const handleItemChange = async (lineIndex: number, itemId: string) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      updateLineItem(lineIndex, 'itemId', itemId);
      updateLineItem(lineIndex, 'itemDescription', selectedItem.description);
      updateLineItem(lineIndex, 'uom', selectedItem.uom || 'Unit');
      updateLineItem(lineIndex, 'gstPercentage', selectedItem.gstPercentage || 18);
      
      // Auto-fetch item price based on supplier
      if (formData.remitToOrgId) {
        try {
          const itemWithCosts = await itemService.getItemById(itemId);
          if (itemWithCosts?.costs) {
            const supplierCost = itemWithCosts.costs.find(cost => cost.supplierId === formData.remitToOrgId);
            if (supplierCost) {
              updateLineItem(lineIndex, 'unitPrice', supplierCost.cost);
            }
          }
        } catch (error) {
          console.error("Error fetching item cost:", error);
        }
      }
    }
  };

  const handleShipToSave = () => {
    setShipToAddress(tempShipTo);
    setShowShipToDialog(false);
  };

  const calculateTotals = () => {
    const lines = formData.invoiceLines || [];
    const subtotal = lines.reduce((sum, line) => sum + line.totalPrice, 0);
    const totalGst = lines.reduce((sum, line) => sum + line.gstValue, 0);
    const total = subtotal + totalGst;
    
    return { subtotal, totalGst, total };
  };

  const calculateGSTBreakdown = (): GSTBreakdown[] => {
    const lines = formData.invoiceLines || [];
    const gstGroups = new Map<number, { taxableAmount: number; gstValue: number }>();
    
    lines.forEach(line => {
      const existing = gstGroups.get(line.gstPercentage) || { taxableAmount: 0, gstValue: 0 };
      gstGroups.set(line.gstPercentage, {
        taxableAmount: existing.taxableAmount + line.totalPrice,
        gstValue: existing.gstValue + line.gstValue
      });
    });

    const breakdown: GSTBreakdown[] = [];
    gstGroups.forEach((value, gstPercentage) => {
      const isSameState = billToInfo?.stateCode === shipToAddress?.stateCode;
      
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

  const { subtotal, totalGst, total } = calculateTotals();
  const gstBreakdown = calculateGSTBreakdown();

  const handleSaveDraft = async () => {
    if (!formData.divisionId || !formData.remitToOrgId) {
      toast({ title: "Error", description: "Division and Supplier are required", variant: "destructive" });
      return;
    }

    try {
      await invoiceService.createInvoice(formData as InvoiceFormData, organizationId!, user?.email || '');
      toast({ title: "Success", description: "Invoice saved as draft" });
      navigate("/finance/invoices");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({ title: "Error", description: "Failed to save draft", variant: "destructive" });
    }
  };

  const handleSendForApproval = async () => {
    // TODO: Implement send for approval with status update
    toast({ title: "Info", description: "Send for approval functionality coming soon" });
  };

  const handleApprove = async () => {
    // TODO: Implement approve functionality
    toast({ title: "Info", description: "Approve functionality coming soon" });
  };

  const handleReject = async () => {
    // TODO: Implement reject functionality
    toast({ title: "Info", description: "Reject functionality coming soon" });
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

      <div className="space-y-6">
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

        {/* Bill To Card */}
        {billToInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
              <CardDescription>Billing information from selected division</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={billToInfo.name} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input value={billToInfo.gstin} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>CIN</Label>
                  <Input value={billToInfo.cin} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Address 1</Label>
                  <Input value={billToInfo.address1} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={billToInfo.city} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={billToInfo.state} disabled className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Remit To Card */}
        {remitToInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Remit To</CardTitle>
              <CardDescription>Payment information from selected supplier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={remitToInfo.name} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input value={remitToInfo.gstin} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>CIN</Label>
                  <Input value={remitToInfo.cin} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Address 1</Label>
                  <Input value={remitToInfo.address1} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={remitToInfo.city} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={remitToInfo.state} disabled className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ship To Section */}
        <Card>
          <CardHeader>
            <CardTitle>Ship To</CardTitle>
            <CardDescription>Shipping address for this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sameAsDivision"
                  checked={formData.sameAsDivisionAddress}
                  onCheckedChange={(checked) => handleInputChange('sameAsDivisionAddress', checked)}
                />
                <Label htmlFor="sameAsDivision">Same as division registered location?</Label>
              </div>
              
              {!formData.sameAsDivisionAddress && (
                <Dialog open={showShipToDialog} onOpenChange={setShowShipToDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ship To Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Ship To Address</DialogTitle>
                      <DialogDescription>
                        Enter the shipping address details
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="shipToName">Name</Label>
                        <Input
                          id="shipToName"
                          value={tempShipTo.name}
                          onChange={(e) => setTempShipTo(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipToAddress1">Address 1</Label>
                        <Input
                          id="shipToAddress1"
                          value={tempShipTo.address1}
                          onChange={(e) => setTempShipTo(prev => ({ ...prev, address1: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipToAddress2">Address 2</Label>
                        <Input
                          id="shipToAddress2"
                          value={tempShipTo.address2}
                          onChange={(e) => setTempShipTo(prev => ({ ...prev, address2: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shipToCity">City</Label>
                          <Input
                            id="shipToCity"
                            value={tempShipTo.city}
                            onChange={(e) => setTempShipTo(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipToState">State</Label>
                          <Input
                            id="shipToState"
                            value={tempShipTo.state}
                            onChange={(e) => setTempShipTo(prev => ({ ...prev, state: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shipToCountry">Country</Label>
                        <Input
                          id="shipToCountry"
                          value={tempShipTo.country}
                          onChange={(e) => setTempShipTo(prev => ({ ...prev, country: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowShipToDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleShipToSave}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {shipToAddress && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={shipToAddress.name} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Address 1</Label>
                  <Input value={shipToAddress.address1} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={shipToAddress.city} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={shipToAddress.state} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={shipToAddress.country} disabled className="bg-muted" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Line Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Invoice Line Items</CardTitle>
                <CardDescription>Add items to this invoice</CardDescription>
              </div>
              <Button onClick={addLineItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full rounded border border-muted/30">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="py-1 px-2 w-[36px]">#</TableHead>
                      <TableHead className="py-1 px-2 min-w-[200px]">Item *</TableHead>
                      <TableHead className="py-1 px-2 min-w-[200px]">Desc.</TableHead>
                      <TableHead className="py-1 px-2 min-w-[80px] text-center">Qty *</TableHead>
                      <TableHead className="py-1 px-2 min-w-[80px]">UOM *</TableHead>
                      <TableHead className="py-1 px-2 min-w-[100px] text-right">Rate *</TableHead>
                      <TableHead className="py-1 px-2 min-w-[100px] text-right">Total</TableHead>
                      <TableHead className="py-1 px-2 min-w-[80px] text-center">GST %</TableHead>
                      <TableHead className="py-1 px-2 min-w-[100px] text-right">GST Val</TableHead>
                      <TableHead className="py-1 px-2 min-w-[100px] text-right">Weight/Unit</TableHead>
                      <TableHead className="py-1 px-2 min-w-[100px] text-right">Total Weight</TableHead>
                      <TableHead className="py-1 px-2 min-w-[120px] text-right">Line Total</TableHead>
                      <TableHead className="py-1 px-2 w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.invoiceLines?.map((line, index) => {
                      const selectedItem = items.find(item => item.id === line.itemId);
                      return (
                        <TableRow key={index}>
                          <TableCell className="p-1 text-center">{line.lineNumber}</TableCell>
                          <TableCell className="p-1">
                            <div className="space-y-1">
                              <Input
                                placeholder="Search by ID"
                                className="mb-1 h-8"
                              />
                              <Select
                                value={line.itemId}
                                onValueChange={(value) => handleItemChange(index, value)}
                              >
                                <SelectTrigger className="h-8">
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
                            </div>
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              value={selectedItem?.description || line.itemDescription || ""}
                              readOnly
                              className="bg-muted/40 h-8"
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.quantity || ""}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              value={line.uom || ""}
                              readOnly
                              className="bg-muted/40 h-8"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.unitPrice || ""}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-right"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.totalPrice?.toFixed(2) || "0.00"}
                              readOnly
                              className="bg-muted/40 h-8 text-right"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.gstPercentage || ""}
                              onChange={(e) => updateLineItem(index, 'gstPercentage', parseFloat(e.target.value) || 0)}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.gstValue?.toFixed(2) || "0.00"}
                              readOnly
                              className="bg-muted/40 h-8 text-right"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              value={selectedItem?.weight ? `${selectedItem.weight} ${selectedItem.weightUom || 'kg'}` : ""}
                              readOnly
                              className="bg-muted/40 h-8 text-right text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              value={line.totalWeight ? `${line.totalWeight.toFixed(2)} ${line.weightUom || 'kg'}` : ""}
                              readOnly
                              className="bg-muted/40 h-8 text-right text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.lineTotal?.toFixed(2) || "0.00"}
                              readOnly
                              className="bg-muted/40 h-8 text-right font-semibold"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                              onClick={() => removeLineItem(index)}
                              aria-label="Remove line"
                            >
                              <span className="sr-only">Remove</span>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!formData.invoiceLines || formData.invoiceLines.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center text-muted-foreground py-3">
                          No line items added yet. Click "Add Line" to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST Summary */}
        {gstBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>GST Summary</CardTitle>
              <CardDescription>Breakdown of GST calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GST %</TableHead>
                      <TableHead>Taxable Amount</TableHead>
                      <TableHead>CGST</TableHead>
                      <TableHead>SGST</TableHead>
                      <TableHead>IGST</TableHead>
                      <TableHead>Total GST</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gstBreakdown.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.gstPercentage}%</TableCell>
                        <TableCell>₹{item.taxableAmount.toFixed(2)}</TableCell>
                        <TableCell>₹{item.cgstAmount.toFixed(2)}</TableCell>
                        <TableCell>₹{item.sgstAmount.toFixed(2)}</TableCell>
                        <TableCell>₹{item.igstAmount.toFixed(2)}</TableCell>
                        <TableCell>₹{item.totalGstAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subtotal (Before Tax)</Label>
                <Input value={`₹${subtotal.toFixed(2)}`} disabled className="bg-muted font-semibold" />
              </div>
              <div className="space-y-2">
                <Label>Total GST</Label>
                <Input value={`₹${totalGst.toFixed(2)}`} disabled className="bg-muted font-semibold" />
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input value={`₹${total.toFixed(2)}`} disabled className="bg-muted font-bold text-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => navigate("/finance/invoices")}>
                Cancel
              </Button>
              
              <PermissionButton
                permission="Create Invoice"
                onClick={handleSaveDraft}
                variant="secondary"
              >
                Save as Draft
              </PermissionButton>
              
              <PermissionButton
                permission="Send Invoice for Approval"
                onClick={handleSendForApproval}
              >
                Send for Approval
              </PermissionButton>
              
              <PermissionButton
                permission="Approve Invoice"
                onClick={handleApprove}
                variant="default"
              >
                Approve
              </PermissionButton>
              
              <PermissionButton
                permission="Reject Invoice"
                onClick={handleReject}
                variant="destructive"
              >
                Reject
              </PermissionButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}