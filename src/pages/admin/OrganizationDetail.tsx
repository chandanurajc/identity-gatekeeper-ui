
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
  
  const primaryContact = organization.contacts?.find(contact => contact.isPrimary);
  
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
              <h3 className="text-sm font-medium text-muted-foreground">Organization</h3>
              <p className="text-lg font-semibold">{organization.name}</p>
            </div>
            
            {organization.website && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                  <Globe className="mr-2 h-4 w-4" /> Website
                </h3>
                <p className="text-lg">
                  <a 
                    href={organization.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {organization.website}
                  </a>
                </p>
              </div>
            )}
          </div>
          
          {organization.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1">{organization.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {organization.address && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p>{organization.address.street}</p>
              <p>
                {organization.address.city}, {organization.address.state} {organization.address.postalCode}
              </p>
              <p>{organization.address.country}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-semibold">{contact.name}</h4>
                        {contact.isPrimary && (
                          <Badge variant="outline" className="ml-2">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.title}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex items-center justify-end">
                        <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {contact.email}
                        </a>
                      </div>
                      <div className="flex items-center justify-end">
                        <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${contact.phone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {contact.phone}
                        </a>
                      </div>
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
                <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">{reference.name}</h4>
                      <p className="text-sm text-muted-foreground">{reference.company}</p>
                      <p className="text-sm">{reference.relationship}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      {reference.email && (
                        <div className="flex items-center justify-end">
                          <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`mailto:${reference.email}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {reference.email}
                          </a>
                        </div>
                      )}
                      {reference.phone && (
                        <div className="flex items-center justify-end">
                          <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`tel:${reference.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {reference.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created By</p>
              <p className="font-medium">{organization.createdBy}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created On</p>
              <p className="font-medium">{new Date(organization.createdAt).toLocaleDateString()}</p>
            </div>
            {organization.updatedAt && (
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(organization.updatedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationDetail;
