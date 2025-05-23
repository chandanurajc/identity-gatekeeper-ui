
import { useState, useEffect } from "react";
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
import { Trash2, Plus } from "lucide-react";

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
        alias: values.alias,
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

  const addReference = () => {
    const newReference: Reference = {
      id: `ref-${Date.now()}`,
      type: "GST",
      value: "",
    };
    setReferences([...references, newReference]);
  };

  const updateReference = (id: string, updatedReference: Reference) => {
    setReferences(references.map(ref => ref.id === id ? updatedReference : ref));
  };

  const removeReference = (id: string) => {
    setReferences(references.filter(ref => ref.id !== id));
  };

  const addContact = () => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      type: "Registered location",
      firstName: "",
      lastName: "",
    };
    setContacts([...contacts, newContact]);
  };

  const updateContact = (id: string, updatedContact: Contact) => {
    setContacts(contacts.map(contact => contact.id === id ? updatedContact : contact));
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>References</CardTitle>
            <Button type="button" onClick={addReference} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {references.map((reference) => (
              <div key={reference.id} className="flex items-end gap-4">
                <div className="flex-1">
                  <ReferenceForm
                    reference={reference}
                    onChange={(updatedReference) => updateReference(reference.id, updatedReference)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeReference(reference.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {references.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No references added yet. Click "Add Reference" to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contacts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            <Button type="button" onClick={addContact} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {contacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Contact {contacts.indexOf(contact) + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <ContactForm
                  contact={contact}
                  onChange={(updatedContact) => updateContact(contact.id, updatedContact)}
                />
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No contacts added yet. Click "Add Contact" to get started.
              </p>
            )}
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
