
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Organization } from "@/types/organization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generalLedgerService } from "@/services/generalLedgerService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { RecordPaymentFormData } from "@/types/generalLedger";

const paymentSchema = z.object({
  paymentDate: z.date({ required_error: "Payment date is required." }),
  paymentMethod: z.enum(["UPI", "Bank Transfer", "Cheque", "Cash"]).optional(),
  referenceNumber: z.string().optional(),
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
  notes: z.string().optional(),
}).refine(data => !!data.paymentMethod, {
  message: "Payment method is required.",
  path: ["paymentMethod"],
});

type PaymentFormSchema = z.infer<typeof paymentSchema>;

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  billToOrg: Organization;
  remitToOrg: Organization;
}

export const RecordPaymentDialog = ({
  isOpen,
  onOpenChange,
  billToOrg,
  remitToOrg,
}: RecordPaymentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormSchema>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date(),
      referenceNumber: "",
      notes: "",
      amount: 0,
      paymentMethod: undefined,
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: RecordPaymentFormData) => {
      if (!user?.email) throw new Error("User not authenticated");
      return generalLedgerService.recordPayment(data, billToOrg, remitToOrg, user.email);
    },
    onSuccess: () => {
      toast({ title: "Payment Recorded", description: "The payment has been successfully recorded." });
      queryClient.invalidateQueries({ queryKey: ['generalLedger', billToOrg.id, remitToOrg.id] });
      onOpenChange(false);
      form.reset({
        paymentDate: new Date(),
        referenceNumber: "",
        notes: "",
        amount: 0,
        paymentMethod: undefined,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to record payment",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: PaymentFormSchema) => {
    if (!data.paymentMethod) {
      // This path should be unreachable due to the schema refinement
      return;
    }
    const completeData: RecordPaymentFormData = {
      ...data,
      paymentMethod: data.paymentMethod,
    };
    recordPaymentMutation.mutate(completeData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-sm font-medium">Bill To</label>
                    <p className="text-sm text-muted-foreground">{billToOrg.name}</p>
                </div>
                <div>
                    <label className="text-sm font-medium">Remit To</label>
                    <p className="text-sm text-muted-foreground">{remitToOrg.name}</p>
                </div>
            </div>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Payment Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
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
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a payment method" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
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
                            <Input placeholder="e.g., UPI ID, cheque no." {...field} />
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
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Optional notes about the payment" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                        Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={recordPaymentMutation.isPending}>
                        {recordPaymentMutation.isPending ? "Saving..." : "Save Payment"}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
