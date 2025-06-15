import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generalLedgerService } from "@/services/generalLedgerService";
import { Organization } from "@/types/organization";
import { RecordPaymentFormData } from "@/types/generalLedger";
import { useAuth } from "@/context/AuthContext";

const paymentMethodEnum = z.enum(["Bank Transfer", "UPI", "Cheque", "Cash"]);

const recordPaymentFormSchema = z.object({
  paymentDate: z.date({ required_error: "Payment date is required." }),
  paymentMethod: paymentMethodEnum,
  amount: z.coerce.number().positive("Amount must be positive"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Enforce reference number for all except Cash
  const needsRef = data.paymentMethod !== "Cash";
  if (needsRef) {
    if (!data.referenceNumber || data.referenceNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reference number is required for this payment method.",
        path: ["referenceNumber"],
      });
    } else if (!/^PMT-[A-Za-z0-9]+$/.test(data.referenceNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reference number must be in format PMT-XXXX (letters/numbers).",
        path: ["referenceNumber"],
      });
    }
  }
});

type RecordPaymentFormSchema = z.infer<typeof recordPaymentFormSchema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billToOrg: Organization;
  remitToOrg: Organization;
  outstandingBalance: number;
  onPaymentSuccess: () => void;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  billToOrg,
  remitToOrg,
  outstandingBalance,
  onPaymentSuccess,
}: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { mutate: recordPaymentMutate, isPending } = useMutation<unknown, Error, RecordPaymentFormData>({
    mutationFn: async (data: RecordPaymentFormData) => {
      await generalLedgerService.recordPayment(
        data,
        billToOrg,
        remitToOrg,
        user?.email ?? ""
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["generalLedger", billToOrg.id, remitToOrg.id] });
      queryClient.invalidateQueries({ queryKey: ["totalPayables", billToOrg.id] });
      onPaymentSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error recording payment",
        description: error.message,
      });
    },
  });

  // ---- FIX: Provide all required default values (no partial, no optional) ----
  const form = useForm<RecordPaymentFormSchema>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: {
      paymentDate: new Date(),
      paymentMethod: "Bank Transfer",
      amount: outstandingBalance > 0 ? outstandingBalance : 0,
      notes: "",
      referenceNumber: "",
    } as RecordPaymentFormSchema, // ensure all fields present
  });

  function onSubmit(data: RecordPaymentFormSchema) {
    recordPaymentMutate(data);
  }

  return (
    // ---- FIX: remove 'open' prop from DialogContent (not supported) ----
    <DialogContent onOpenAutoFocus={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={() => onOpenChange(false)}>
      <DialogHeader>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogDescription>
          Record a payment made to the selected supplier.
        </DialogDescription>
      </DialogHeader>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter amount" {...field} />
                </FormControl>
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
                  <Input placeholder="e.g. PMT-12345" {...field} />
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
                  <Textarea placeholder="Add any relevant notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
