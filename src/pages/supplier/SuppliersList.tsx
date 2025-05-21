
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { Supplier } from "@/types/supplier";
import { supplierService } from "@/services/supplierService";
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

const SuppliersList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewSupplier, canCreateSupplier, canEditSupplier } = usePermissions();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Filtering and sorting states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const data = await supplierService.getAllSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        toast({
          title: "Error",
          description: "Failed to load suppliers.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [toast]);

  // Handle row selection
  const toggleRowSelection = (supplierId: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(supplierId)) {
      newSelectedRows.delete(supplierId);
    } else {
      newSelectedRows.add(supplierId);
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

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (supplier.alias?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
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

  if (!canViewSupplier) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to view suppliers.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Management</h2>
        <div className="flex space-x-2">
          {canEditSupplier && (
            <Button
              variant="outline"
              size="sm"
              disabled={selectedRows.size !== 1}
              onClick={() => {
                const supplierId = Array.from(selectedRows)[0];
                navigate(`/master-data/suppliers/edit/${supplierId}`);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit Supplier
            </Button>
          )}
          {canCreateSupplier && (
            <Button size="sm" onClick={() => navigate("/master-data/suppliers/create")}>
              <Plus className="h-4 w-4 mr-2" /> Create Supplier
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
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
                Supplier Name
                {sortField === "name" && (
                  <span className="ml-2">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
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
                <TableCell colSpan={7} className="text-center py-10">
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(supplier.id)}
                      onCheckedChange={() => toggleRowSelection(supplier.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {canViewSupplier ? (
                      <Link
                        to={`/master-data/suppliers/${supplier.id}`}
                        className="text-primary hover:underline"
                      >
                        {supplier.name}
                      </Link>
                    ) : (
                      supplier.name
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {supplier.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>{supplier.createdBy || "-"}</TableCell>
                  <TableCell>
                    {supplier.createdOn
                      ? new Date(supplier.createdOn).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{supplier.updatedBy || "-"}</TableCell>
                  <TableCell>
                    {supplier.updatedOn
                      ? new Date(supplier.updatedOn).toLocaleDateString()
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

export default SuppliersList;
