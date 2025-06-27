import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { divisionService } from "@/services/divisionService";
import { useDivisionPermissions } from "@/hooks/useDivisionPermissions";
import { useAuth } from "@/context/AuthContext";
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
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState, useCallback } from "react";

const DivisionsList = () => {
  const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canViewDivision, canCreateDivision, canEditDivision } = useDivisionPermissions();

  // Fetch divisions using react-query and the centralized service.
  const {
    data: divisions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["divisions", "all"],
    queryFn: () => divisionService.getAllDivisions(),
    enabled: canViewDivision,
    meta: {
      onError: (error: any) => {
        toast({
          title: "Failed to load divisions",
          description: error?.message || "Please check your permissions/data.",
          variant: "destructive",
        });
      }
    }
  });

  // Selection logic
  const handleRowSelect = useCallback((id: string) => {
    setSelectedDivisions(prev => {
      const result = new Set(prev);
      if (result.has(id)) result.delete(id); else result.add(id);
      return result;
    });
  }, []);
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) setSelectedDivisions(new Set(divisions.map(d => d.id)));
    else setSelectedDivisions(new Set());
  }, [divisions]);
  const handleCreate = useCallback(() => navigate("/admin/divisions/create"), [navigate]);
  const handleEdit = useCallback(() => {
    if (selectedDivisions.size === 1) {
      const id = Array.from(selectedDivisions)[0];
      navigate(`/admin/divisions/edit/${id}`);
    }
  }, [selectedDivisions, navigate]);
  const handleView = useCallback((id: string) => navigate(`/admin/divisions/${id}`), [navigate]);
  const handleSort = useCallback((field: string) => {
    setSortField(f => field);
    setSortDirection(d => (sortField === field ? (d === "asc" ? "desc" : "asc") : "asc"));
  }, [sortField]);
  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);
  const handleRefresh = useCallback(() => refetch(), [refetch]);

  // Filtering and sorting logic (Client-side for now)
  const processedDivisions = useMemo(() => {
    let filtered = divisions.filter(division => {
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

  // UI
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

  // Loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <span className="animate-spin text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} fill="none" opacity=".25"/>
              <path d="M20 12A8 8 0 1 1 4 12" stroke="currentColor" strokeWidth={4}/>
            </svg>
          </span>
          <span className="text-lg">Loading divisions…</span>
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 bg-destructive/5 border border-destructive rounded-lg">
          <div className="mb-3 text-destructive font-semibold">
            {(error as Error)?.message || "Error loading divisions."}
          </div>
          <Button onClick={handleRefresh} variant="outline">Reload</Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && divisions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 bg-muted rounded-lg text-center">
          <div className="mb-2 text-lg font-semibold">No divisions found.</div>
          <div className="mb-4 text-sm text-muted-foreground">Try adding a division, or check your permissions.</div>
        </div>
      </div>
    );
  }

  // MAIN table UI
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
            <Button onClick={handleRefresh} variant="ghost">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-6 gap-4">
            <Input
              placeholder="Filter by code"
              onChange={e => handleFilterChange("code", e.target.value)}
              value={filters.code || ""}
            />
            <Input
              placeholder="Filter by name"
              onChange={e => handleFilterChange("name", e.target.value)}
              value={filters.name || ""}
            />
            <Input
              placeholder="Filter by organization"
              onChange={e => handleFilterChange("organizationName", e.target.value)}
              value={filters.organizationName || ""}
            />
            <Input
              placeholder="Filter by type"
              onChange={e => handleFilterChange("type", e.target.value)}
              value={filters.type || ""}
            />
            <Input
              placeholder="Filter by status"
              onChange={e => handleFilterChange("status", e.target.value)}
              value={filters.status || ""}
            />
            <Input
              placeholder="Filter by created by"
              onChange={e => handleFilterChange("createdBy", e.target.value)}
              value={filters.createdBy || ""}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedDivisions.size === processedDivisions.length && processedDivisions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("code")}>
                    <div className="flex items-center">
                      Division Code
                      {sortField === "code" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Division Name
                      {sortField === "name" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("organizationName")}>
                    <div className="flex items-center">
                      Organization
                      {sortField === "organizationName" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                    <div className="flex items-center">
                      Type
                      {sortField === "type" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center">
                      Status
                      {sortField === "status" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("createdBy")}>
                    <div className="flex items-center">
                      Created By
                      {sortField === "createdBy" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("createdOn")}>
                    <div className="flex items-center">
                      Created On
                      {sortField === "createdOn" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("updatedBy")}>
                    <div className="flex items-center">
                      Updated By
                      {sortField === "updatedBy" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("updatedOn")}>
                    <div className="flex items-center">
                      Updated On
                      {sortField === "updatedOn" && (sortDirection === "asc"
                        ? <ArrowUp className="ml-1 h-4 w-4" />
                        : <ArrowDown className="ml-1 h-4 w-4" />)}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedDivisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">
                      No divisions match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  processedDivisions.map(division => (
                    <TableRow key={division.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDivisions.has(division.id)}
                          onCheckedChange={() => handleRowSelect(division.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleView(division.id)}
                          className="text-blue-600 hover:underline focus:outline-none"
                        >
                          {division.code}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleView(division.id)}
                          className="text-blue-600 hover:underline focus:outline-none"
                        >
                          {division.name}
                        </button>
                      </TableCell>
                      <TableCell>{division.organizationName}</TableCell>
                      <TableCell>{division.type}</TableCell>
                      <TableCell>
                        <Badge variant={division.status === "active" ? "default" : "secondary"}>
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
