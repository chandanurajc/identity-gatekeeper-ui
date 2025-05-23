
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { Organization } from "@/types/organization";
import { organizationService } from "@/services/organizationService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewOrganization, canCreateOrganization, canEditOrganization } = useOrganizationPermissions();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Filtering and sorting states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const data = await organizationService.getAllOrganizations();
        setOrganizations(data);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast({
          title: "Error",
          description: "Failed to load organizations.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [toast]);

  // Handle row selection
  const toggleRowSelection = (organizationId: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(organizationId)) {
      newSelectedRows.delete(organizationId);
    } else {
      newSelectedRows.add(organizationId);
    }
    setSelectedRows(newSelectedRows);
  };

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort organizations
  const filteredAndSortedOrganizations = organizations
    .filter(organization => {
      const matchesSearch = organization.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            organization.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (organization.alias?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesStatus = statusFilter === "all" || organization.status === statusFilter;
      const matchesType = typeFilter === "all" || organization.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "code") {
        return sortDirection === "asc" 
          ? a.code.localeCompare(b.code)
          : b.code.localeCompare(a.code);
      } else if (sortField === "createdOn") {
        const dateA = a.createdOn ? new Date(a.createdOn).getTime() : 0;
        const dateB = b.createdOn ? new Date(b.createdOn).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortField === "updatedOn") {
        const dateA = a.updatedOn ? new Date(a.updatedOn).getTime() : 0;
        const dateB = b.updatedOn ? new Date(b.updatedOn).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

  if (!canViewOrganization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to view organizations.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Organization Management</h2>
        <div className="flex space-x-2">
          {canEditOrganization && (
            <Button
              variant="outline"
              size="sm"
              disabled={selectedRows.size !== 1}
              onClick={() => {
                const organizationId = Array.from(selectedRows)[0];
                navigate(`/admin/organizations/edit/${organizationId}`);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit Organization
            </Button>
          )}
          {canCreateOrganization && (
            <Button size="sm" onClick={() => navigate("/admin/organizations/create")}>
              <Plus className="h-4 w-4 mr-2" /> Create Organization
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Supplier">Supplier</SelectItem>
              <SelectItem value="Retailer">Retailer</SelectItem>
              <SelectItem value="Wholesale Customer">Wholesale Customer</SelectItem>
              <SelectItem value="Retail Customer">Retail Customer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                Organization Name
                {sortField === "name" && (
                  <span className="ml-2">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("code")}>
                Code
                {sortField === "code" && (
                  <span className="ml-2">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("createdOn")}>
                Created On
                {sortField === "createdOn" && (
                  <span className="ml-2">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("updatedOn")}>
                Updated On
                {sortField === "updatedOn" && (
                  <span className="ml-2">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  Loading organizations...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  No organizations found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedOrganizations.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(organization.id)}
                      onCheckedChange={() => toggleRowSelection(organization.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {canViewOrganization ? (
                      <Link
                        to={`/admin/organizations/${organization.id}`}
                        className="text-primary hover:underline"
                      >
                        {organization.name}
                      </Link>
                    ) : (
                      organization.name
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {organization.code}
                    </span>
                  </TableCell>
                  <TableCell>{organization.type}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        organization.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {organization.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>{organization.createdBy || "-"}</TableCell>
                  <TableCell>
                    {organization.createdOn
                      ? new Date(organization.createdOn).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{organization.updatedBy || "-"}</TableCell>
                  <TableCell>
                    {organization.updatedOn
                      ? new Date(organization.updatedOn).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrganizationsList;
