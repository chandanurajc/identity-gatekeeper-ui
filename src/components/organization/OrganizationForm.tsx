
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Organization, OrganizationFormData } from "@/types/organization";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReferenceForm } from "./ReferenceForm";
import { ContactForm } from "./ContactForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrganizationFormProps {
  organization?: Organization;
  onSave: (organization: OrganizationFormData) => Promise<void>;
  readOnly?: boolean;
  isEditing?: boolean;
}

export const OrganizationForm = ({
  organization,
  onSave,
  readOnly = false,
  isEditing = false,
}: OrganizationFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<OrganizationFormData>({
    name: organization?.name || "",
    alias: organization?.alias || "",
    type: organization?.type || "Supplier",
    status: organization?.status || "active",
    references: organization?.references || [],
    contacts: organization?.contacts || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof OrganizationFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      toast({
        title: "Success",
        description: `Organization ${isEditing ? "updated" : "created"} successfully`,
      });
      navigate("/admin/organizations");
    } catch (error) {
      console.error("Error saving organization:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} organization.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/organizations");
  };

  const organizationTypes = ['Supplier', 'Retailer', 'Wholesale Customer', 'Retail Customer'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Organization Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={readOnly || isEditing}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">Organization Type*</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange("type", value as Organization['type'])}
              disabled={readOnly}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                {organizationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="alias">Alias</Label>
            <Input
              id="alias"
              value={formData.alias || ""}
              onChange={(e) => handleChange("alias", e.target.value)}
              disabled={readOnly}
              placeholder="Organization alias (optional)"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="status"
              checked={formData.status === "active"}
              onCheckedChange={(checked) => handleChange("status", checked ? "active" : "inactive")}
              disabled={readOnly}
            />
            <Label htmlFor="status">
              {formData.status === "active" ? "Active" : "Inactive"}
            </Label>
          </div>
        </div>

        {/* Metadata displayed on right side */}
        {organization && (
          <div className="space-y-3 p-4 bg-muted/20 rounded-md">
            {organization.createdBy && organization.createdOn && (
              <div>
                <p className="text-xs text-muted-foreground">Created by: {organization.createdBy}</p>
                <p className="text-xs text-muted-foreground">
                  Created on: {new Date(organization.createdOn).toLocaleString()}
                </p>
              </div>
            )}
            {organization.updatedBy && organization.updatedOn && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Updated by: {organization.updatedBy}</p>
                <p className="text-xs text-muted-foreground">
                  Updated on: {new Date(organization.updatedOn).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="references">
          <AccordionTrigger className="text-lg font-semibold">Reference Details</AccordionTrigger>
          <AccordionContent>
            <ReferenceForm
              references={formData.references}
              onChange={(references) => handleChange("references", references)}
              readOnly={readOnly}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contacts">
          <AccordionTrigger className="text-lg font-semibold">Contact Details</AccordionTrigger>
          <AccordionContent>
            <ContactForm
              contacts={formData.contacts}
              onChange={(contacts) => handleChange("contacts", contacts)}
              readOnly={readOnly}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {!readOnly && (
        <div className="flex justify-end space-x-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm and Abort</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel? Any unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, continue editing</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>Yes, cancel</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </form>
  );
};
