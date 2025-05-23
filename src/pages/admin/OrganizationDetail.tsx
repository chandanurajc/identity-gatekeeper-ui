
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { organizationService } from "@/services/organizationService";
import OrganizationForm from "@/components/organization/OrganizationForm";
import { Organization } from "@/types/organization";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const OrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewOrganization, canEditOrganization } = useOrganizationPermissions();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        if (!organizationId) {
          throw new Error("Organization ID is required");
        }

        const data = await organizationService.getOrganizationById(organizationId);
        if (!data) {
          throw new Error("Organization not found");
        }

        setOrganization(data);
      } catch (error) {
        console.error("Error fetching organization:", error);
        toast({
          title: "Error",
          description: "Failed to load organization details.",
          variant: "destructive",
        });
        navigate("/admin/organizations");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId, navigate, toast]);

  if (!canViewOrganization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to view organization details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading organization details...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Organization Not Found</h2>
        <p>The requested organization could not be found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Organization Details</h2>
        {canEditOrganization && (
          <Button 
            onClick={() => navigate(`/admin/organizations/edit/${organization.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Edit Organization
          </Button>
        )}
      </div>
      <OrganizationForm 
        initialData={organization} 
        onSubmit={() => Promise.resolve()} 
      />
    </div>
  );
};

export default OrganizationDetail;
