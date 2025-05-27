
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationFormData } from "@/types/organization";
import { Partner } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ContactForm } from "./ContactForm";
import { ReferenceForm } from "./ReferenceForm";
import { partnerService } from "@/services/partnerService";

// Enhanced form schema with supplier field
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
  supplierId: z.string().optional(),
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
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      website: z.string().optional(),
    })
  ).min(1, "At least one contact is required"),
  references: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["GST", "CIN", "PAN", "GS1 Company code"]),
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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  
  console.log("OrganizationForm: Initializing with data:", initialData);
  console.log("OrganizationForm: isEditing:", isEditing);

  // Load partners for supplier dropdown
  useEffect(() => {
    const loadPartners = async () => {
      try {
        const partnerData = await partnerService.getPartners();
        setPartners(partnerData);
      } catch (error) {
        console.error("Failed to load partners:", error);
      } finally {
        setLoadingPartners(false);
      }
    };
    loadPartners();
  }, []);
  
  // Initialize form with default values or existing data
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      alias: initialData?.alias || "",
      type: initialData?.type || undefined,
      status: initialData?.status || "active",
      supplierId: initialData?.supplierId || "",
      contacts: initialData?.contacts && initialData.contacts.length > 0 
        ? initialData.contacts 
        : [],
      references: initialData?.references || [],
    },
  });

  console.log("OrganizationForm: Form values:", form.getValues());

  const handleSubmit = async (data: OrganizationFormData) => {
    console.log("OrganizationForm: handleSubmit called");
    console.log("OrganizationForm: Form data received:", JSON.stringify(data, null, 2));
    
    setIsSubmitting(true);
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

      // Ensure contacts array is not empty
      if (!data.contacts || data.contacts.length === 0) {
        console.error("OrganizationForm: No contacts provided");
        toast({
          title: "Validation Error",
          description: "At least one contact is required.",
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

      console.log("OrganizationForm: Validation passed, calling onSubmit");
      console.log("OrganizationForm: About to call onSubmit with data:", data);
      
      await onSubmit(data);
      console.log("OrganizationForm: onSubmit completed successfully");
      
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
      console.log("OrganizationForm: Submission process completed");
    }
  };

  const handleContactsChange = (contacts: any[]) => {
    console.log("OrganizationForm: Contacts changed:", contacts.length);
    form.setValue("contacts", contacts);
    // Trigger validation
    form.trigger("contacts");
  };

  const handleReferencesChange = (references: any[]) => {
    console.log("OrganizationForm: References changed:", references.length);
    form.setValue("references", references);
    // Trigger validation
    form.trigger("references");
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

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select 
                  disabled={isSubmitting || loadingPartners} 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingPartners ? "Loading suppliers..." : "Select supplier (optional)"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.organizationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Contacts *</h3>
          <ContactForm 
            contacts={form.watch("contacts")} 
            onChange={handleContactsChange}
          />
          {form.formState.errors.contacts && (
            <p className="text-sm font-medium text-destructive mt-2">
              {form.formState.errors.contacts.message}
            </p>
          )}
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
