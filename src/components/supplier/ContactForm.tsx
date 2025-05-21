
import { useState } from "react";
import { Contact } from "@/types/supplier";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Plus, Pencil } from "lucide-react";

interface ContactFormProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
  readOnly?: boolean;
}

const defaultContact: Omit<Contact, 'id'> = {
  type: 'Registered location',
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  postalCode: '',
  city: '',
  state: '',
  country: '',
  phoneNumber: '',
  email: '',
  website: ''
};

export const ContactForm = ({ contacts, onChange, readOnly = false }: ContactFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Omit<Contact, 'id'>>(defaultContact);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentContact(defaultContact);
    setEditingId(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setCurrentContact({
      type: contact.type,
      firstName: contact.firstName,
      lastName: contact.lastName,
      address1: contact.address1,
      address2: contact.address2,
      postalCode: contact.postalCode,
      city: contact.city,
      state: contact.state,
      country: contact.country,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      website: contact.website
    });
    setEditingId(contact.id);
    setIsOpen(true);
  };

  const handleSaveContact = () => {
    if (currentContact.firstName && currentContact.address1 && currentContact.city) {
      if (editingId) {
        // Edit existing contact
        onChange(
          contacts.map((contact) =>
            contact.id === editingId ? { ...currentContact, id: editingId } : contact
          )
        );
      } else {
        // Add new contact
        onChange([...contacts, { ...currentContact, id: uuidv4() }]);
      }
      setIsOpen(false);
      resetForm();
    }
  };

  const handleRemoveContact = (id: string) => {
    onChange(contacts.filter((contact) => contact.id !== id));
  };

  const contactTypes = ['Registered location', 'Billing', 'Shipping', 'Owner'];

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Button type="button" onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Edit the contact details below.'
                : 'Fill in the contact details below to add a new contact.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="flex flex-col space-y-2 md:col-span-2">
              <Label htmlFor="contactType">Contact Type</Label>
              <Select
                value={currentContact.type}
                onValueChange={(value) =>
                  setCurrentContact({ ...currentContact, type: value as Contact['type'] })
                }
              >
                <SelectTrigger id="contactType">
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  {contactTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="firstName">First Name*</Label>
              <Input
                id="firstName"
                value={currentContact.firstName}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, firstName: e.target.value })
                }
                placeholder="First name"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={currentContact.lastName}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, lastName: e.target.value })
                }
                placeholder="Last name"
              />
            </div>

            <div className="flex flex-col space-y-2 md:col-span-2">
              <Label htmlFor="address1">Address 1*</Label>
              <Input
                id="address1"
                value={currentContact.address1}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, address1: e.target.value })
                }
                placeholder="Address line 1"
                required
              />
            </div>

            <div className="flex flex-col space-y-2 md:col-span-2">
              <Label htmlFor="address2">Address 2</Label>
              <Input
                id="address2"
                value={currentContact.address2 || ''}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, address2: e.target.value })
                }
                placeholder="Address line 2"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="postalCode">Postal Code*</Label>
              <Input
                id="postalCode"
                value={currentContact.postalCode}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, postalCode: e.target.value })
                }
                placeholder="Postal code"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="city">City*</Label>
              <Input
                id="city"
                value={currentContact.city}
                onChange={(e) => setCurrentContact({ ...currentContact, city: e.target.value })}
                placeholder="City"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="state">State*</Label>
              <Input
                id="state"
                value={currentContact.state}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, state: e.target.value })
                }
                placeholder="State"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="country">Country*</Label>
              <Input
                id="country"
                value={currentContact.country}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, country: e.target.value })
                }
                placeholder="Country"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={currentContact.phoneNumber || ''}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, phoneNumber: e.target.value })
                }
                placeholder="Phone number"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={currentContact.email || ''}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, email: e.target.value })
                }
                placeholder="Email"
                type="email"
              />
            </div>

            <div className="flex flex-col space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={currentContact.website || ''}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, website: e.target.value })
                }
                placeholder="Website"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact}>{editingId ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contacts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="bg-card">
              <CardHeader className="py-2 px-4 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-medium">{contact.type}</CardTitle>
                {!readOnly && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditContact(contact)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveContact(contact.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="py-2 px-4 space-y-2">
                <p className="text-sm font-medium">
                  {contact.firstName} {contact.lastName}
                </p>
                <p className="text-xs">
                  {contact.address1}
                  {contact.address2 && <>, {contact.address2}</>}
                </p>
                <p className="text-xs">
                  {contact.city}, {contact.state}, {contact.postalCode}
                </p>
                <p className="text-xs">{contact.country}</p>
                {(contact.phoneNumber || contact.email || contact.website) && (
                  <div className="text-xs space-y-1 pt-2">
                    {contact.phoneNumber && <p>{contact.phoneNumber}</p>}
                    {contact.email && <p>{contact.email}</p>}
                    {contact.website && <p>{contact.website}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
