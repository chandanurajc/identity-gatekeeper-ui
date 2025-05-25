
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Organization } from "@/types/organization";

interface OrganizationInfoProps {
  organization: Organization;
}

export const OrganizationInfo = ({ organization }: OrganizationInfoProps) => {
  return (
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
  );
};
