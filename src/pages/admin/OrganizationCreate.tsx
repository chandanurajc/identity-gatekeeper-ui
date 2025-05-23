
import { useNavigate } from "react-router-dom";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { organizationService } from "@/services/organizationService";
import OrganizationForm from "@/components/organization/OrganizationForm";
import { OrganizationFormData } from "@/types/organization";
import { useAuth } from "@/context/AuthContext";

const OrganizationCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateOrganization } = useOrganizationPermissions();

  const handleSave = async (formData: OrganizationFormData) => {
    if (!canCreateOrganization) {
      navigate("/unauthorized");
      return;
    }

    // Create organization with current user as creator
    await organizationService.createOrganization(formData, user?.name || user?.email || "System");
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
