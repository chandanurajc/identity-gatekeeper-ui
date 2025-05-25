
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reference } from "@/types/organization";
import { Building } from "lucide-react";

interface OrganizationReferencesProps {
  references: Reference[];
}

export const OrganizationReferences = ({ references }: OrganizationReferencesProps) => {
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="mr-2 h-5 w-5" />
          References
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {references.map((reference) => (
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
  );
};
