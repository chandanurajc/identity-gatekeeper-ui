
import { useNavigate } from "react-router-dom";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { organizationService } from "@/services/organizationService";
import OrganizationForm from "@/components/organization/OrganizationForm";
import { OrganizationFormData } from "@/types/organization";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

const OrganizationCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateOrganization } = useOrganizationPermissions();

  const handleSave = async (formData: OrganizationFormData) => {
    if (!canCreateOrganization) {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "You do not have permission to create organizations.",
      });
      navigate("/unauthorized");
      return;
    }

    try {
      console.log("OrganizationCreate: Attempting to create organization with data:", formData);
      
      // Create organization with current user as creator
      const result = await organizationService.createOrganization(
        formData, 
        user?.name || user?.email || "System"
      );
      
      console.log("OrganizationCreate: Organization created successfully:", result);
      
      toast({
        title: "Success",
        description: "Organization created successfully!",
      });
      
      navigate("/admin/organizations");
    } catch (error) {
      console.error("OrganizationCreate: Error creating organization:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
      });
    }
  };

  if (!canCreateOrganization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to create organizations.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Create Organization</h2>
      <p className="text-muted-foreground">Fill in the details to create a new organization.</p>

      <OrganizationForm onSubmit={handleSave} />
    </div>
  );
};

export default OrganizationCreate;
