
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { PurchaseOrder } from "@/types/purchaseOrder";
import { formatDate } from "@/lib/utils";
import { Plus, Edit, Eye, Search } from "lucide-react";

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization } = useMultiTenant();
  const { canViewPurchaseOrders, canCreatePurchaseOrder, canEditPurchaseOrder } = usePurchaseOrderPermissions();
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof PurchaseOrder>("createdOn");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (canViewPurchaseOrders && currentOrganization?.id) {
      fetchPurchaseOrders();
    }
  }, [canViewPurchaseOrders, currentOrganization?.id]);

  useEffect(() => {
    filterAndSortPOs();
  }, [purchaseOrders, searchTerm, statusFilter, sortField, sortDirection]);

  const fetchPurchaseOrders = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      setLoading(true);
      const data = await purchaseOrderService.getAllPurchaseOrders(currentOrganization.id);
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPOs = () => {
    let filtered = [...purchaseOrders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(po => 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.division?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(po => po.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredPOs(filtered);
  };

  const handleSort = (field: keyof PurchaseOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Created":
        return "secondary";
      case "Approved":
        return "default";
      case "Received":
        return "default";
      default:
        return "secondary";
    }
  };

  if (!canViewPurchaseOrders) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to view purchase orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Purchase Orders</CardTitle>
            {canCreatePurchaseOrder && (
              <Button onClick={() => navigate("/order-management/purchase-orders/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create PO
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PO Number, Supplier, or Division..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Created">Created</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading purchase orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("poNumber")}
                    >
                      PO Number {sortField === "poNumber" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("poDate")}
                    >
                      PO Date {sortField === "poDate" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("status")}
                    >
                      Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Requested Delivery</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("createdBy")}
                    >
                      Created By {sortField === "createdBy" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("createdOn")}
                    >
                      Created On {sortField === "createdOn" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No purchase orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">
                          {canViewPurchaseOrders ? (
                            <button
                              onClick={() => navigate(`/order-management/purchase-orders/${po.id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {po.poNumber}
                            </button>
                          ) : (
                            po.poNumber
                          )}
                        </TableCell>
                        <TableCell>{formatDate(po.poDate)}</TableCell>
                        <TableCell>{po.division?.name || "-"}</TableCell>
                        <TableCell>{po.supplier?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(po.status)}>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {po.requestedDeliveryDate ? formatDate(po.requestedDeliveryDate) : "-"}
                        </TableCell>
                        <TableCell>{po.createdBy || "-"}</TableCell>
                        <TableCell>{formatDate(po.createdOn)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/order-management/purchase-orders/${po.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEditPurchaseOrder && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/order-management/purchase-orders/edit/${po.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderList;
