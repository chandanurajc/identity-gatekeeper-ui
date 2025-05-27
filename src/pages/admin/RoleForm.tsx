import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roleService } from "@/services/roleService";
import { organizationService } from "@/services/organizationService";
import { Organization } from "@/types/organization";
import { Permission, Role, RoleFormData } from "@/types/role";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PermissionSelector from "@/components/admin/PermissionSelector";
import { useAuth } from "@/context/AuthContext";

const RoleForm = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const isEditing = !!roleId;
  const [roleName, setRoleName] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const navigate = useNavigate();
  const { canCreateRole, canEditRoles } = useRolePermissions();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch organizations
        const orgs = await organizationService.getOrganizations();
        setOrganizations(orgs);
        setIsLoadingOrganizations(false);
        
        // If editing, load role data
        if (isEditing && roleId) {
          const role = await roleService.getRoleById(roleId);
          if (role) {
            setRoleName(role.name);
            setSelectedPermissions(role.permissions);
            setSelectedOrganizationId(role.organizationId || "");
          } else {
            toast({
              variant: "destructive",
              title: "Role not found",
              description: "The requested role could not be found.",
            });
            navigate("/admin/roles");
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "There was a problem loading the role details or organizations.",
        });
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

    if (!user?.name) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "User not authenticated.",
      });
      return;
    }

    setSaving(true);
    
    try {
      const roleData: RoleFormData = {
        name: roleName.trim(),
        permissions: selectedPermissions,
        organizationId: selectedOrganizationId || undefined,
      };

      console.log("Using user name for role operation:", user.name);
      console.log("Organization ID being passed:", selectedOrganizationId || null);

      if (isEditing && roleId) {
        // Pass the organization ID to the update function
        await roleService.updateRole(roleId, roleData, user.name, selectedOrganizationId || null);
        toast({
          title: "Role Updated",
          description: `The role "${roleName}" has been updated successfully.`,
        });
      } else {
        // Pass null instead of empty string for organization_id
        const orgId = selectedOrganizationId || null;
        await roleService.createRole(roleData, user.name, orgId);
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
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold">{isEditing ? "Edit Role" : "Create Role"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update role details and permissions"
              : "Define a new role with specific permissions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="roleName" className="text-base">Role Name*</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="organizationId" className="text-base">Organization (Optional)</Label>
            <Select 
              value={selectedOrganizationId} 
              onValueChange={setSelectedOrganizationId}
            >
              <SelectTrigger id="organizationId" className="h-12">
                <SelectValue placeholder="Select organization (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Global Role)</SelectItem>
                {isLoadingOrganizations ? (
                  <SelectItem value="loading" disabled>Loading organizations...</SelectItem>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <PermissionSelector
            selectedPermissions={selectedPermissions}
            onPermissionsChange={handlePermissionsChange}
          />
        </CardContent>
        <CardFooter className="flex justify-end space-x-3 pt-6">
          <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" onClick={handleCancel}>
                Cancel
              </Button>
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
          
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? "Saving..." : (isEditing ? "Save Changes" : "Save Role")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RoleForm;
