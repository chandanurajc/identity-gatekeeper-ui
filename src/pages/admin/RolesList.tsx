
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roleService } from "@/services/roleService";
import { organizationService } from "@/services/organizationService";
import { Role } from "@/types/role";
import { Organization } from "@/types/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { format } from "date-fns";
import { Plus, Edit, Eye, Filter, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RolesList = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();
  const { canCreateRole, canEditRoles, canViewRoles, isLoading: permissionsLoading } = useRolePermissions();

  useEffect(() => {
    const loadData = async () => {
      if (permissionsLoading) return;
      
      console.log("Starting to load roles and organizations data...");
      try {
        setLoading(true);
        setError(null);
        
        // Load both roles and organizations in parallel
        console.log("Fetching roles and organizations...");
        const [allRoles, allOrgs] = await Promise.all([
          roleService.getAllRoles(),
          organizationService.getAllOrganizations()
        ]);
        
        console.log("Roles fetched:", allRoles.length);
        console.log("Organizations fetched:", allOrgs.length);
        console.log("Organizations data:", allOrgs);
        
        // Map organizations by ID for easy lookup
        const orgsMap: Record<string, Organization> = {};
        allOrgs.forEach(org => {
          orgsMap[org.id] = org;
          console.log(`Mapped organization: ${org.id} -> ${org.name}`);
        });
        
        // Enhance roles with organization names
        const enhancedRoles = allRoles.map(role => {
          console.log(`Processing role: ${role.name}, orgId: ${role.organizationId}`);
          if (role.organizationId && orgsMap[role.organizationId]) {
            const orgName = orgsMap[role.organizationId].name;
            console.log(`Found organization for role ${role.name}: ${orgName}`);
            return {
              ...role,
              organizationName: orgName
            };
          }
          console.log(`No organization found for role ${role.name}`);
          return {
            ...role,
            organizationName: undefined
          };
        });
        
        console.log("Enhanced roles:", enhancedRoles);
        setRoles(enhancedRoles);
        setOrganizations(orgsMap);
      } catch (error) {
        console.error("Error loading data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load data";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [permissionsLoading]);

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const filteredRoles = roles.filter(role => {
    return Object.entries(filters).every(([field, value]) => {
      if (!value) return true;
      
      const fieldValue = String(role[field as keyof Role] || "").toLowerCase();
      return fieldValue.includes(value.toLowerCase());
    });
  });

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    const fieldA = String(a[sortField as keyof Role] || "").toLowerCase();
    const fieldB = String(b[sortField as keyof Role] || "").toLowerCase();
    
    if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Show loading state
  if (loading || permissionsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading roles...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permissions after loading
  if (!canViewRoles) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-gray-600">You don't have permission to view roles.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
                <DropdownMenuItem onClick={() => handleFilterChange("name", "")}>
                  Clear filters
                </DropdownMenuItem>
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
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Filter by role name"
                onChange={(e) => handleFilterChange("name", e.target.value)}
                value={filters.name || ""}
              />
            </div>
            <div>
              <Input
                placeholder="Filter by organization"
                onChange={(e) => handleFilterChange("organizationName", e.target.value)}
                value={filters.organizationName || ""}
              />
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Role Name
                    {sortField === "name" && (
                      sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("organizationName")}>
                  <div className="flex items-center">
                    Organization
                    {sortField === "organizationName" && (
                      sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Updated On</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                sortedRoles.map((role) => (
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
                    <TableCell>{role.organizationName || "Global"}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesList;
