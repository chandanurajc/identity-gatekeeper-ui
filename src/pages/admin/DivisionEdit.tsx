
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { divisionService } from "@/services/divisionService";
import { DivisionFormData } from "@/types/division";
import DivisionForm from "@/components/division/DivisionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const DivisionEdit = () => {
  const { divisionId } = useParams<{ divisionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: division, isLoading } = useQuery({
    queryKey: ['division', divisionId],
    queryFn: () => divisionService.getDivisionById(divisionId!),
    enabled: !!divisionId,
  });

  const handleSubmit = async (data: DivisionFormData) => {
    if (!divisionId) return;
    
    try {
      await divisionService.updateDivision(divisionId, data, user?.name || user?.email || "Unknown");
      toast({
        title: "Success",
        description: "Division updated successfully",
      });
      navigate("/admin/divisions");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update division",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/admin/divisions");
  };

  if (isLoading) {
    return <div>Loading division...</div>;
  }

  if (!division) {
    return <div>Division not found</div>;
  }

  // Convert division data to form data format
  const initialData: Partial<DivisionFormData> = {
    name: division.name,
    organizationId: division.organizationId,
    userDefinedCode: division.code.slice(4), // Remove the 4-character org code
    type: division.type,
    status: division.status,
    contacts: division.contacts,
    references: division.references,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Division</h1>
        <p className="text-muted-foreground">Modify division information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Division Information</CardTitle>
          <CardDescription>
            Update the details for {division.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DivisionForm 
            initialData={initialData}
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
            isEditing={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DivisionEdit;
