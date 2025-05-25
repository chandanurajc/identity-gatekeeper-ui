
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Edit, Globe, MapPin, Building, Phone, Mail, Users } from "lucide-react";

const OrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { canEditOrganization } = useOrganizationPermissions();
  
  const { data: organization, isLoading, error } = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () => organizationService.getOrganizationById(organizationId!),
    enabled: !!organizationId,
  });

  const handleEdit = () => {
    if (canEditOrganization && organizationId) {
      navigate(`/admin/organizations/edit/${organizationId}`);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading organization details...</div>;
  }

  if (error || !organization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p>Unable to load organization details. The organization may not exist.</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/admin/organizations")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };
  
  return (
    <div className="container p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/organizations")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{organization.name}</h2>
            <p className="text-muted-foreground">Organization Details</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Badge className={getStatusColor(organization.status)}>
            {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
          </Badge>
          
          {canEditOrganization && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>Basic details about the organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="text-lg font-semibold">{organization.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Code</h3>
              <p className="text-lg font-semibold">{organization.code}</p>
            </div>

            {organization.alias && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Alias</h3>
                <p className="text-lg">{organization.alias}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
              <p className="text-lg">{organization.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organization.contacts && organization.contacts.length > 0 ? (
            <div className="space-y-6">
              {organization.contacts.map((contact, index) => (
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

      {organization.references && organization.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {organization.references.map((reference, index) => (
                <div key={reference.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">{reference.type}</h4>
                      <p className="text-sm">{reference.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {organization.createdBy && (
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">{organization.createdBy}</p>
              </div>
            )}
            {organization.createdOn && (
              <div>
                <p className="text-muted-foreground">Created On</p>
                <p className="font-medium">{new Date(organization.createdOn).toLocaleDateString()}</p>
              </div>
            )}
            {organization.updatedBy && organization.updatedOn && (
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(organization.updatedOn).toLocaleDateString()} by {organization.updatedBy}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationDetail;
