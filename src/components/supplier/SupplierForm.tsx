
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Supplier, SupplierFormData } from "@/types/supplier";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface SupplierFormProps {
  supplier?: Supplier;
  onSave: (supplier: SupplierFormData) => Promise<void>;
  readOnly?: boolean;
  isEditing?: boolean;
}

export const SupplierForm = ({
  supplier,
  onSave,
  readOnly = false,
  isEditing = false,
}: SupplierFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<SupplierFormData>({
    name: supplier?.name || "",
    alias: supplier?.alias || "",
    status: supplier?.status || "active",
    references: supplier?.references || [],
    contacts: supplier?.contacts || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof SupplierFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      toast({
        title: "Success",
        description: `Supplier ${isEditing ? "updated" : "created"} successfully`,
      });
      navigate("/master-data/suppliers");
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} supplier.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/master-data/suppliers");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Supplier Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={readOnly || isEditing}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="alias">Alias</Label>
            <Input
              id="alias"
              value={formData.alias || ""}
              onChange={(e) => handleChange("alias", e.target.value)}
              disabled={readOnly}
              placeholder="Supplier alias (optional)"
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
        {supplier && (
          <div className="space-y-3 p-4 bg-muted/20 rounded-md">
            {supplier.createdBy && supplier.createdOn && (
              <div>
                <p className="text-xs text-muted-foreground">Created by: {supplier.createdBy}</p>
                <p className="text-xs text-muted-foreground">
                  Created on: {new Date(supplier.createdOn).toLocaleString()}
                </p>
              </div>
            )}
            {supplier.updatedBy && supplier.updatedOn && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Updated by: {supplier.updatedBy}</p>
                <p className="text-xs text-muted-foreground">
                  Updated on: {new Date(supplier.updatedOn).toLocaleString()}
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
