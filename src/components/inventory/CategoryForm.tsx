
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Category, CategoryFormData } from "@/types/category";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Item category name must be at least 2 characters.",
  }).max(50, {
    message: "Item category name must be less than 50 characters.",
  }),
  subcategory: z.string().max(50, {
    message: "Subcategory name must be less than 50 characters.",
  }).optional(),
  isActive: z.boolean().default(true),
});

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting: boolean;
}

const CategoryForm = ({ initialData, onSubmit, isSubmitting }: CategoryFormProps) => {
  const navigate = useNavigate();
  
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      subcategory: initialData?.subcategory || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data);
      // The toast will be shown by the parent component
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save item category");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter item category name" {...field} />
              </FormControl>
              <FormDescription>
                The name of the item category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory</FormLabel>
              <FormControl>
                <Input placeholder="Enter subcategory (optional)" {...field} />
              </FormControl>
              <FormDescription>
                A subcategory or group within the main category (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Active Status
                </FormLabel>
                <FormDescription>
                  Enable or disable this item category.
                </FormDescription>
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

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/master-data/item-category")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (initialData ? "Update" : "Create")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
