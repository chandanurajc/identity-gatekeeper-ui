
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemGroup, ItemGroupFormData } from "@/types/itemGroup";
import ItemGroupForm from "@/components/itemGroup/ItemGroupForm";
import { itemGroupService } from "@/services/itemGroupService";
import { Edit, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

const ItemGroupsList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItemGroup, setEditingItemGroup] = useState<ItemGroup | null>(null);

  const canViewItemGroup = hasPermission("view-item-group");
  const canCreateItemGroup = hasPermission("create-item-group");
  const canEditItemGroup = hasPermission("edit-item-group");

  useEffect(() => {
    if (canViewItemGroup) {
      fetchItemGroups();
    }
  }, [canViewItemGroup]);

  const fetchItemGroups = async () => {
    try {
      setLoading(true);
      const data = await itemGroupService.getItemGroups();
      setItemGroups(data);
    } catch (error) {
      console.error("Error fetching item groups:", error);
      toast({
        title: "Error",
        description: "Failed to load item groups.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: ItemGroupFormData) => {
    if (!user?.id) return;
    
    try {
      await itemGroupService.createItemGroup(formData, user.email || user.id);
      toast({
        title: "Success",
        description: "Item group created successfully.",
      });
      fetchItemGroups();
    } catch (error) {
      console.error("Error creating item group:", error);
      throw error;
    }
  };

  const handleEdit = async (formData: ItemGroupFormData) => {
    if (!editingItemGroup || !user?.id) return;
    
    try {
      await itemGroupService.updateItemGroup(
        editingItemGroup.id, 
        formData, 
        user.email || user.id
      );
      toast({
        title: "Success",
        description: "Item group updated successfully.",
      });
      setEditingItemGroup(null);
      fetchItemGroups();
    } catch (error) {
      console.error("Error updating item group:", error);
      throw error;
    }
  };

  const handleStatusToggle = async (itemGroup: ItemGroup) => {
    if (!canEditItemGroup || !user?.id) return;
    
    try {
      const newStatus = itemGroup.status === 'active' ? 'inactive' : 'active';
      await itemGroupService.updateItemGroupStatus(
        itemGroup.id, 
        newStatus, 
        user.email || user.id
      );
      toast({
        title: "Success",
        description: "Item group status updated successfully.",
      });
      fetchItemGroups();
    } catch (error) {
      console.error("Error updating item group status:", error);
      toast({
        title: "Error",
        description: "Failed to update item group status.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(itemGroups.map(ig => ig.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (itemGroupId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, itemGroupId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== itemGroupId));
    }
  };

  const openEditForm = (itemGroup: ItemGroup) => {
    setEditingItemGroup(itemGroup);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItemGroup(null);
  };

  if (!canViewItemGroup) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to view item groups.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading item groups...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Item Groups</h2>
          <p className="text-muted-foreground">Manage item classification and groupings.</p>
        </div>
        <div className="flex gap-2">
          {canCreateItemGroup && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Item Group
            </Button>
          )}
          {canEditItemGroup && selectedIds.length === 1 && (
            <Button 
              variant="outline" 
              onClick={() => {
                const itemGroup = itemGroups.find(ig => ig.id === selectedIds[0]);
                if (itemGroup) openEditForm(itemGroup);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Groups List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === itemGroups.length && itemGroups.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Item Group</TableHead>
                <TableHead>Item Classification</TableHead>
                <TableHead>Item Sub-Classification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created on</TableHead>
                <TableHead>Updated by</TableHead>
                <TableHead>Updated on</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemGroups.map((itemGroup) => (
                <TableRow key={itemGroup.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(itemGroup.id)}
                      onCheckedChange={(checked) => handleSelectItem(itemGroup.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{itemGroup.name}</TableCell>
                  <TableCell>{itemGroup.classification}</TableCell>
                  <TableCell>{itemGroup.subClassification}</TableCell>
                  <TableCell>
                    <Switch
                      checked={itemGroup.status === 'active'}
                      onCheckedChange={() => handleStatusToggle(itemGroup)}
                      disabled={!canEditItemGroup}
                    />
                  </TableCell>
                  <TableCell>{itemGroup.createdBy}</TableCell>
                  <TableCell>{itemGroup.createdOn ? formatDate(itemGroup.createdOn) : '-'}</TableCell>
                  <TableCell>{itemGroup.updatedBy || '-'}</TableCell>
                  <TableCell>{itemGroup.updatedOn ? formatDate(itemGroup.updatedOn) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ItemGroupForm
        initialData={editingItemGroup ? {
          name: editingItemGroup.name,
          classification: editingItemGroup.classification,
          subClassification: editingItemGroup.subClassification,
          status: editingItemGroup.status,
        } : undefined}
        onSubmit={editingItemGroup ? handleEdit : handleCreate}
        isOpen={showForm}
        onClose={closeForm}
        isEditing={!!editingItemGroup}
      />
    </div>
  );
};

export default ItemGroupsList;
