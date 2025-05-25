
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { Organization } from "@/types/organization"; 
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { canCreateOrganization, canViewOrganization } = useOrganizationPermissions();
  
  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationService.getAllOrganizations,
  });
  
  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Admin":
        return "bg-purple-500";
      case "Supplier":
        return "bg-blue-500";
      case "Retailer":
        return "bg-orange-500";
      case "Wholesale Customer":
        return "bg-teal-500";
      case "Retail Customer":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const handleCreateClick = () => {
    navigate("/admin/organizations/create");
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
        
        {canCreateOrganization && (
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" /> 
            Create Organization
          </Button>
        )}
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
              <TableHead>Organization Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No organizations found</TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map((org: Organization) => {
                const primaryContact = org.contacts?.find(contact => contact.type === 'Registered location') || org.contacts?.[0];
                
                return (
                  <TableRow key={org.id}>
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
                    <TableCell>
                      <Badge className={getTypeColor(org.type)}>
                        {org.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(org.status)}>
                        {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                      </Badge>
                    </TableCell>
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
