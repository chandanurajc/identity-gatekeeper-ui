
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AmountFieldProps {
  control: any;
}

export function AmountField({ control }: AmountFieldProps) {
  return (
    <FormField
      control={control}
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
  );
}
