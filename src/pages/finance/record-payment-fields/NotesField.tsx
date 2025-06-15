
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface NotesFieldProps {
  control: any;
}

export function NotesField({ control }: NotesFieldProps) {
  return (
    <FormField
      control={control}
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
  );
}
