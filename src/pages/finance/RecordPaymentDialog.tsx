import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { PaymentDateField } from "./record-payment-fields/PaymentDateField";
import { PaymentMethodField } from "./record-payment-fields/PaymentMethodField";
import { AmountField } from "./record-payment-fields/AmountField";
import { ReferenceNumberField } from "./record-payment-fields/ReferenceNumberField";
import { NotesField } from "./record-payment-fields/NotesField";

const paymentMethodEnum = z.enum(["Bank Transfer", "UPI", "Cheque", "Cash"]);

const recordPaymentFormSchema = z.object({
  paymentDate: z.date({ required_error: "Payment date is required." }),
  paymentMethod: paymentMethodEnum,
  amount: z.coerce.number().positive("Amount must be positive"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
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

  // Explicitly define defaultValues with all fields and type annotation
  const defaultValues: RecordPaymentFormData = {
    paymentDate: new Date(),
    paymentMethod: "Bank Transfer",
    amount: outstandingBalance > 0 ? outstandingBalance : 0,
    referenceNumber: "",
    notes: "",
  };

  const form = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues,
  });

  function onSubmit(data: RecordPaymentFormData) {
    recordPaymentMutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={e => e.preventDefault()}
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment made to the selected supplier.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PaymentDateField control={form.control} />
            <PaymentMethodField control={form.control} />
            <AmountField control={form.control} />
            <ReferenceNumberField control={form.control} />
            <NotesField control={form.control} />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// File removed
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { PaymentDateField } from "./record-payment-fields/PaymentDateField";
import { PaymentMethodField } from "./record-payment-fields/PaymentMethodField";
import { AmountField } from "./record-payment-fields/AmountField";
import { ReferenceNumberField } from "./record-payment-fields/ReferenceNumberField";
import { NotesField } from "./record-payment-fields/NotesField";

const paymentMethodEnum = z.enum(["Bank Transfer", "UPI", "Cheque", "Cash"]);

const recordPaymentFormSchema = z.object({
  paymentDate: z.date({ required_error: "Payment date is required." }),
  paymentMethod: paymentMethodEnum,
  amount: z.coerce.number().positive("Amount must be positive"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
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

  // Explicitly define defaultValues with all fields and type annotation
  const defaultValues: RecordPaymentFormData = {
    paymentDate: new Date(),
    paymentMethod: "Bank Transfer",
    amount: outstandingBalance > 0 ? outstandingBalance : 0,
    referenceNumber: "",
    notes: "",
  };

  const form = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues,
  });

  function onSubmit(data: RecordPaymentFormData) {
    recordPaymentMutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={e => e.preventDefault()}
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment made to the selected supplier.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PaymentDateField control={form.control} />
            <PaymentMethodField control={form.control} />
            <AmountField control={form.control} />
            <ReferenceNumberField control={form.control} />
            <NotesField control={form.control} />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
