
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationFormData } from "@/types/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import ContactForm from "./ContactForm";
import ReferenceForm from "./ReferenceForm";

// Form schema with validation
const organizationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().length(4, "Code must be exactly 4 characters").regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric"),
  status: z.enum(["active", "inactive", "pending"]),
  website: z.string().url("Must be a valid URL").or(z.string().length(0)),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  address: z.object({
    street: z.string().min(3, "Street must be at least 3 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State must be at least 2 characters"),
    postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
    country: z.string().min(2, "Country must be at least 2 characters"),
  }),
  contacts: z.array(
    z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      title: z.string().min(2, "Title must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      phone: z.string().min(10, "Phone must be at least 10 characters"),
      isPrimary: z.boolean().default(false),
    })
  ).min(1, "At least one contact is required"),
  references: z.array(
    z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      company: z.string().min(2, "Company must be at least 2 characters"),
      email: z.string().email("Invalid email address").or(z.string().length(0)),
      phone: z.string().min(10, "Phone must be at least 10 characters").or(z.string().length(0)),
      relationship: z.string().min(2, "Relationship must be at least 2 characters"),
    })
  ).optional().default([]),
});

interface OrganizationFormProps {
  initialData?: Partial<OrganizationFormData>;
  onSubmit: (data: OrganizationFormData) => void;
  isEditing?: boolean;
}

const OrganizationForm = ({ initialData, onSubmit, isEditing = false }: OrganizationFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with default values or existing data
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: initialData?.name || "",
      // In edit mode or when creating, use the user's organization code
      code: initialData?.code || user?.organizationCode || "",
      status: initialData?.status || "active",
      website: initialData?.website || "",
      description: initialData?.description || "",
      address: initialData?.address || {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      contacts: initialData?.contacts && initialData.contacts.length > 0 
        ? initialData.contacts 
        : [{ name: "", title: "", email: "", phone: "", isPrimary: true }],
      references: initialData?.references || [],
    },
  });

  const handleSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter organization name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hide organization code field - it's handled automatically */}
          <input type="hidden" {...form.register("code")} />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  disabled={isSubmitting} 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the organization" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        
        <div>
          <h3 className="text-lg font-medium">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />
        
        <ContactForm form={form} />
        
        <Separator />
        
        <ReferenceForm form={form} />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Organization" : "Create Organization"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OrganizationForm;
