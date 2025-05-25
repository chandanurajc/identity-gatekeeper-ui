
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { OrganizationHeader } from "@/components/organization/OrganizationHeader";
import { OrganizationInfo } from "@/components/organization/OrganizationInfo";
import { OrganizationContacts } from "@/components/organization/OrganizationContacts";
import { OrganizationReferences } from "@/components/organization/OrganizationReferences";
import { OrganizationAuditInfo } from "@/components/organization/OrganizationAuditInfo";

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

  const handleBack = () => {
    navigate("/admin/organizations");
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
          onClick={handleBack}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container p-6 space-y-8">
      <OrganizationHeader
        organizationName={organization.name}
        organizationStatus={organization.status}
        canEdit={canEditOrganization}
        onEdit={handleEdit}
        onBack={handleBack}
      />

      <OrganizationInfo organization={organization} />

      <OrganizationContacts contacts={organization.contacts} />

      <OrganizationReferences references={organization.references} />

      <OrganizationAuditInfo organization={organization} />
    </div>
  );
};

export default OrganizationDetail;
