import React from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { accountingRulesService } from "@/services/accountingRulesService";
import { chartOfAccountsService } from "@/services/chartOfAccountsService";
import { divisionService } from "@/services/divisionService";
import type { AccountingRuleFormData, RuleTransactionCategory } from "@/types/accountingRules";
import type { Division } from "@/types/division";
import { PAYMENT_AMOUNT_SOURCES } from "@/types/payment";

const transactionCategories: RuleTransactionCategory[] = ['Invoice', 'PO', 'Payment', 'Inventory Transfer'];
const triggeringActions = ['Invoice Approved', 'PO Created', 'Payment Processed', 'Purchase order receive', 'Payment Created', 'Payment Approved'];
const inventoryTransferTriggeringActions = [
  { label: 'Transfer initiated', value: 'Transfer initiated' },
  { label: 'Transfer confirmed', value: 'Transfer confirmed' },
];
const paymentTriggeringActions = [
  { label: 'Payment created', value: 'Payment Created', status: 'Created' },
  { label: 'Payment approved', value: 'Payment Approved', status: 'Approved' },
];
const poAmountSourceOptions = [
  'Item total price',
  'Total GST Value',
  'Total PO Value',
  'Total PO CGST',
  'Total PO SGST',
  'Total PO IGST',
];
const amountSourceOptions = [
  'Item total price',
  'Total GST value',
  'sum of line',
  'Total item value',
  'Total invoice value',
];
const invoiceAmountSourceOptions = [
  'Total invoice value',
  'Total item value',
  'Total GST value',
  'CGST Amount',
  'SGST Amount',
  'IGST Amount',
];
const paymentAmountSourceOptions = [...PAYMENT_AMOUNT_SOURCES];

const formSchema = z.object({
  ruleName: z.string().min(1, "Rule name is required"),
  divisionId: z.string().optional(),
  destinationDivisionId: z.string().optional(),
  transactionCategory: z.enum(['Invoice', 'PO', 'Payment', 'Inventory Transfer']),
  triggeringAction: z.string(),
  transactionReference: z.string().min(1, "Transaction reference is required"),
  transactionType: z.string().optional(),
  lines: z.array(z.object({
    lineNumber: z.number(),
    debitAccountCode: z.string().optional(),
    creditAccountCode: z.string().optional(),
    amountSource: z.string().min(1, "Amount source is required"),
    enableSubledger: z.boolean().default(false),
  })).min(1, "At least one line is required"),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

interface AccountingRulesFormProps {
  mode: 'create' | 'edit';
}

export default function AccountingRulesForm({ mode }: AccountingRulesFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const form = useForm<AccountingRuleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ruleName: "",
      transactionCategory: "Invoice",
      triggeringAction: "Invoice Approved",
      transactionReference: "",
      transactionType: "",
      lines: [{
        lineNumber: 1,
        debitAccountCode: undefined,
        creditAccountCode: undefined,
        amountSource: "",
        enableSubledger: false,
      }],
      status: "Active",
    },
  });

  // Load chart of accounts for dropdowns
  const { data: chartOfAccounts = [] } = useQuery({
    queryKey: ['chart-of-accounts', organizationId],
    queryFn: () => organizationId ? chartOfAccountsService.getChartOfAccounts(organizationId) : Promise.resolve([]),
    enabled: !!organizationId,
  });

  // Load existing rule for edit mode
  const { data: existingRule, isLoading } = useQuery({
    queryKey: ['accounting-rule', id],
    queryFn: () => id && organizationId ? accountingRulesService.getAccountingRuleById(id, organizationId) : null,
    enabled: mode === 'edit' && !!id && !!organizationId,
  });

  // Load active divisions
  const { data: divisions = [] } = useQuery<Division[]>({
    queryKey: ["divisions", organizationId],
    queryFn: () => organizationId ? divisionService.getDivisions(organizationId) : Promise.resolve([]),
    enabled: !!organizationId,
  });

  // Reset form when data loads
  React.useEffect(() => {
    if (existingRule) {
      form.reset({
        ruleName: existingRule.ruleName,
        divisionId: existingRule.divisionId || "",
        transactionCategory: existingRule.transactionCategory,
        triggeringAction: existingRule.triggeringAction,
        transactionReference: existingRule.transactionReference,
        transactionType: existingRule.transactionType || "",
        lines: existingRule.lines.length > 0 ? existingRule.lines : [{
          lineNumber: 1,
          debitAccountCode: undefined,
          creditAccountCode: undefined,
          amountSource: "",
          enableSubledger: false,
        }],
        status: existingRule.status,
      });
    }
  }, [existingRule, form]);

  const createMutation = useMutation({
    mutationFn: (data: AccountingRuleFormData) =>
      organizationId ? accountingRulesService.createAccountingRule(data, organizationId, user?.email || '') : Promise.reject('No organization'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Accounting rule created successfully",
      });
      navigate('/finance/accounting-rules');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create rule",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AccountingRuleFormData) =>
      id && organizationId ? accountingRulesService.updateAccountingRule(id, data, organizationId, user?.email || '') : Promise.reject('Missing ID or organization'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Accounting rule updated successfully",
      });
      navigate('/finance/accounting-rules');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update rule",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountingRuleFormData) => {
    // Ensure line numbers are sequential
    const processedData = {
      ...data,
      lines: data.lines.map((line, index) => ({
        ...line,
        lineNumber: index + 1,
      })),
    };

    if (mode === 'create') {
      createMutation.mutate(processedData);
    } else {
      updateMutation.mutate(processedData);
    }
  };

  const addLine = () => {
    const currentLines = form.getValues("lines");
    const newLine = {
      lineNumber: currentLines.length + 1,
      debitAccountCode: undefined,
      creditAccountCode: undefined,
      amountSource: "",
      enableSubledger: false,
    };
    form.setValue("lines", [...currentLines, newLine]);
  };

  // Database field options for transaction reference dropdown
  const paymentDatabaseFields = [
    { value: "payment.payment_number", label: "Payment - Payment Number" },
    { value: "payment.reference_number", label: "Payment - Reference Number" },
  ];
  const databaseFields = [
    { value: "purchase_order.po_number", label: "Purchase Order - PO Number" },
    { value: "purchase_order.tracking_number", label: "Purchase Order - Tracking Number" },
    { value: "purchase_order.notes", label: "Purchase Order - Notes" },
    { value: "invoice.invoice_number", label: "Invoice - Invoice Number" },
    { value: "invoice.supplier_invoice_number", label: "Invoice - Supplier Invoice Number" },
    { value: "invoice.reference_transaction_number", label: "Invoice - Reference Transaction Number" },
    { value: "invoice.notes", label: "Invoice - Notes" },
    { value: "journal_header.transaction_reference", label: "Journal - Transaction Reference" },
    { value: "general_ledger.reference_number", label: "General Ledger - Reference Number" },
    { value: "general_ledger.notes", label: "General Ledger - Notes" },
  ];

  const removeLine = (index: number) => {
    const currentLines = form.getValues("lines");
    if (currentLines.length > 1) {
      form.setValue("lines", currentLines.filter((_, i) => i !== index));
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-8 max-w-6xl">{/* Increased from max-w-4xl to max-w-6xl */}
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create Accounting Rule' : 'Edit Accounting Rule'}</CardTitle>
          <CardDescription>
            {mode === 'create' ? 'Add a new accounting rule for automated journal entries' : 'Update accounting rule information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="ruleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter rule name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Division (always visible) */}
                <FormField
                  control={form.control}
                  name="divisionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select division (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {divisions.filter(div => div.status === 'active').map((division) => (
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

                {/* Transaction Type (existing) */}
                <FormField
                  control={form.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter transaction type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Destination Division (always visible) */}
                <FormField
                  control={form.control}
                  name="destinationDivisionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Division</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination division (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {divisions.filter(div => div.status === 'active').map((division) => (
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
                  name="transactionCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {transactionCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
                  name="triggeringAction"
                  render={({ field }) => {
                    const transactionCategory = form.watch('transactionCategory');
                    let actions: { label: string; value: string }[] = [];
                    if (transactionCategory === 'Payment') {
                      actions = paymentTriggeringActions;
                    } else if (transactionCategory === 'Inventory Transfer') {
                      actions = inventoryTransferTriggeringActions;
                    } else {
                      actions = triggeringActions.map(a => ({ label: a, value: a }));
                    }
                    return (
                      <FormItem>
                        <FormLabel>Triggering Action *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select triggering action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {actions.map((action) => (
                              <SelectItem key={action.value} value={action.value}>
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="transactionReference"
                  render={({ field }) => {
                    const transactionCategory = form.watch('transactionCategory');
                    let fields = databaseFields;
                    if (transactionCategory === 'Payment') {
                      fields = paymentDatabaseFields;
                    } else if (transactionCategory === 'Inventory Transfer') {
                      fields = [
                        { value: 'inventory_transfer.transfer_id', label: 'Transfer ID' },
                      ];
                    }
                    return (
                      <FormItem>
                        <FormLabel>Transaction Reference *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select database field" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-w-xs">
                            {fields.map((dbField) => (
                              <SelectItem key={dbField.value} value={dbField.value} className="text-sm">
                                <div className="flex flex-col">
                                  <span className="font-medium">{dbField.label}</span>
                                  <span className="text-xs text-muted-foreground">{dbField.value}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter transaction type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lines Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Accounting Lines</h3>
                  <Button type="button" onClick={addLine} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line
                  </Button>
                </div>

                {form.watch("lines").map((line, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">{/* Changed from md:grid-cols-5 to lg:grid-cols-6 */}
                      <div>
                        <FormLabel>Line {index + 1}</FormLabel>
                        <div className="text-sm font-medium p-2 bg-muted rounded">
                          {index + 1}
                        </div>
                      </div>
                      
                       <FormField
                        control={form.control}
                        name={`lines.${index}.debitAccountCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit Account</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === '' ? undefined : value)} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                               <SelectContent className="max-w-md">
                                 <SelectItem value="">Blank</SelectItem>
                                 {chartOfAccounts.map((account) => (
                                   <SelectItem key={account.id} value={account.accountCode} className="text-sm">
                                     <div className="flex flex-col py-1">
                                       <span className="font-medium">{account.accountCode}</span>
                                       <span className="text-xs text-muted-foreground truncate">{account.accountName}</span>
                                     </div>
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
                        name={`lines.${index}.creditAccountCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Account</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === '' ? undefined : value)} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                               <SelectContent className="max-w-md">
                                 <SelectItem value="">Blank</SelectItem>
                                 {chartOfAccounts.map((account) => (
                                   <SelectItem key={account.id} value={account.accountCode} className="text-sm">
                                     <div className="flex flex-col py-1">
                                       <span className="font-medium">{account.accountCode}</span>
                                       <span className="text-xs text-muted-foreground truncate">{account.accountName}</span>
                                     </div>
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
                        name={`lines.${index}.amountSource`}
                        render={({ field }) => {
                          const transactionCategory = form.watch('transactionCategory');
                          let options = amountSourceOptions;
                          if (transactionCategory === 'PO') {
                            options = poAmountSourceOptions;
                          } else if (transactionCategory === 'Invoice') {
                            options = invoiceAmountSourceOptions;
                          } else if (transactionCategory === 'Payment') {
                            options = paymentAmountSourceOptions;
                          } else if (transactionCategory === 'Inventory Transfer') {
                            options = ['Inventory cost'];
                          }
                          return (
                            <FormItem>
                              <FormLabel>Amount Source *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <div className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.enableSubledger`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Subledger</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("lines").length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/finance/accounting-rules')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Rule' : 'Update Rule'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}