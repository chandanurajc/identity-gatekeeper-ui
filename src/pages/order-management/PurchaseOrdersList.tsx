
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { PurchaseOrder } from "@/types/purchaseOrder";
import { format } from "date-fns";

const PurchaseOrdersList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization } = useMultiTenant();
  const { canViewPurchaseOrders, canCreatePurchaseOrder, canEditPurchaseOrder } = usePurchaseOrderPermissions();
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof PurchaseOrder>("createdOn");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (canViewPurchaseOrders && currentOrganization?.id) {
      fetchPurchaseOrders();
    }
  }, [canViewPurchaseOrders, currentOrganization?.id]);

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

  const handleSort = (field: keyof PurchaseOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedOrders = React.useMemo(() => {
    let filtered = purchaseOrders.filter(order => 
      order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [purchaseOrders, searchTerm, sortField, sortDirection]);

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredAndSortedOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Created": return "secondary";
      case "Approved": return "default";
      case "Received": return "default";
      case "Partially Received": return "outline";
      case "Cancelled": return "destructive";
      default: return "secondary";
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
          <div className="flex justify-between items-center">
            <CardTitle>Purchase Orders</CardTitle>
            <div className="flex items-center gap-2">
              {canEditPurchaseOrder && (
                <Button
                  onClick={() => navigate(`/order-management/purchase-orders/${selectedOrders[0]}/edit`)}
                  disabled={selectedOrders.length !== 1 || purchaseOrders.find(order => order.id === selectedOrders[0])?.status !== 'Created'}
                  title={selectedOrders.length === 1 && purchaseOrders.find(order => order.id === selectedOrders[0])?.status !== 'Created' ? 'Can only edit POs with "Created" status' : ''}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {canCreatePurchaseOrder && (
                <Button onClick={() => navigate("/order-management/purchase-orders/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search purchase orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {selectedOrders.length > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {selectedOrders.length} order(s) selected
              </p>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === filteredAndSortedOrders.length && filteredAndSortedOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("poNumber")}
                  >
                    PO Number {sortField === "poNumber" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("supplier")}
                  >
                    Supplier
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                  >
                    Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("poDate")}
                  >
                    PO Date {sortField === "poDate" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
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
                  <TableHead>Updated By</TableHead>
                  <TableHead>Updated On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredAndSortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">No purchase orders found</TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => navigate(`/order-management/purchase-orders/${order.id}`)}
                        >
                          {order.poNumber}
                        </Button>
                      </TableCell>
                      <TableCell>{order.supplier?.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(order.poDate, "dd/MM/yyyy")}</TableCell>
                      <TableCell>{order.createdBy}</TableCell>
                      <TableCell>{format(order.createdOn, "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>{order.updatedBy || "-"}</TableCell>
                      <TableCell>
                        {order.updatedOn ? format(order.updatedOn, "dd/MM/yyyy HH:mm") : "-"}
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

export default PurchaseOrdersList;
