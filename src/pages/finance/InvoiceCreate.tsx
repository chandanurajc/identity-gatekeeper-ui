
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { divisionService } from "@/services/divisionService";
import type { InvoiceFormData, InvoiceType } from "@/types/invoice";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: 'Payable',
    paymentTerms: 'Net 30',
    sameAsDivisionAddress: true,
    invoiceLines: []
  });

  // Fetch divisions for the dropdown
  const { data: divisions, isLoading: divisionsLoading } = useQuery({
    queryKey: ["divisions", organizationId],
    queryFn: () => divisionService.getDivisions(organizationId!),
    enabled: !!organizationId,
  });

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Invoice form data:", formData);
    // TODO: Implement invoice creation
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
        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <CardDescription>Basic invoice details and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber || 'Auto-generated'}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="Will be auto-generated"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceType">Invoice Type *</Label>
                <Select
                  value={formData.invoiceType}
                  onValueChange={(value: InvoiceType) => handleInputChange('invoiceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Payable">Payable</SelectItem>
                    <SelectItem value="Receivable">Receivable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Party Details */}
        <Card>
          <CardHeader>
            <CardTitle>Party Details</CardTitle>
            <CardDescription>
              {formData.invoiceType === 'Payable' 
                ? 'Configure bill to and remit to organizations' 
                : 'Configure remit to and bill to organizations'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {formData.invoiceType === 'Payable' ? (
                <div>
                  <p><strong>Bill To:</strong> Current organization (default)</p>
                  <p><strong>Remit To:</strong> Select from partner organizations</p>
                </div>
              ) : (
                <div>
                  <p><strong>Remit To:</strong> Current organization (default)</p>
                  <p><strong>Bill To:</strong> Select from partner organizations</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {formData.invoiceType === 'Payable' ? 'Bill To Organization' : 'Remit To Organization'}
                </Label>
                <Input 
                  value="Current Organization (Auto-filled)" 
                  disabled 
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.invoiceType === 'Payable' ? 'Remit To Organization *' : 'Bill To Organization *'}
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder">Organizations will load from Partner Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) => handleInputChange('paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  placeholder="Calculated based on payment terms"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Add items to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Line items functionality will be implemented next</p>
              <Button variant="outline" disabled className="mt-2">
                Add Line Item
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/finance/invoices")}
          >
            Cancel
          </Button>
          
          <div className="flex space-x-2">
            <Button type="submit" variant="outline">
              Save as Draft
            </Button>
            <Button type="submit" disabled>
              Send for Approval
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
