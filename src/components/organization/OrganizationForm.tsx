
import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ContactForm } from "./ContactForm";
import { ReferenceForm } from "./ReferenceForm";

// Form schema with updated reference types
const organizationSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  code: z.string()
    .length(4, "Code must be exactly 4 characters")
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric")
    .transform(val => val.toUpperCase()),
  alias: z.string()
    .max(200, "Alias must be less than 200 characters")
    .optional()
    .transform(val => val?.trim() || undefined),
  type: z.enum(["Supplier", "Retailer", "Wholesale Customer", "Retail Customer", "Admin"], {
    required_error: "Organization type is required",
  }),
  status: z.enum(["active", "inactive"]),
  contacts: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["Registered location", "Billing", "Shipping", "Owner", "Bill To", "Remit To"]),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      website: z.string().optional(),
    })
  )
  // NO min(1) for contacts!
  ,
  references: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["GST", "CIN", "PAN", "GS1Code"]),
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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  console.log("=== OrganizationForm Debug Start ===");
  console.log("OrganizationForm: Initializing with data:", initialData);
  console.log("OrganizationForm: isEditing:", isEditing);
  console.log("OrganizationForm: user:", user);
  
  // Initialize form with default values or existing data
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      alias: initialData?.alias || "",
      type: initialData?.type || undefined,
      status: initialData?.status || "active",
      contacts: initialData?.contacts && initialData.contacts.length > 0 
        ? initialData.contacts 
        : [],
      references: initialData?.references || [],
    },
  });

  // Only update form when initialData actually changes (stable comparison)
  useEffect(() => {
    if (initialData) {
      console.log("OrganizationForm: Initial data changed, updating form");
      form.reset({
        name: initialData.name || "",
        code: initialData.code || "",
        alias: initialData.alias || "",
        type: initialData.type || undefined,
        status: initialData.status || "active",
        contacts: initialData.contacts || [],
        references: initialData.references || [],
      });
    }
  }, [JSON.stringify(initialData)]);

  console.log("OrganizationForm: Current form values:", form.getValues());
  console.log("OrganizationForm: Form errors:", form.formState.errors);
  console.log("OrganizationForm: Form isValid:", form.formState.isValid);
  console.log("OrganizationForm: Form isDirty:", form.formState.isDirty);

  const handleSubmit = async (data: OrganizationFormData) => {
    console.log("=== FORM SUBMIT HANDLER CALLED ===");
    console.log("OrganizationForm: handleSubmit triggered");
    console.log("OrganizationForm: Raw form data:", JSON.stringify(data, null, 2));
    console.log("OrganizationForm: isSubmitting state:", isSubmitting);
    
    // Prevent double submission
    if (isSubmitting) {
      console.log("OrganizationForm: Already submitting, ignoring");
      return;
    }
    
    setIsSubmitting(true);
    console.log("OrganizationForm: Set isSubmitting to true");
    
    try {
      // Validate that we have a user
      if (!user?.id) {
        console.error("OrganizationForm: User not authenticated");
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save organizations.",
          variant: "destructive",
        });
        return;
      }

      // Validate organization code format
      if (!/^[A-Z0-9]{4}$/.test(data.code)) {
        console.error("OrganizationForm: Invalid code format");
        toast({
          title: "Validation Error",
          description: "Organization code must be exactly 4 uppercase alphanumeric characters.",
          variant: "destructive",
        });
        return;
      }

      // Validate that organization type is selected
      if (!data.type) {
        console.error("OrganizationForm: No type selected");
        toast({
          title: "Validation Error",
          description: "Organization type is required.",
          variant: "destructive",
        });
        return;
      }

      // Ensure references have values if they exist
      if (data.references && data.references.length > 0) {
        const invalidReferences = data.references.filter(ref => !ref.value.trim());
        if (invalidReferences.length > 0) {
          console.error("OrganizationForm: Invalid references found");
          toast({
            title: "Validation Error",
            description: "All references must have values.",
            variant: "destructive",
          });
          return;
        }
      }

      console.log("OrganizationForm: All validations passed");
      console.log("OrganizationForm: Calling onSubmit with data:", data);
      
      // Call the parent's onSubmit function
      await onSubmit(data);
      
      console.log("OrganizationForm: onSubmit completed successfully");
      
      // Show success toast
      toast({
        title: "Success",
        description: `Organization ${isEditing ? "updated" : "created"} successfully`,
      });
      
    } catch (error) {
      console.error("OrganizationForm: Submission error:", error);
      
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      console.log("OrganizationForm: Set isSubmitting to false");
    }
  };

  const handleContactsChange = (contacts: any[]) => {
    console.log("OrganizationForm: Contacts changed:", contacts.length, contacts);
    form.setValue("contacts", contacts, { shouldValidate: true, shouldDirty: true });
  };

  const handleReferencesChange = (references: any[]) => {
    console.log("OrganizationForm: References changed:", references.length, references);
    form.setValue("references", references, { shouldValidate: true, shouldDirty: true });
  };

  // Debug form submission with detailed error logging
  const onInvalidSubmit = (errors: any) => {
    console.log("=== FORM VALIDATION FAILED ===");
    console.log("OrganizationForm: Validation errors:", errors);
    
    const messages: string[] = [];
    
    Object.entries(errors).forEach(([field, error]: [string, any]) => {
      if ((field === 'contacts' || field === 'references') && Array.isArray(error)) {
        error.forEach((itemError, index) => {
          if (itemError) {
            Object.entries(itemError).forEach(([itemField, itemFieldError]: [string, any]) => {
              if (itemFieldError?.message) {
                const prefix = field === 'contacts' ? 'Contact' : 'Reference';
                messages.push(`${prefix} ${index + 1}, ${itemField}: ${itemFieldError.message}`);
              }
            });
          }
        });
      } else if (error?.message) {
        messages.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${error.message}`);
      }
    });
    
    if (messages.length === 0 && Object.keys(errors).length > 0) {
      messages.push("Some fields have invalid values. Please review the form.");
    }
    
    toast({
      title: "Validation Error",
      description: messages.join('; '),
      variant: "destructive",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, onInvalidSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter organization name" 
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Code *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter 4-character code (e.g., ADMN)" 
                    {...field} 
                    maxLength={4}
                    disabled={isSubmitting}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      field.onChange(value);
                    }}
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
                  <Input 
                    placeholder="Organization alias" 
                    {...field} 
                    disabled={isSubmitting}
                    maxLength={200}
                  />
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
                <FormLabel>Organization Type *</FormLabel>
                <Select 
                  disabled={isSubmitting} 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
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
                <FormLabel>Status *</FormLabel>
                <Select 
                  disabled={isSubmitting} 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
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
          <Button 
            type="submit" 
            disabled={isSubmitting}
            onClick={() => {
              console.log("=== SUBMIT BUTTON CLICKED ===");
              console.log("OrganizationForm: Submit button clicked");
              console.log("OrganizationForm: Current form state:", {
                isValid: form.formState.isValid,
                isDirty: form.formState.isDirty,
                errors: form.formState.errors,
                values: form.getValues()
              });
            }}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update Organization" : "Create Organization"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OrganizationForm;
