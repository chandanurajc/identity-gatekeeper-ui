
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from "@/types/organization";
import { Users, Mail, Phone, Globe } from "lucide-react";

interface OrganizationContactsProps {
  contacts: Contact[];
}

export const OrganizationContacts = ({ contacts }: OrganizationContactsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Contacts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contacts && contacts.length > 0 ? (
          <div className="space-y-6">
            {contacts.map((contact) => (
              <div key={contact.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">{contact.firstName} {contact.lastName}</h4>
                    <p className="text-sm text-muted-foreground">{contact.type}</p>
                    {contact.address1 && (
                      <div className="mt-2 text-sm">
                        <p>{contact.address1}</p>
                        {contact.address2 && <p>{contact.address2}</p>}
                        {(contact.city || contact.state || contact.postalCode) && (
                          <p>
                            {contact.city && contact.city}
                            {contact.city && contact.state && ", "}
                            {contact.state && contact.state}
                            {(contact.city || contact.state) && contact.postalCode && " "}
                            {contact.postalCode && contact.postalCode}
                          </p>
                        )}
                        {contact.country && <p>{contact.country}</p>}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-right">
                    {contact.email && (
                      <div className="flex items-center justify-end">
                        <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phoneNumber && (
                      <div className="flex items-center justify-end">
                        <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${contact.phoneNumber}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {contact.phoneNumber}
                        </a>
                      </div>
                    )}
                    {contact.website && (
                      <div className="flex items-center justify-end">
                        <Globe className="mr-1 h-4 w-4 text-muted-foreground" />
                        <a 
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {contact.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No contacts found</p>
        )}
      </CardContent>
    </Card>
  );
};
