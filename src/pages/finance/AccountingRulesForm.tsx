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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { accountingRulesService } from "@/services/accountingRulesService";
import type { AccountingRuleFormData, RuleTransactionType, RuleAction, PartyType, FilterLogicType } from "@/types/accountingRules";

const transactionTypes: RuleTransactionType[] = ['Invoice', 'PO', 'Payment'];
const triggeringActions: RuleAction[] = ['Invoice Approved', 'PO Created', 'Payment Processed', 'Purchase order receive'];
const partyTypes: PartyType[] = ['Bill To', 'Remit To'];
const filterLogicTypes: FilterLogicType[] = ['AND', 'OR'];
const amountSourceOptions = ['Item total price', 'Total GST value'];

const formSchema = z.object({
  ruleName: z.string().min(1, "Rule name is required"),
  transactionType: z.enum(['Invoice', 'PO', 'Payment']),
  triggeringAction: z.enum(['Invoice Approved', 'PO Created', 'Payment Processed', 'Purchase order receive']),
  transactionReference: z.string().min(1, "Transaction reference is required"),
  transactionTypeText: z.string().optional(),
  debitAccountCode: z.string().min(1, "Debit account code is required"),
  creditAccountCode: z.string().min(1, "Credit account code is required"),
  amountSource: z.string().min(1, "Amount source is required"),
  enableSubledger: z.boolean().default(false),
  partyType: z.enum(['Bill To', 'Remit To']).optional(),
  partyName: z.string().optional(),
  partyCode: z.string().optional(),
  filterLogicType: z.enum(['AND', 'OR']).optional(),
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
      transactionType: "Invoice",
      triggeringAction: "Invoice Approved",
      transactionReference: "",
      transactionTypeText: "",
      debitAccountCode: "",
      creditAccountCode: "",
      amountSource: "",
      enableSubledger: false,
      status: "Active",
    },
  });

  // Load existing rule for edit mode
  const { data: existingRule, isLoading } = useQuery({
    queryKey: ['accounting-rule', id],
    queryFn: () => id && organizationId ? accountingRulesService.getAccountingRuleById(id, organizationId) : null,
    enabled: mode === 'edit' && !!id && !!organizationId,
  });

  // Reset form when data loads
  React.useEffect(() => {
    if (existingRule) {
      form.reset({
        ruleName: existingRule.ruleName,
        transactionType: existingRule.transactionType,
        triggeringAction: existingRule.triggeringAction,
        transactionReference: existingRule.transactionReference,
        transactionTypeText: existingRule.transactionTypeText || "",
        debitAccountCode: existingRule.debitAccountCode,
        creditAccountCode: existingRule.creditAccountCode,
        amountSource: existingRule.amountSource,
        enableSubledger: existingRule.enableSubledger,
        partyType: existingRule.partyType || undefined,
        partyName: existingRule.partyName || "",
        partyCode: existingRule.partyCode || "",
        filterLogicType: existingRule.filterLogicType || undefined,
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
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
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
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {transactionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="transactionTypeText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter transaction type text" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="debitAccountCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Debit Account Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter debit account code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creditAccountCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Account Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter credit account code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Source *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select amount source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {amountSourceOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="enableSubledger"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Subledger</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Create subledger entries for this rule
                      </p>
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

              {form.watch("enableSubledger") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="partyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select party type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {partyTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name="partyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter party name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partyCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter party code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

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