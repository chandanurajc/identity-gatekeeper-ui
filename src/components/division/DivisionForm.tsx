import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DivisionFormData } from "@/types/division";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { ContactForm } from "./ContactForm";
import { ReferenceForm } from "./ReferenceForm";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { Organization } from "@/types/organization";

// Form schema with validation
const divisionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  organizationId: z.string().min(1, "Organization is required"),
  userDefinedCode: z.string().length(3, "User code must be exactly 3 characters").regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric"),
  type: z.enum(["Supplier", "Retailer", "Retail customer", "Wholesale customer"]),
  status: z.enum(["active", "inactive"]),
  contacts: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["Registered location", "Billing", "Shipping", "Owner"]),
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().optional(),
      address1: z.string().min(1, "Address 1 is required"),
      address2: z.string().optional(),
      postalCode: z.string().min(1, "Postal code is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      country: z.string().min(1, "Country is required"),
      phoneNumber: z.string().min(1, "Phone number is required"),
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

interface DivisionFormProps {
  initialData?: Partial<DivisionFormData>;
  onSubmit: (data: DivisionFormData) => Promise<void>;
  isEditing?: boolean;
}

const DivisionForm = ({ initialData, onSubmit, isEditing = false }: DivisionFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch organizations for dropdown
  const { data: organizationsData = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.getOrganizations,
  });

  // Ensure organizations is always an array
  const organizations: Organization[] = Array.isArray(organizationsData) ? organizationsData : [];

  // Initialize form with default values or existing data
  const form = useForm<DivisionFormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      name: initialData?.name || "",
      organizationId: initialData?.organizationId || "",
      userDefinedCode: initialData?.userDefinedCode || "",
      type: initialData?.type || "Supplier",
      status: initialData?.status || "active",
      contacts: initialData?.contacts && initialData.contacts.length > 0 
        ? initialData.contacts 
        : [],
      references: initialData?.references || [],
    },
  });

  const selectedOrgId = form.watch("organizationId");
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  const handleSubmit = async (data: DivisionFormData) => {
    // Get latest contacts value (avoid relying solely on async form propagation)
    const latestContacts = form.getValues("contacts");

    console.log("Form submitted (data param):", data);
    console.log("Contacts at submit time (from data):", data.contacts);
    console.log("Contacts at submit time (from getValues):", latestContacts);

    if (!latestContacts || latestContacts.length === 0) {
      form.setError("contacts", { 
        type: "manual", 
        message: "At least one contact is required" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Replace data.contacts with latestContacts to submit the up-to-date value
      await onSubmit({ ...data, contacts: latestContacts });
    } catch (error) {
      console.error("Error submitting form:", error);
      // The error will be handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactsChange = (contacts: any[]) => {
    console.log("Contacts changed (DivisionForm):", contacts);
    form.setValue("contacts", contacts, { shouldValidate: true });
    form.trigger("contacts");
    // Clear any existing contact errors
    if (contacts.length > 0) {
      form.clearErrors("contacts");
    }
  };

  const handleReferencesChange = (references: any[]) => {
    console.log("References changed:", references);
    form.setValue("references", references, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization *</FormLabel>
                <Select 
                  disabled={isSubmitting || isEditing} 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.code} - {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userDefinedCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Division Code *</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={selectedOrg?.code || "----"}
                      disabled
                      className="w-20 text-center bg-gray-100"
                    />
                    <span>+</span>
                    <Input 
                      placeholder="Enter 3-character code"
                      {...field} 
                      maxLength={3}
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="w-24"
                      disabled={isSubmitting}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Division Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter division name" 
                    {...field} 
                    disabled={isSubmitting}
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
                <FormLabel>Division Type *</FormLabel>
                <Select 
                  disabled={isSubmitting} 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                    <SelectItem value="Retailer">Retailer</SelectItem>
                    <SelectItem value="Retail customer">Retail Customer</SelectItem>
                    <SelectItem value="Wholesale customer">Wholesale Customer</SelectItem>
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
          {form.formState.errors.contacts && (
            <p className="text-sm font-medium text-destructive mt-2">
              {form.formState.errors.contacts?.message || "At least one contact is required"}
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
            {isSubmitting ? "Saving..." : isEditing ? "Update Division" : "Create Division"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DivisionForm;
