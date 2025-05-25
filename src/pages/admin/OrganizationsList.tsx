
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { Organization } from "@/types/organization"; 
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit, Bug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const { canCreateOrganization, canViewOrganization, canEditOrganization } = useOrganizationPermissions();
  
  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationService.getAllOrganizations,
  });
  
  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClick = () => {
    navigate("/admin/organizations/create");
  };

  const handleCheckboxChange = (organizationId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrganizations([...selectedOrganizations, organizationId]);
    } else {
      setSelectedOrganizations(selectedOrganizations.filter(id => id !== organizationId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrganizations(filteredOrganizations.map(org => org.id));
    } else {
      setSelectedOrganizations([]);
    }
  };

  const handleEditClick = () => {
    if (selectedOrganizations.length === 1) {
      navigate(`/admin/organizations/edit/${selectedOrganizations[0]}`);
    }
  };

  const handleDebugDatabase = async () => {
    try {
      console.log("=== DEBUG: Starting database diagnostics ===");
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("DEBUG: Current user:", user);
      console.log("DEBUG: Auth error:", authError);
      
      // Check raw table access
      const { data: rawData, error: rawError } = await supabase
        .from('organizations')
        .select('*');
      
      console.log("DEBUG: Raw organizations data:", rawData);
      console.log("DEBUG: Raw query error:", rawError);
      console.log("DEBUG: Number of records:", rawData?.length || 0);
      
      // Check RLS policies
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'organizations')
        .catch(() => ({ data: null }));
      
      console.log("DEBUG: RLS policies:", policies);
      
      toast({
        title: "Debug Info",
        description: `Found ${rawData?.length || 0} organizations. Check console for details.`,
      });
      
    } catch (error) {
      console.error("DEBUG: Error during diagnostics:", error);
      toast({
        variant: "destructive",
        title: "Debug Error",
        description: "Error during database diagnostics. Check console.",
      });
    }
  };
  
  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading organizations</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground">Manage your organizations</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDebugDatabase}>
            <Bug className="mr-2 h-4 w-4" />
            Debug DB
          </Button>
          {canEditOrganization && selectedOrganizations.length === 1 && (
            <Button variant="outline" onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {selectedOrganizations.length > 1 && (
            <Button variant="outline" disabled>
              <Edit className="mr-2 h-4 w-4" />
              Edit (Disabled - Multiple Selected)
            </Button>
          )}
          {canCreateOrganization && (
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" /> 
              Create Organization
            </Button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedOrganizations.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Organization Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Updated On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <div className="py-8">
                    <h3 className="text-lg font-medium mb-2">No organizations found</h3>
                    <p className="text-muted-foreground mb-4">
                      {organizations.length === 0 
                        ? "Get started by creating your first organization"
                        : "Try adjusting your search terms"
                      }
                    </p>
                    {canCreateOrganization && organizations.length === 0 && (
                      <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Organization
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map((org: Organization) => {
                const primaryContact = org.contacts?.find(contact => contact.type === 'Registered location') || org.contacts?.[0];
                
                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrganizations.includes(org.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(org.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      {canViewOrganization ? (
                        <Link 
                          to={`/admin/organizations/${org.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {org.name}
                        </Link>
                      ) : (
                        <span>{org.name}</span>
                      )}
                    </TableCell>
                    <TableCell>{org.type}</TableCell>
                    <TableCell>{org.status.charAt(0).toUpperCase() + org.status.slice(1)}</TableCell>
                    <TableCell>
                      {primaryContact ? (
                        <div>
                          <div>{primaryContact.firstName} {primaryContact.lastName}</div>
                          <div className="text-xs text-muted-foreground">{primaryContact.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No contact</span>
                      )}
                    </TableCell>
                    <TableCell>{org.createdBy}</TableCell>
                    <TableCell>{new Date(org.createdOn || '').toLocaleDateString()}</TableCell>
                    <TableCell>{org.updatedBy || '-'}</TableCell>
                    <TableCell>{org.updatedOn ? new Date(org.updatedOn).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrganizationsList;
