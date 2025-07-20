import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { z } from "zod";
import { CalendarIcon, Search, Loader2, FileText, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { usePaymentPermissions } from "@/hooks/usePaymentPermissions";
import { paymentService } from "@/services/paymentService";
import { organizationService } from "@/services/organizationService";
import { divisionService } from "@/services/divisionService";
import { PaymentFormData, PaymentType, PaymentMode, InvoiceSearchResult } from "@/types/payment";

const paymentFormSchema = z.object({
  paymentNumber: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentType: z.enum(["Invoice-based", "Ad-hoc"] as const),
  divisionId: z.string().min(1, "Division is required"),
  payeeOrganizationId: z.string().min(1, "Payee is required"),
  paymentMode: z.enum([
    "Bank Transfer", "UPI", "Cheque", "Cash", "Online Payment", "Wire Transfer"
  ] as const),
  referenceNumber: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  linkedInvoiceId: z.string().optional(),
  notes: z.string().optional(),
});

// Utility to convert all empty string fields to null
function convertEmptyStringsToNull(obj: any) {
  const result: any = {};
  for (const key in obj) {
    if (obj[key] === "") {
      result[key] = null;
    } else {
      result[key] = obj[key];
    }
  }
  console.log("Original form data:", obj);
  console.log("Processed form data:", result);
  return result;
}

export default function PaymentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canCreatePayments, canEditPayments, user } = usePaymentPermissions();
  
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSearchResult | null>(null);
  const [isInvoiceSearchOpen, setIsInvoiceSearchOpen] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      paymentType: "Invoice-based",
      paymentMode: "Bank Transfer",
      amount: 0,
    },
  });

  // Fetch divisions and suppliers
  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions", organizationId],
    queryFn: () => divisionService.getDivisions(organizationId),
    enabled: !!organizationId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["partners", organizationId],
    queryFn: () => organizationService.getPartnerOrganizations(organizationId),
    enabled: !!organizationId,
  });

  // Fetch payment for edit mode
  const { data: payment } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => paymentService.getPaymentById(id!),
    enabled: isEditMode && !!id,
  });

  // Generate payment number for new payments
  const { data: generatedPaymentNumber } = useQuery({
    queryKey: ["generatePaymentNumber", organizationId],
    queryFn: () => paymentService.generatePaymentNumber(organizationId),
    enabled: !isEditMode && !!organizationId,
  });

  // Set form values when payment is loaded
  useEffect(() => {
    try {
      if (payment) {
        console.log('Loaded payment:', payment);
        form.reset({
          paymentNumber: payment.paymentNumber,
          paymentDate: payment.paymentDate,
          paymentType: payment.paymentType,
          divisionId: payment.divisionId,
          payeeOrganizationId: payment.payeeOrganizationId,
          paymentMode: payment.paymentMode,
          referenceNumber: payment.referenceNumber || "",
          amount: payment.amount,
          linkedInvoiceId: payment.linkedInvoiceId || "",
          notes: payment.notes || "",
        });
        // Set selectedInvoice if linkedInvoice exists
        if (payment.linkedInvoice) {
          setSelectedInvoice({
            id: payment.linkedInvoice.id,
            invoiceNumber: payment.linkedInvoice.invoiceNumber,
            invoiceDate: payment.linkedInvoice.invoiceDate,
            supplierOrganizationId: payment.linkedInvoice.supplierOrganizationId,
            supplierName: payment.linkedInvoice.supplierName,
            totalInvoiceValue: payment.linkedInvoice.totalInvoiceValue,
            billToOrgId: payment.linkedInvoice.billToOrgId,
            remitToOrgId: payment.linkedInvoice.remitToOrgId,
            status: payment.linkedInvoice.status,
          });
        }
      }
    } catch (err) {
      console.error('Error in useEffect for payment:', err);
    }
  }, [payment, form]);

  // Fallback error UI
  if (isEditMode && payment === undefined) {
    return <div>Loading payment data...</div>;
  }
  if (isEditMode && payment === null) {
    return <div className="text-red-600">Error: Payment not found or failed to load.</div>;
  }

  // Set generated payment number
  useEffect(() => {
    if (generatedPaymentNumber && !isEditMode) {
      form.setValue("paymentNumber", generatedPaymentNumber);
    }
  }, [generatedPaymentNumber, isEditMode, form]);

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      paymentService.createPayment(data, organizationId, user?.email || ""),
    onSuccess: (payment) => {
      toast({ title: "Success", description: "Payment created successfully" });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      navigate(`/finance/payments/${payment.id}`);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      paymentService.updatePayment(id!, data, user?.email || ""),
    onSuccess: (payment) => {
      toast({ title: "Success", description: "Payment updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      navigate(`/finance/payments/${payment.id}`);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const watchPaymentType = form.watch("paymentType");
  const watchPayeeOrgId = form.watch("payeeOrganizationId");

  // Invoice search functionality
  const searchInvoices = async (supplierOrgId: string) => {
    try {
      const invoices = await paymentService.searchInvoices(organizationId, {
        supplierOrgId,
      });
      return invoices;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to search invoices" });
      return [];
    }
  };

  const handleInvoiceSelect = (invoice: InvoiceSearchResult) => {
    setSelectedInvoice(invoice);
    form.setValue("linkedInvoiceId", invoice.id);
    form.setValue("amount", invoice.totalInvoiceValue);
    setIsInvoiceSearchOpen(false);
  };

  const onSubmit = (data: PaymentFormData) => {
    // Convert all empty string fields to null
    const processedData = convertEmptyStringsToNull(data);
    if (isEditMode) {
      updatePaymentMutation.mutate(processedData);
    } else {
      createPaymentMutation.mutate(processedData);
    }
  };

  const canEdit = (isEditMode && canEditPayments && payment?.status === "Created") || 
                 (!isEditMode && canCreatePayments);

  if (isEditMode && !payment) {
    return <div>Loading...</div>;
  }

  if (!canEdit && !isEditMode) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to create payments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Edit Payment" : "Create Payment"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? "Update payment details" : "Create a new payment transaction"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="paymentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Invoice-based">Invoice-based</SelectItem>
                          <SelectItem value="Ad-hoc">Ad-hoc</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="divisionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {divisions.map((division) => (
                            <SelectItem key={division.id} value={division.id}>
                              {division.name}
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
                  name="payeeOrganizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payee *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
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
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Online Payment">Online Payment</SelectItem>
                          <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="UTR/Cheque/Transaction ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          placeholder="0.00"
                          disabled={!!selectedInvoice} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Invoice Linking - Only for Invoice-based payments */}
            {watchPaymentType === "Invoice-based" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Invoice Linking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedInvoice ? (
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{selectedInvoice.invoiceNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedInvoice.supplierName} • ₹{selectedInvoice.totalInvoiceValue.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(selectedInvoice.invoiceDate), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(null);
                            form.setValue("linkedInvoiceId", "");
                            form.setValue("amount", 0);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No invoice selected. Select a payee first, then search for invoices.
                      </p>
                      <Dialog open={isInvoiceSearchOpen} onOpenChange={setIsInvoiceSearchOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline"
                            disabled={!watchPayeeOrgId}
                            className="gap-2"
                          >
                            <Search className="h-4 w-4" />
                            Search Invoices
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Select Invoice</DialogTitle>
                          </DialogHeader>
                          <InvoiceSearchDialog
                            payeeOrgId={watchPayeeOrgId}
                            onSelect={handleInvoiceSelect}
                            onClose={() => setIsInvoiceSearchOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Additional notes or comments"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Hidden field for linkedInvoiceId */}
            <FormField
              control={form.control}
              name="linkedInvoiceId"
              render={({ field }) => (
                <input type="hidden" {...field} />
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/finance/payments")}
              >
                Cancel
              </Button>
              {canEdit && (
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}
                >
                  {(createPaymentMutation.isPending || updatePaymentMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Update Payment" : "Create Payment"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

// Invoice Search Dialog Component
function InvoiceSearchDialog({ 
  payeeOrgId, 
  onSelect, 
  onClose 
}: { 
  payeeOrgId: string; 
  onSelect: (invoice: InvoiceSearchResult) => void;
  onClose: () => void;
}) {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const [invoices, setInvoices] = useState<InvoiceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payeeOrgId) {
      const fetchInvoices = async () => {
        setLoading(true);
        try {
          const results = await paymentService.searchInvoices(organizationId, {
            supplierOrgId: payeeOrgId,
          });
          setInvoices(results);
        } catch (error) {
          console.error("Error fetching invoices:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvoices();
    }
  }, [payeeOrgId, organizationId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No approved invoices found for this supplier.
        </p>
      ) : (
        <div className="grid gap-2 max-h-96 overflow-y-auto">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted"
              onClick={() => onSelect(invoice)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{invoice.totalInvoiceValue.toLocaleString()}</p>
                  <Badge variant="outline">{invoice.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}