
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roleService } from "@/services/roleService";
import { Role } from "@/types/role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { format } from "date-fns";
import { Plus, Edit, Eye, Filter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RolesList = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { canCreateRole, canEditRoles, canViewRoles } = useRolePermissions();

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const allRoles = await roleService.getAllRoles();
        setRoles(allRoles);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading roles",
          description: "There was a problem loading the roles.",
        });
        console.error("Failed to load roles:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  const handleCheckboxChange = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleCreateRole = () => {
    navigate("/admin/roles/create");
  };

  const handleEditRole = () => {
    if (selectedRoles.length === 1) {
      navigate(`/admin/roles/edit/${selectedRoles[0]}`);
    }
  };

  const handleViewRole = (roleId: string) => {
    navigate(`/admin/roles/${roleId}`);
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading roles...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Manage user roles and permissions in the system
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Filter by name</DropdownMenuItem>
                <DropdownMenuItem>Filter by creation date</DropdownMenuItem>
                <DropdownMenuItem>Filter by update date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {canCreateRole && (
              <Button onClick={handleCreateRole}>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            )}
            
            {canEditRoles && (
              <Button 
                onClick={handleEditRole} 
                variant="outline"
                disabled={selectedRoles.length !== 1}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Role
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Role Name</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Updated On</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRoles.includes(role.id)} 
                      onCheckedChange={() => handleCheckboxChange(role.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {canViewRoles ? (
                      <button
                        onClick={() => handleViewRole(role.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {role.name}
                      </button>
                    ) : (
                      role.name
                    )}
                  </TableCell>
                  <TableCell>{role.createdBy || 'N/A'}</TableCell>
                  <TableCell>
                    {role.createdOn ? format(new Date(role.createdOn), 'PPP') : 'N/A'}
                  </TableCell>
                  <TableCell>{role.updatedBy || 'N/A'}</TableCell>
                  <TableCell>
                    {role.updatedOn ? format(new Date(role.updatedOn), 'PPP') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {canViewRoles && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewRole(role.id)}
                        title="View role details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No roles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesList;
