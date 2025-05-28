
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Item } from "@/types/item";
import { itemService } from "@/services/itemService";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";
import PermissionButton from "@/components/PermissionButton";

const ItemView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canViewItem, canEditItem } = useItemPermissions();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canViewItem && id) {
      fetchItem();
    } else {
      setLoading(false);
    }
  }, [canViewItem, id]);

  const fetchItem = async () => {
    if (!id) return;
    
    try {
      const itemData = await itemService.getItemById(id);
      if (itemData) {
        setItem(itemData);
      } else {
        toast.error("Item not found");
        navigate("/master-data/items");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      toast.error("Failed to fetch item");
      navigate("/master-data/items");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">Loading item...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Item Not Found</h2>
          <p>The requested item could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/master-data/items")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Items
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{item.description}</h1>
            <p className="text-muted-foreground">Item ID: {item.id}</p>
          </div>
        </div>
        <PermissionButton
          permission="edit-item"
          onClick={() => navigate(`/master-data/items/edit/${item.id}`)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Item
        </PermissionButton>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="physical">Physical Properties</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm">{item.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Classification</label>
                  <p className="text-sm">{item.classification}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sub-Classification</label>
                  <p className="text-sm">{item.subClassification}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Barcode</label>
                  <p className="text-sm">{item.barcode || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm">{item.createdBy || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created On</label>
                  <p className="text-sm">{formatDate(item.createdOn)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated By</label>
                  <p className="text-sm">{item.updatedBy || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="physical">
          <Card>
            <CardHeader>
              <CardTitle>Physical Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Length (cm)</label>
                  <p className="text-sm">{item.length || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Width (cm)</label>
                  <p className="text-sm">{item.width || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Height (cm)</label>
                  <p className="text-sm">{item.height || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Weight (kg)</label>
                  <p className="text-sm">{item.weight || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Costs</CardTitle>
            </CardHeader>
            <CardContent>
              {item.costs && item.costs.length > 0 ? (
                <div className="space-y-2">
                  {item.costs.map((cost, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span>Supplier: {cost.supplierId}</span>
                      <span>Cost: ${cost.cost}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No supplier costs defined</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>Sales Channel Prices</CardTitle>
            </CardHeader>
            <CardContent>
              {item.prices && item.prices.length > 0 ? (
                <div className="space-y-2">
                  {item.prices.map((price, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span>Channel: {price.salesChannelId}</span>
                      <span>Price: ${price.price}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No sales channel prices defined</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ItemView;
