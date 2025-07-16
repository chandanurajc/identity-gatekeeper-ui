
import React from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { accountingRulesService } from "@/services/accountingRulesService";
import { divisionService } from "@/services/divisionService";
import type { AccountingRuleFormData, RuleTransactionCategory, RuleAction, PO_AMOUNT_SOURCES, GENERAL_AMOUNT_SOURCES } from "@/types/accountingRules";
import { Trash2, Plus } from "lucide-react";

const transactionCategories: RuleTransactionCategory[] = ['Invoice', 'PO', 'Payment'];
const triggeringActions: RuleAction[] = ['Invoice Approved', 'PO Created', 'Payment Processed', 'Purchase order receive'];

// Define amount sources based on transaction category
const getAmountSourcesForTransactionCategory = (transactionCategory?: string) => {
  if (transactionCategory === 'PO') {
    return [
      'Total GST value',
      'Total GST Value', 
      'sum of line',
      'Total PO Value',
      'Item total price',
      'Total PO CGST',
      'Total PO SGST', 
      'Total PO IGST'
    ];
  }
  
  return [
    'Total GST value',
    'Total GST Value',
    'sum of line', 
    'Item total price'
  ];
};

const formSchema = z.object({
  ruleName: z.string().min(1, "Rule name is required"),
  divisionId: z.string().optional(),
  transactionCategory: z.enum(['Invoice', 'PO', 'Payment']),
  transactionReference: z.string().min(1, "Transaction reference is required"),
  transactionType: z.string().optional(),
  triggeringAction: z.enum(['Invoice Approved', 'PO Created', 'Payment Processed', 'Purchase order receive']),
  status: z.enum(['Active', 'Inactive']),
  lines: z.array(z.object({
    lineNumber: z.number(),
    debitAccountCode: z.string().optional(),
    creditAccountCode: z.string().optional(),
    amountSource: z.string().min(1, "Amount source is required"),
    enableSubledger: z.boolean(),
  })).min(1, "At least one line is required"),
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
  const queryClient = useQueryClient();

  const [watchedTransactionType, setWatchedTransactionType] = useState<string>('');

  const form = useForm<AccountingRuleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ruleName: "",
      divisionId: "",
      transactionCategory: "PO",
      transactionReference: "",
      transactionType: "",
      triggeringAction: "PO Created",
      status: "Active",
      lines: [
        {
          lineNumber: 1,
          debitAccountCode: "",
          creditAccountCode: "",
          amountSource: "",
          enableSubledger: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // Watch transaction category to update amount source options
  const transactionCategory = form.watch('transactionCategory');
  React.useEffect(() => {
    setWatchedTransactionType(transactionCategory || '');
  }, [transactionCategory]);

  // Fetch divisions
  const { data: divisions = [], isLoading: divisionsLoading, error: divisionsError } = useQuery({
    queryKey: ['divisions', organizationId],
    queryFn: () => organizationId ? divisionService.getDivisions(organizationId) : Promise.resolve([]),
    enabled: !!organizationId,
  });

  // Load existing rule for edit mode
  const { data: existingRule, isLoading } = useQuery({
    queryKey: ['accountingRule', id],
    queryFn: () => id && organizationId ? accountingRulesService.getAccountingRuleById(id, organizationId) : null,
    enabled: mode === 'edit' && !!id && !!organizationId,
  });

  // Reset form when data loads
  React.useEffect(() => {
    if (existingRule) {
      console.log('Resetting form with existing rule:', existingRule);
      form.reset({
        ruleName: existingRule.ruleName,
        divisionId: existingRule.divisionId || "",
        transactionCategory: existingRule.transactionCategory,
        transactionReference: existingRule.transactionReference,
        transactionType: existingRule.transactionType || "",
        triggeringAction: existingRule.triggeringAction,
        status: existingRule.status,
        lines: existingRule.lines || [],
      });
      setWatchedTransactionType(existingRule.transactionType || '');
    }
  }, [existingRule, form]);

  const createMutation = useMutation({
    mutationFn: (data: AccountingRuleFormData) =>
      organizationId ? accountingRulesService.createAccountingRule(data, organizationId, user?.email || '') : Promise.reject('No organization'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountingRules'] });
      toast({
        title: "Success",
        description: "Accounting rule created successfully",
      });
      navigate('/finance/accounting-rules');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create accounting rule",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AccountingRuleFormData) =>
      id && organizationId ? accountingRulesService.updateAccountingRule(id, data, organizationId, user?.email || '') : Promise.reject('Missing ID or organization'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountingRules'] });
      queryClient.invalidateQueries({ queryKey: ['accountingRule', id] });
      toast({
        title: "Success",
        description: "Accounting rule updated successfully",
      });
      navigate('/finance/accounting-rules');
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update accounting rule",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountingRuleFormData) => {
    console.log('Form submitted with data:', data);
    
    // Ensure line numbers are sequential
    const processedData = {
      ...data,
      lines: data.lines.map((line, index) => ({
        ...line,
        lineNumber: index + 1,
      })),
    };

    console.log('Processed data being sent:', processedData);

    if (mode === 'create') {
      createMutation.mutate(processedData);
    } else {
      updateMutation.mutate(processedData);
    }
  };

  const addLine = () => {
    append({
      lineNumber: fields.length + 1,
      debitAccountCode: "",
      creditAccountCode: "",
      amountSource: "",
      enableSubledger: false,
    });
  };

  const removeLine = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create Accounting Rule' : 'Edit Accounting Rule'}</CardTitle>
          <CardDescription>
            {mode === 'create' ? 'Add a new accounting rule' : 'Update accounting rule information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <FormField
                  control={form.control}
                  name="divisionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              divisionsLoading ? "Loading divisions..." : 
                              divisionsError ? "Error loading divisions" :
                              "Select division (optional)"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {divisions
                            .filter(div => div.status === 'active')
                            .map((division) => (
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
                  name="transactionReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Reference *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter transaction reference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
                  name="triggeringAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Triggering Action *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select triggering action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {triggeringActions.map((action) => (
                            <SelectItem key={action} value={action}>
                              {action}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Rule Lines</h3>
                  <Button type="button" variant="outline" onClick={addLine}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.debitAccountCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit Account</FormLabel>
                            <FormControl>
                              <Input placeholder="Account code" {...field} />
                            </FormControl>
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
                            <FormControl>
                              <Input placeholder="Account code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.amountSource`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Source *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getAmountSourcesForTransactionCategory(watchedTransactionType).map((source) => (
                                  <SelectItem key={source} value={source}>
                                    {source}
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
                        name={`lines.${index}.enableSubledger`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Subledger</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="w-4 h-4" />
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
