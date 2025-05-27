
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ItemGroupFormData } from "@/types/itemGroup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const itemGroupSchema = z.object({
  name: z.string()
    .min(3, "Item group name must be at least 3 characters")
    .max(100, "Item group name must be less than 100 characters")
    .trim(),
  classification: z.string()
    .min(2, "Classification is required")
    .max(100, "Classification must be less than 100 characters")
    .trim(),
  subClassification: z.string()
    .min(2, "Sub-classification is required")
    .max(100, "Sub-classification must be less than 100 characters")
    .trim(),
  status: z.enum(["active", "inactive"]),
});

interface ItemGroupFormProps {
  initialData?: Partial<ItemGroupFormData>;
  onSubmit: (data: ItemGroupFormData) => void;
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
}

const ItemGroupForm = ({ initialData, onSubmit, isOpen, onClose, isEditing = false }: ItemGroupFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ItemGroupFormData>({
    resolver: zodResolver(itemGroupSchema),
    defaultValues: {
      name: initialData?.name || "",
      classification: initialData?.classification || "",
      subClassification: initialData?.subClassification || "",
      status: initialData?.status || "active",
    },
  });

  const handleSubmit = async (data: ItemGroupFormData) => {
    setIsSubmitting(true);
    try {
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save item groups.",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(data);
      onClose();
      form.reset();
      
    } catch (error) {
      console.error("ItemGroupForm: Submission error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item Group" : "Create Item Group"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Group Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter item group name" 
                      {...field} 
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Classification *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter item classification" 
                      {...field} 
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subClassification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Sub-Classification *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter item sub-classification" 
                      {...field} 
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select 
                    disabled={isSubmitting} 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Item Group" : "Create Item Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemGroupForm;
