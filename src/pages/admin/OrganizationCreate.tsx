
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
    console.log("OrganizationCreate: Save initiated with data:", JSON.stringify(formData, null, 2));
    
    if (!canCreateOrganization) {
      console.error("OrganizationCreate: User lacks permission to create organizations");
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "You do not have permission to create organizations.",
      });
      navigate("/unauthorized");
      return;
    }

    if (!user?.id) {
      console.error("OrganizationCreate: No authenticated user found");
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to create organizations.",
      });
      return;
    }

    try {
      console.log("OrganizationCreate: Calling organizationService.createOrganization");
      console.log("OrganizationCreate: User info - ID:", user.id, "Name:", user.name, "Email:", user.email);
      
      // Use username/email as created_by instead of user ID
      const createdByValue = user.name || user.email || "Unknown User";
      
      const result = await organizationService.createOrganization(
        formData, 
        createdByValue
      );
      
      console.log("OrganizationCreate: Organization created successfully:", result);
      
      toast({
        title: "Success",
        description: `Organization "${result.name}" created successfully!`,
      });
      
      // Navigate back to organizations list
      navigate("/admin/organizations");
    } catch (error) {
      console.error("OrganizationCreate: Error creating organization:");
      console.error("- Error type:", typeof error);
      console.error("- Error message:", error instanceof Error ? error.message : 'Unknown error');
      console.error("- Error stack:", error instanceof Error ? error.stack : 'No stack');
      console.error("- Full error object:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to create organization";
      
      toast({
        variant: "destructive",
        title: "Error Creating Organization",
        description: errorMessage,
      });
    }
  };

  // Check permissions
  if (!canCreateOrganization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Unauthorized</h2>
        <p className="text-muted-foreground mt-2">You do not have permission to create organizations.</p>
      </div>
    );
  }

  // Check authentication
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Authentication Required</h2>
        <p className="text-muted-foreground mt-2">You must be logged in to create organizations.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Organization</h2>
        <p className="text-muted-foreground">
          Fill in the details to create a new organization. All fields marked with * are required.
        </p>
      </div>

      <OrganizationForm onSubmit={handleSave} />
    </div>
  );
};

export default OrganizationCreate;
