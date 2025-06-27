
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { divisionService } from "@/services/divisionService";
import { DivisionFormData } from "@/types/division";
import DivisionForm from "@/components/division/DivisionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const DivisionCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (data: DivisionFormData) => {
    console.log("[DivisionCreate] handleSubmit called with:", data);

    try {
      if (!user?.organizationId) {
        throw new Error("User organization not found");
      }

      const result = await divisionService.createDivision(
        data, 
        user.organizationId, 
        user?.name || user?.email || "Unknown"
      );
      console.log("Division created successfully:", result);

      toast({
        title: "Success",
        description: "Division created successfully",
      });

      navigate("/admin/divisions");
    } catch (error) {
      console.error("Error creating division:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create division",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Division</h1>
        <p className="text-muted-foreground">Create a new organizational division</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Division Information</CardTitle>
          <CardDescription>
            Enter the details for the new division
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DivisionForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DivisionCreate;
