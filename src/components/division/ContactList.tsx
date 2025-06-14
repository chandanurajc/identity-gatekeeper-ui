
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Contact } from "@/types/division";

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export function ContactList({ contacts, onEdit, onDelete }: ContactListProps) {
  return (
    <>
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
                    onClick={() => onEdit(contact)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(contact.id)}
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
    </>
  );
}
