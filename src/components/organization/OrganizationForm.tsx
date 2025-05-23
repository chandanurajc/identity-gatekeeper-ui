
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { OrganizationFormData, Reference, Contact } from "@/types/organization";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReferenceForm } from "./ReferenceForm";
import { ContactForm } from "./ContactForm";

const formSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  alias: z.string().optional(),
  type: z.enum(["Supplier", "Retailer", "Wholesale Customer", "Retail Customer"]),
  status: z.enum(["active", "inactive"]),
});

interface OrganizationFormProps {
  initialData?: Partial<OrganizationFormData>;
  isEditing?: boolean;
  onSubmit: (data: OrganizationFormData) => Promise<void>;
}

const OrganizationForm = ({ initialData, isEditing = false, onSubmit }: OrganizationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [references, setReferences] = useState<Reference[]>(initialData?.references || []);
  const [contacts, setContacts] = useState<Contact[]>(initialData?.contacts || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      alias: initialData?.alias || "",
      type: initialData?.type || "Supplier",
      status: initialData?.status || "active",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.organizationCode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No organization code found for current user",
      });
      return;
    }

    try {
      const organizationData: OrganizationFormData = {
        name: values.name,
        code: user.organizationCode,
        alias: values.alias || undefined,
        type: values.type,
        status: values.status,
        references,
        contacts,
      };

      await onSubmit(organizationData);
      
      toast({
        title: `Organization ${isEditing ? "updated" : "created"} successfully`,
        description: `The organization has been ${isEditing ? "updated" : "created"} successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Failed to ${isEditing ? "update" : "create"} organization`,
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display organization code as read-only */}
            <div>
              <FormLabel>Organization Code</FormLabel>
              <Input 
                value={user?.organizationCode || ""} 
                disabled 
                className="bg-gray-100"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Auto-filled from your user profile
              </p>
            </div>

            <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Type*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormLabel>Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </CardContent>
        </Card>

        {/* References Section */}
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent>
            <ReferenceForm
              references={references}
              onChange={setReferences}
            />
          </CardContent>
        </Card>

        {/* Contacts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm
              contacts={contacts}
              onChange={setContacts}
            />
          </CardContent>
        </Card>

        <Card>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Organization" : "Create Organization"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default OrganizationForm;
