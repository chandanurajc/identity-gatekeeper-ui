
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { divisionService } from "@/services/divisionService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, FileText } from "lucide-react";

const DivisionDetail = () => {
  const { divisionId } = useParams<{ divisionId: string }>();

  const { data: division, isLoading } = useQuery({
    queryKey: ['division', divisionId],
    queryFn: () => divisionService.getDivisionById(divisionId!),
    enabled: !!divisionId,
  });

  if (isLoading) {
    return <div>Loading division...</div>;
  }

  if (!division) {
    return <div>Division not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{division.name}</h1>
        <p className="text-muted-foreground">Division Code: {division.code}</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Division Information</CardTitle>
          <CardDescription>Basic details about the division</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="text-lg font-semibold">{division.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Code</h3>
              <p className="text-lg font-semibold">{division.code}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Organization</h3>
              <p className="text-lg">{division.organizationName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
              <p className="text-lg">{division.type}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <Badge variant={division.status === 'active' ? 'default' : 'secondary'}>
                {division.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      {division.contacts && division.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {division.contacts.map((contact) => (
                <div key={contact.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">{contact.type}</h4>
                      <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{contact.address1}</p>
                        {contact.address2 && <p>{contact.address2}</p>}
                        <p>{contact.city}, {contact.state} {contact.postalCode}</p>
                        <p>{contact.country}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Phone: {contact.phoneNumber}</p>
                      {contact.email && <p>Email: {contact.email}</p>}
                      {contact.website && <p>Website: {contact.website}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* References */}
      {division.references && division.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {division.references.map((reference) => (
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
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {division.createdBy && (
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">{division.createdBy}</p>
              </div>
            )}
            {division.createdOn && (
              <div>
                <p className="text-muted-foreground">Created On</p>
                <p className="font-medium">{new Date(division.createdOn).toLocaleDateString()}</p>
              </div>
            )}
            {division.updatedBy && division.updatedOn && (
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(division.updatedOn).toLocaleDateString()} by {division.updatedBy}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DivisionDetail;
