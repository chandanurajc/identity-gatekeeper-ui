
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact } from "@/types/division";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

interface ContactFormProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}

export const ContactForm = ({ contacts, onChange }: ContactFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({});
    setEditingContact(null);
    setFormErrors({});
  };

  const handleOpenDialog = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData(contact);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

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

    // Check for duplicate contact types (only for new contacts or different types)
    if (formData.type && (!editingContact || editingContact.type !== formData.type)) {
      const existingContact = contacts.find(c => c.type === formData.type && c.id !== editingContact?.id);
      if (existingContact) {
        errors.type = "Contact type already exists";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    console.log("Saving contact with data:", formData);

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const contactData: Contact = {
      id: editingContact?.id || uuidv4(),
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
    };

    console.log("Final contact data:", contactData);

    if (editingContact) {
      // Update existing contact
      const updatedContacts = contacts.map(contact =>
        contact.id === editingContact.id ? contactData : contact
      );
      onChange(updatedContacts);
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } else {
      // Add new contact
      const updatedContacts = [...contacts, contactData];
      onChange(updatedContacts);
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    }

    handleCloseDialog();
  };

  const handleDelete = (contactId: string) => {
    const updatedContacts = contacts.filter(contact => contact.id !== contactId);
    onChange(updatedContacts);
    toast({
      title: "Success",
      description: "Contact deleted successfully",
    });
  };

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add Contact"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactType">Contact Type *</Label>
              <Select 
                value={formData.type || ""} 
                onValueChange={(value) => setFormData({...formData, type: value as Contact['type']})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Registered location">Registered Location</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Shipping">Shipping</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.type && <p className="text-sm text-destructive mt-1">{formErrors.type}</p>}
            </div>

            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName || ""}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                placeholder="Enter first name"
              />
              {formErrors.firstName && <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName || ""}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                placeholder="Enter last name"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="Enter phone number"
              />
              {formErrors.phoneNumber && <p className="text-sm text-destructive mt-1">{formErrors.phoneNumber}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address1">Address 1 *</Label>
              <Input
                id="address1"
                value={formData.address1 || ""}
                onChange={(e) => setFormData({...formData, address1: e.target.value})}
                placeholder="Enter address line 1"
              />
              {formErrors.address1 && <p className="text-sm text-destructive mt-1">{formErrors.address1}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address2">Address 2</Label>
              <Input
                id="address2"
                value={formData.address2 || ""}
                onChange={(e) => setFormData({...formData, address2: e.target.value})}
                placeholder="Enter address line 2"
              />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Enter city"
              />
              {formErrors.city && <p className="text-sm text-destructive mt-1">{formErrors.city}</p>}
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state || ""}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                placeholder="Enter state"
              />
              {formErrors.state && <p className="text-sm text-destructive mt-1">{formErrors.state}</p>}
            </div>

            <div>
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode || ""}
                onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                placeholder="Enter postal code"
              />
              {formErrors.postalCode && <p className="text-sm text-destructive mt-1">{formErrors.postalCode}</p>}
            </div>

            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country || ""}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
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
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ""}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="Enter website"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Display existing contacts */}
      <div className="grid grid-cols-1 gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex justify-between items-center">
                <span>{contact.type}</span>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(contact)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                <p>{contact.address1}</p>
                {contact.address2 && <p>{contact.address2}</p>}
                <p>{contact.city}, {contact.state} {contact.postalCode}</p>
                <p>{contact.country}</p>
                <p>{contact.phoneNumber}</p>
                {contact.email && <p>{contact.email}</p>}
                {contact.website && <p>{contact.website}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No contacts added yet. Click "Add Contact" to get started.
        </div>
      )}
    </div>
  );
};
