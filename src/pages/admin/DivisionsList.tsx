
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { divisionService } from "@/services/divisionService";
import { useDivisionPermissions } from "@/hooks/useDivisionPermissions";
import { Division } from "@/types/division";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";

const DivisionsList = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewDivision, canCreateDivision, canEditDivision } = useDivisionPermissions();

  // Fetch divisions
  const fetchDivisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await divisionService.getAllDivisions();
      setDivisions(data || []);
    } catch (err) {
      console.error("Error fetching divisions:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch divisions";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch divisions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canViewDivision) {
      fetchDivisions();
    } else {
      setLoading(false);
    }
  }, [canViewDivision, fetchDivisions]);
  
  // Row selection logic
  const handleRowSelect = useCallback((id: string) => {
    setSelectedDivisions((prev) => {
      const result = new Set(prev);
      if (result.has(id)) {
        result.delete(id);
      } else {
        result.add(id);
      }
      return result;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = divisions.map((d) => d.id);
      setSelectedDivisions(new Set(allIds));
    } else {
      setSelectedDivisions(new Set());
    }
  }, [divisions]);

  // Navigation/actions
  const handleCreate = useCallback(() => {
    navigate("/admin/divisions/create");
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (selectedDivisions.size === 1) {
      const divisionId = Array.from(selectedDivisions)[0];
      navigate(`/admin/divisions/edit/${divisionId}`);
    }
  }, [selectedDivisions, navigate]);

  const handleView = useCallback((divisionId: string) => {
    navigate(`/admin/divisions/${divisionId}`);
  }, [navigate]);

  // Sorting
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField]);

  // Filtering
  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  // Optimized filtered and sorted divisions
  const processedDivisions = useMemo(() => {
    let filtered = divisions.filter((division) => {
      return Object.entries(filters).every(([key, val]) => {
        if (!val) return true;
        const fieldValue = String(division[key as keyof Division] || "").toLowerCase();
        return fieldValue.includes(val.toLowerCase());
      });
    });

    return filtered.sort((a, b) => {
      const fieldA = String(a[sortField as keyof Division] || "").toLowerCase();
      const fieldB = String(b[sortField as keyof Division] || "").toLowerCase();
      if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [divisions, filters, sortField, sortDirection]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <div className="text-lg">
                  Loading divisions...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permissions denied
  if (!canViewDivision) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Division Management</CardTitle>
            <CardDescription>Manage organizational divisions</CardDescription>
          </div>
          <div className="flex space-x-2">
            {canCreateDivision && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Division
              </Button>
            )}
            {canEditDivision && (
              <Button
                onClick={handleEdit}
                disabled={selectedDivisions.size !== 1}
                variant="outline"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Division
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter inputs for key fields */}
          <div className="mb-4 grid grid-cols-6 gap-4">
            <Input
              placeholder="Filter by code"
              onChange={(e) => handleFilterChange("code", e.target.value)}
              value={filters.code || ""}
            />
            <Input
              placeholder="Filter by name"
              onChange={(e) => handleFilterChange("name", e.target.value)}
              value={filters.name || ""}
            />
            <Input
              placeholder="Filter by organization"
              onChange={(e) => handleFilterChange("organizationName", e.target.value)}
              value={filters.organizationName || ""}
            />
            <Input
              placeholder="Filter by type"
              onChange={(e) => handleFilterChange("type", e.target.value)}
              value={filters.type || ""}
            />
            <Input
              placeholder="Filter by status"
              onChange={(e) => handleFilterChange("status", e.target.value)}
              value={filters.status || ""}
            />
            <Input
              placeholder="Filter by created by"
              onChange={(e) => handleFilterChange("createdBy", e.target.value)}
              value={filters.createdBy || ""}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedDivisions.size === divisions.length && divisions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("code")}>
                    <div className="flex items-center">
                      Division Code
                      {sortField === "code" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Division Name
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                    <div className="flex items-center">
                      Type
                      {sortField === "type" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center">
                      Status
                      {sortField === "status" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("createdBy")}>
                    <div className="flex items-center">
                      Created By
                      {sortField === "createdBy" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("createdOn")}>
                    <div className="flex items-center">
                      Created On
                      {sortField === "createdOn" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("updatedBy")}>
                    <div className="flex items-center">
                      Updated By
                      {sortField === "updatedBy" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("updatedOn")}>
                    <div className="flex items-center">
                      Updated On
                      {sortField === "updatedOn" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedDivisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">
                      {divisions.length === 0 ? "No divisions found" : "No divisions match the current filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  processedDivisions.map((division) => (
                    <TableRow key={division.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDivisions.has(division.id)}
                          onCheckedChange={() => handleRowSelect(division.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {canViewDivision ? (
                          <button
                            onClick={() => handleView(division.id)}
                            className="text-blue-600 hover:underline focus:outline-none"
                          >
                            {division.code}
                          </button>
                        ) : (
                          division.code
                        )}
                      </TableCell>
                      <TableCell>
                        {canViewDivision ? (
                          <button
                            onClick={() => handleView(division.id)}
                            className="text-blue-600 hover:underline focus:outline-none"
                          >
                            {division.name}
                          </button>
                        ) : (
                          division.name
                        )}
                      </TableCell>
                      <TableCell>{division.organizationName}</TableCell>
                      <TableCell>{division.type}</TableCell>
                      <TableCell>
                        <Badge variant={division.status === 'active' ? 'default' : 'secondary'}>
                          {division.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{division.createdBy}</TableCell>
                      <TableCell>
                        {division.createdOn ? new Date(division.createdOn).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>{division.updatedBy || "-"}</TableCell>
                      <TableCell>
                        {division.updatedOn ? new Date(division.updatedOn).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DivisionsList;

