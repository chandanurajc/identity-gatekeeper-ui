import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { organizationService } from "@/services/organizationService";
import OrganizationForm from "@/components/organization/OrganizationForm";
import { Organization, OrganizationFormData } from "@/types/organization";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const OrganizationEdit = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canEditOrganization } = useOrganizationPermissions();
  
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

  const handleSave = async (formData: OrganizationFormData) => {
    if (!canEditOrganization || !organizationId) {
      navigate("/unauthorized");
      return;
    }

    try {
      // Use user name instead of ID for updated_by field
      const updatedByValue = user?.name || "unknown";
      
      console.log("Using updatedBy value:", updatedByValue);
      
      await organizationService.updateOrganization(
        organizationId, 
        formData, 
        updatedByValue
      );
      
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      navigate("/admin/organizations");
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  if (!canEditOrganization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to edit organizations.</p>
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
      <h2 className="text-3xl font-bold tracking-tight">Edit Organization</h2>
      <p className="text-muted-foreground">Update the details for {organization.name}.</p>

      <OrganizationForm 
        initialData={organization} 
        onSubmit={handleSave}
        isEditing={true} 
      />
    </div>
  );
};

export default OrganizationEdit;
