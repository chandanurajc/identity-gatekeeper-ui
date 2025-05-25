
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
import { useAuth } from "@/context/AuthContext";
import { ContactForm } from "./ContactForm";
import { ReferenceForm } from "./ReferenceForm";

// Form schema with validation
const organizationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().length(4, "Code must be exactly 4 characters").regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric"),
  alias: z.string().optional(),
  type: z.enum(["Supplier", "Retailer", "Wholesale Customer", "Retail Customer", "Admin"]),
  status: z.enum(["active", "inactive"]),
  contacts: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["Registered location", "Billing", "Shipping", "Owner"]),
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email("Invalid email address").optional(),
      website: z.string().optional(),
    })
  ).min(1, "At least one contact is required"),
  references: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["GST", "CIN", "PAN"]),
      value: z.string().min(1, "Reference value is required"),
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
      code: initialData?.code || "",
      alias: initialData?.alias || "",
      type: initialData?.type || "Supplier",
      status: initialData?.status || "active",
      contacts: initialData?.contacts && initialData.contacts.length > 0 
        ? initialData.contacts 
        : [],
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

  const handleContactsChange = (contacts: any[]) => {
    form.setValue("contacts", contacts);
  };

  const handleReferencesChange = (references: any[]) => {
    form.setValue("references", references);
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

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter 4-character code (e.g., ADMN)" 
                    {...field} 
                    maxLength={4}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="alias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alias</FormLabel>
                <FormControl>
                  <Input placeholder="Organization alias" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Type</FormLabel>
                <Select 
                  disabled={isSubmitting} 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                    <SelectItem value="Retailer">Retailer</SelectItem>
                    <SelectItem value="Wholesale Customer">Wholesale Customer</SelectItem>
                    <SelectItem value="Retail Customer">Retail Customer</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Contacts</h3>
          <ContactForm 
            contacts={form.watch("contacts")} 
            onChange={handleContactsChange}
          />
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">References</h3>
          <ReferenceForm 
            references={form.watch("references")} 
            onChange={handleReferencesChange}
          />
        </div>

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
