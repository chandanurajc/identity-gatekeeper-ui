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
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { chartOfAccountsService } from "@/services/chartOfAccountsService";
import type { AccountType, ChartOfAccountFormData } from "@/types/chartOfAccounts";

const accountTypes: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

const formSchema = z.object({
  accountCode: z.string().min(1, "Account code is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountType: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

interface ChartOfAccountsFormProps {
  mode: 'create' | 'edit';
}

export default function ChartOfAccountsForm({ mode }: ChartOfAccountsFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const form = useForm<ChartOfAccountFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountCode: "",
      accountName: "",
      accountType: "Asset",
      status: "Active",
    },
  });

  // Load existing account for edit mode
  const { data: existingAccount, isLoading } = useQuery({
    queryKey: ['chart-of-account', id],
    queryFn: () => id && organizationId ? chartOfAccountsService.getChartOfAccountById(id, organizationId) : null,
    enabled: mode === 'edit' && !!id && !!organizationId,
  });

  // Reset form when data loads
  React.useEffect(() => {
    if (existingAccount) {
      form.reset({
        accountCode: existingAccount.accountCode,
        accountName: existingAccount.accountName,
        accountType: existingAccount.accountType,
        status: existingAccount.status,
      });
    }
  }, [existingAccount, form]);

  const createMutation = useMutation({
    mutationFn: (data: ChartOfAccountFormData) =>
      organizationId ? chartOfAccountsService.createChartOfAccount(data, organizationId, user?.email || '') : Promise.reject('No organization'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chart of account created successfully",
      });
      navigate('/finance/chart-of-accounts');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ChartOfAccountFormData) =>
      id && organizationId ? chartOfAccountsService.updateChartOfAccount(id, data, organizationId, user?.email || '') : Promise.reject('Missing ID or organization'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chart of account updated successfully",
      });
      navigate('/finance/chart-of-accounts');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChartOfAccountFormData) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create Account' : 'Edit Account'}</CardTitle>
          <CardDescription>
            {mode === 'create' ? 'Add a new account to your chart of accounts' : 'Update account information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypes.map((type) => (
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

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/finance/chart-of-accounts')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Account' : 'Update Account'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}