
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roleService } from "@/services/roleService";
import { Role } from "@/types/role";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { format } from "date-fns";
import { Edit } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const RoleDetails = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { canEditRoles, canViewRoles } = useRolePermissions();

  useEffect(() => {
    const loadRoleDetails = async () => {
      if (!roleId) {
        navigate("/admin/roles");
        return;
      }

      try {
        const roleDetails = await roleService.getRoleById(roleId);
        if (roleDetails) {
          setRole(roleDetails);
        } else {
          toast({
            variant: "destructive",
            title: "Role not found",
            description: "The requested role could not be found.",
          });
          navigate("/admin/roles");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading role",
          description: "There was a problem loading the role details.",
        });
        console.error("Failed to load role details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRoleDetails();
  }, [roleId, navigate]);

  const handleEdit = () => {
    navigate(`/admin/roles/edit/${roleId}`);
  };

  const handleGoBack = () => {
    navigate("/admin/roles");
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading role details...</div>;
  }

  // Check if user has permission
  if (!canViewRoles) {
    navigate("/unauthorized");
    return null;
  }

  // If role doesn't exist after loading
  if (!role) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Role Details: {role.name}</CardTitle>
          <CardDescription>
            View the details and permissions for this role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Role Name</h3>
              <p>{role.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Permissions</h3>
              <p>{role.permissions.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
              <p>{role.createdBy || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created On</h3>
              <p>{role.createdOn ? format(new Date(role.createdOn), "PPP") : "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Updated By</h3>
              <p>{role.updatedBy || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Updated On</h3>
              <p>{role.updatedOn ? format(new Date(role.updatedOn), "PPP") : "N/A"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Permissions</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Permission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {role.permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>{permission.module}</TableCell>
                    <TableCell>{permission.component}</TableCell>
                    <TableCell>{permission.name}</TableCell>
                  </TableRow>
                ))}
                {role.permissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No permissions assigned to this role
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleGoBack}>
            Go Back
          </Button>
          
          {canEditRoles && (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default RoleDetails;
