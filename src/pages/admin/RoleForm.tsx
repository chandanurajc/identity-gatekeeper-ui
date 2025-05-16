
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roleService } from "@/services/roleService";
import { Permission, Role, RoleFormData } from "@/types/role";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PermissionSelector from "@/components/admin/PermissionSelector";

const RoleForm = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const isEditing = !!roleId;
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const navigate = useNavigate();
  const { canCreateRole, canEditRoles } = useRolePermissions();

  useEffect(() => {
    const loadRole = async () => {
      if (isEditing && roleId) {
        try {
          const role = await roleService.getRoleById(roleId);
          if (role) {
            setRoleName(role.name);
            setSelectedPermissions(role.permissions);
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
          console.error("Failed to load role:", error);
        }
      }
      setLoading(false);
    };

    loadRole();
  }, [roleId, isEditing, navigate]);

  const handlePermissionsChange = (permissions: Permission[]) => {
    setSelectedPermissions(permissions);
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Role name is required.",
      });
      return;
    }

    if (selectedPermissions.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "At least one permission must be selected.",
      });
      return;
    }

    setSaving(true);
    
    try {
      const roleData: RoleFormData = {
        name: roleName.trim(),
        permissions: selectedPermissions,
      };

      if (isEditing && roleId) {
        await roleService.updateRole(roleId, roleData);
        toast({
          title: "Role Updated",
          description: `The role "${roleName}" has been updated successfully.`,
        });
      } else {
        await roleService.createRole(roleData as Omit<Role, "id" | "createdBy" | "createdOn">);
        toast({
          title: "Role Created",
          description: `The role "${roleName}" has been created successfully.`,
        });
      }
      
      navigate("/admin/roles");
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Failed to ${isEditing ? "update" : "create"} role`,
        description: "An error occurred while saving the role.",
      });
      console.error(`Failed to ${isEditing ? "update" : "create"} role:`, error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowCancelAlert(true);
  };

  const confirmCancel = () => {
    navigate("/admin/roles");
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  // Check if user has permission
  if ((isEditing && !canEditRoles) || (!isEditing && !canCreateRole)) {
    navigate("/unauthorized");
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Role" : "Create Role"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update role details and permissions"
              : "Define a new role with specific permissions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name*</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
              required
            />
          </div>

          <PermissionSelector
            selectedPermissions={selectedPermissions}
            onPermissionsChange={handlePermissionsChange}
          />
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Any unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                <AlertDialogAction onClick={confirmCancel}>
                  Discard Changes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : (isEditing ? "Save Changes" : "Save Role")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RoleForm;
