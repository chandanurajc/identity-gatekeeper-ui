
import { Card, CardContent } from "@/components/ui/card";
import { Organization } from "@/types/organization";

interface OrganizationAuditInfoProps {
  organization: Organization;
}

export const OrganizationAuditInfo = ({ organization }: OrganizationAuditInfoProps) => {
  return (
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
  );
};
