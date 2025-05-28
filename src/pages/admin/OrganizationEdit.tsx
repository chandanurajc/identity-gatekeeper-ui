
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

        console.log("OrganizationEdit: Fetching organization with ID:", organizationId);
        const data = await organizationService.getOrganizationById(organizationId);
        if (!data) {
          throw new Error("Organization not found");
        }

        console.log("OrganizationEdit: Organization fetched successfully:", data);
        setOrganization(data);
      } catch (error) {
        console.error("OrganizationEdit: Error fetching organization:", error);
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
    console.log("OrganizationEdit: handleSave called with formData:", formData);
    console.log("OrganizationEdit: canEditOrganization:", canEditOrganization);
    console.log("OrganizationEdit: organizationId:", organizationId);
    console.log("OrganizationEdit: user:", user);
    
    if (!canEditOrganization || !organizationId) {
      console.error("OrganizationEdit: Permission denied or missing organizationId");
      toast({
        title: "Error",
        description: "You don't have permission to edit organizations.",
        variant: "destructive",
      });
      navigate("/unauthorized");
      return;
    }

    try {
      console.log("OrganizationEdit: Starting update process...");
      
      // Validate user authentication
      if (!user || !user.id) {
        console.error("OrganizationEdit: User not authenticated", user);
        toast({
          title: "Error",
          description: "You must be logged in to save changes.",
          variant: "destructive",
        });
        return;
      }

      // Use user email or ID as fallback for updated_by field
      const updatedByValue = user.email || user.id || "unknown";
      
      console.log("OrganizationEdit: Using updatedBy value:", updatedByValue);
      console.log("OrganizationEdit: Calling organizationService.updateOrganization...");
      
      const result = await organizationService.updateOrganization(
        organizationId, 
        formData, 
        updatedByValue
      );
      
      console.log("OrganizationEdit: Update successful:", result);
      
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      
      // Navigate back to organizations list
      navigate("/admin/organizations");
      
    } catch (error) {
      console.error("OrganizationEdit: Error updating organization:", error);
      
      // Extract error message
      const errorMessage = error instanceof Error ? error.message : "Failed to update organization";
      
      toast({
        title: "Error",
        description: errorMessage,
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

  console.log("OrganizationEdit: Rendering form with organization:", organization);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Edit Organization</h2>
      <p className="text-muted-foreground">Update the details for {organization?.name}.</p>

      <OrganizationForm 
        initialData={organization} 
        onSubmit={handleSave}
        isEditing={true} 
      />
    </div>
  );
};

export default OrganizationEdit;
