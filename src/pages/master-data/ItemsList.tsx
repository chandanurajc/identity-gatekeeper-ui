import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Item } from "@/types/item";
import { itemService } from "@/services/itemService";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import { SearchIcon, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import PermissionButton from "@/components/PermissionButton";

const ItemsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canViewItem, canCreateItem, canEditItem } = useItemPermissions();
  
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Item>("createdOn");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (canViewItem) {
      fetchItems();
    } else {
      setLoading(false);
    }
  }, [canViewItem]);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, sortField, sortDirection]);

  const fetchItems = async () => {
    try {
      const data = await itemService.getItems();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = items.filter(item =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.classification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subClassification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.createdBy && item.createdBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.updatedBy && item.updatedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  };

  const handleSort = (field: keyof Item) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  if (!canViewItem) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to view items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Item Master</h1>
        <div className="flex items-center gap-2">
          <PermissionButton
            permission="edit-item"
            onClick={() => {
              if (selectedItems.length === 1) {
                navigate(`/master-data/items/edit/${selectedItems[0]}`);
              }
            }}
            disabled={selectedItems.length !== 1}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </PermissionButton>
          <PermissionButton
            permission="create-item"
            onClick={() => navigate("/master-data/items/create")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Item
          </PermissionButton>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Items List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading items...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("id")}
                    >
                      Item ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("description")}
                    >
                      Description {sortField === "description" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("classification")}
                    >
                      Classification {sortField === "classification" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("subClassification")}
                    >
                      Sub-Classification {sortField === "subClassification" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("status")}
                    >
                      Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("createdBy")}
                    >
                      Created by {sortField === "createdBy" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("createdOn")}
                    >
                      Created on {sortField === "createdOn" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>
                          {canViewItem ? (
                            <button
                              onClick={() => navigate(`/master-data/items/view/${item.id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {item.description}
                            </button>
                          ) : (
                            item.description
                          )}
                        </TableCell>
                        <TableCell>{item.classification}</TableCell>
                        <TableCell>{item.subClassification}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell>{item.barcode || '-'}</TableCell>
                        <TableCell>{item.createdBy || '-'}</TableCell>
                        <TableCell>{formatDate(item.createdOn)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6">
                        No items found.
                      </TableCell>
                    </TableRow>
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

export default ItemsList;
