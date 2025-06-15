
import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact } from "@/types/division";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Contact | null;
  onSave: (contact: Contact) => void;
  existingTypes: string[];
}

export function ContactDialog({ open, onOpenChange, initialData, onSave, existingTypes }: ContactDialogProps) {
  const [formData, setFormData] = useState<Partial<Contact>>(initialData || {});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Reset when new data is provided or dialog opens
  React.useEffect(() => {
    setFormData(initialData || {});
    setFormErrors({});
  }, [initialData, open]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.type) errors.type = "Contact type is required";
    if (!formData.firstName?.trim()) errors.firstName = "First name is required";
    if (!formData.address1?.trim()) errors.address1 = "Address 1 is required";
    if (!formData.postalCode?.trim()) errors.postalCode = "Postal code is required";
    if (!formData.city?.trim()) errors.city = "City is required";
    if (!formData.state?.trim()) errors.state = "State is required";
    if (!formData.country?.trim()) errors.country = "Country is required";
    if (!formData.phoneNumber?.trim()) errors.phoneNumber = "Phone number is required";
    if (formData.type && existingTypes.includes(formData.type) && formData.type !== initialData?.type) {
      errors.type = "Contact type already exists";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    onSave({
      id: initialData?.id || uuidv4(),
      type: formData.type!,
      firstName: formData.firstName!.trim(),
      lastName: formData.lastName?.trim() || "",
      address1: formData.address1!.trim(),
      address2: formData.address2?.trim() || "",
      postalCode: formData.postalCode!.trim(),
      city: formData.city!.trim(),
      state: formData.state!.trim(),
      country: formData.country!.trim(),
      phoneNumber: formData.phoneNumber!.trim(),
      email: formData.email?.trim() || "",
      website: formData.website?.trim() || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Contact" : "Add Contact"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactType">Contact Type *</Label>
            <Select
              value={formData.type || ""}
              onValueChange={(value) => setFormData({ ...formData, type: value as Contact['type'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Registered location">Registered Location</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
                <SelectItem value="Shipping">Shipping</SelectItem>
                <SelectItem value="Owner">Owner</SelectItem>
                <SelectItem value="Bill To">Bill To</SelectItem>
                <SelectItem value="Remit To">Remit To</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.type && <p className="text-sm text-destructive mt-1">{formErrors.type}</p>}
          </div>
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName || ""}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Enter first name"
            />
            {formErrors.firstName && <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName || ""}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Enter last name"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber || ""}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="Enter phone number"
            />
            {formErrors.phoneNumber && <p className="text-sm text-destructive mt-1">{formErrors.phoneNumber}</p>}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address1">Address 1 *</Label>
            <Input
              id="address1"
              value={formData.address1 || ""}
              onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
              placeholder="Enter address line 1"
            />
            {formErrors.address1 && <p className="text-sm text-destructive mt-1">{formErrors.address1}</p>}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address2">Address 2</Label>
            <Input
              id="address2"
              value={formData.address2 || ""}
              onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
              placeholder="Enter address line 2"
            />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city || ""}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
            />
            {formErrors.city && <p className="text-sm text-destructive mt-1">{formErrors.city}</p>}
          </div>
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state || ""}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Enter state"
            />
            {formErrors.state && <p className="text-sm text-destructive mt-1">{formErrors.state}</p>}
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={formData.postalCode || ""}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Enter postal code"
            />
            {formErrors.postalCode && <p className="text-sm text-destructive mt-1">{formErrors.postalCode}</p>}
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.country || ""}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Enter country"
            />
            {formErrors.country && <p className="text-sm text-destructive mt-1">{formErrors.country}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website || ""}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="Enter website"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
