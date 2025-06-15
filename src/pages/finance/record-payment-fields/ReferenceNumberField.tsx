
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ReferenceNumberFieldProps {
  control: any;
}

export function ReferenceNumberField({ control }: ReferenceNumberFieldProps) {
  return (
    <FormField
      control={control}
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
  );
}
