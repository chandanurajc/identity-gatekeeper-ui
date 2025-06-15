import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Contact } from "@/types/division";
import { useToast } from "@/hooks/use-toast";
import { ContactDialog } from "./ContactDialog";
import { ContactList } from "./ContactList";

interface ContactFormProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}

export const ContactForm = ({ contacts, onChange }: ContactFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (contact?: Contact) => {
    setEditingContact(contact || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
  };

  const handleSaveContact = (contact: Contact) => {
    // Check if editing or adding
    if (editingContact) {
      const updatedContacts = contacts.map((c) => (c.id === contact.id ? contact : c));
      onChange(updatedContacts);
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } else {
      const updatedContacts = [...contacts, contact];
      onChange(updatedContacts);
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    }
    handleCloseDialog();
  };

  const handleDelete = (contactId: string) => {
    const updatedContacts = contacts.filter((c) => c.id !== contactId);
    onChange(updatedContacts);
  };

  const existingTypes = contacts
    .map((c) => c.type)
    .filter((type) => (!editingContact || editingContact.type !== type));

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" onClick={() => handleOpenDialog()}>
        <Plus className="h-4 w-4 mr-2" />
        Add Contact
      </Button>
      <ContactDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingContact}
        onSave={handleSaveContact}
        existingTypes={existingTypes}
      />
      <ContactList contacts={contacts} onEdit={handleOpenDialog} onDelete={handleDelete} />
    </div>
  );
};
