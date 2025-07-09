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
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { journalService } from "@/services/journalService";
import type { JournalFormData, JournalStatus, RuleTransactionType } from "@/types/journal";

const transactionTypes: RuleTransactionType[] = ['Invoice', 'PO', 'Payment'];

const formSchema = z.object({
  journalDate: z.string().min(1, "Journal date is required"),
  transactionType: z.enum(['Invoice', 'PO', 'Payment']).optional(),
  transactionReference: z.string().optional(),
  journalLines: z.array(z.object({
    lineNumber: z.number(),
    accountCode: z.string().min(1, "Account code is required"),
    narration: z.string().optional(),
    debitAmount: z.number().optional(),
    creditAmount: z.number().optional(),
  })).min(2, "At least 2 journal lines are required"),
});

interface JournalFormProps {
  mode: 'create' | 'edit';
}

export default function JournalForm({ mode }: JournalFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const form = useForm<JournalFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      journalDate: new Date().toISOString().split('T')[0],
      journalLines: [
        { lineNumber: 1, accountCode: '', narration: '', debitAmount: 0, creditAmount: 0 },
        { lineNumber: 2, accountCode: '', narration: '', debitAmount: 0, creditAmount: 0 },
      ],
    },
  });

  // Load existing journal for edit mode
  const { data: existingJournal, isLoading } = useQuery({
    queryKey: ['journal', id],
    queryFn: () => id && organizationId ? journalService.getJournalById(id, organizationId) : null,
    enabled: mode === 'edit' && !!id && !!organizationId,
  });

  // Reset form when data loads
  React.useEffect(() => {
    if (existingJournal) {
      form.reset({
        journalDate: existingJournal.journalDate,
        transactionType: existingJournal.transactionType || undefined,
        transactionReference: existingJournal.transactionReference || "",
        journalLines: existingJournal.journalLines || [],
      });
    }
  }, [existingJournal, form]);

  const createMutation = useMutation({
    mutationFn: (data: JournalFormData) =>
      organizationId ? journalService.createJournal(data, organizationId, user?.email || '') : Promise.reject('No organization'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal created successfully",
      });
      navigate('/finance/journals');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create journal",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: JournalFormData) =>
      id && organizationId ? journalService.updateJournal(id, data, organizationId, user?.email || '') : Promise.reject('Missing ID or organization'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal updated successfully",
      });
      navigate('/finance/journals');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update journal",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JournalFormData) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const addJournalLine = () => {
    const currentLines = form.getValues('journalLines');
    form.setValue('journalLines', [
      ...currentLines,
      { 
        lineNumber: currentLines.length + 1, 
        accountCode: '', 
        narration: '', 
        debitAmount: 0, 
        creditAmount: 0 
      }
    ]);
  };

  const removeJournalLine = (index: number) => {
    const currentLines = form.getValues('journalLines');
    if (currentLines.length > 2) {
      const newLines = currentLines.filter((_, i) => i !== index);
      // Renumber the lines
      const renumberedLines = newLines.map((line, i) => ({ ...line, lineNumber: i + 1 }));
      form.setValue('journalLines', renumberedLines);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create Journal Entry' : 'Edit Journal Entry'}</CardTitle>
          <CardDescription>
            {mode === 'create' ? 'Add a new journal entry' : 'Update journal entry information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="journalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Journal Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  name="transactionReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter transaction reference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Journal Lines</h3>
                  <Button type="button" variant="outline" onClick={addJournalLine}>
                    Add Line
                  </Button>
                </div>

                {form.watch('journalLines').map((line, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <FormField
                        control={form.control}
                        name={`journalLines.${index}.accountCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="Account code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`journalLines.${index}.narration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Narration</FormLabel>
                            <FormControl>
                              <Input placeholder="Narration" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`journalLines.${index}.debitAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`journalLines.${index}.creditAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        {form.watch('journalLines').length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeJournalLine(index)}
                          >
                            Remove
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
                  onClick={() => navigate('/finance/journals')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Journal' : 'Update Journal'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}