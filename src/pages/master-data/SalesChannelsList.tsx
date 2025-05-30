import React, { useEffect, useState } from "react";
import { SalesChannel } from "@/types/salesChannel";
import { salesChannelService } from "@/services/salesChannelService";
import { useAuth } from "@/context/AuthContext";
import { useSalesChannelPermissions } from "@/hooks/useSalesChannelPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PermissionButton from "@/components/PermissionButton";

const SalesChannelsList = () => {
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const { canViewSalesChannel, canCreateSalesChannel, canEditSalesChannel } = useSalesChannelPermissions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canViewSalesChannel) {
      fetchSalesChannels();
    } else {
      setLoading(false);
    }
  }, [canViewSalesChannel]);

  const fetchSalesChannels = async () => {
    try {
      const data = await salesChannelService.getSalesChannels();
      setSalesChannels(data);
    } catch (error) {
      console.error("Error fetching sales channels:", error);
      toast.error("Failed to load sales channels");
    } finally {
      setLoading(false);
    }
  };

  if (!canViewSalesChannel) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to view sales channels.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">Loading sales channels...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <CardHeader>
          <CardTitle>Sales Channels</CardTitle>
        </CardHeader>
        <PermissionButton
          permission="create-sales-channel"
          onClick={() => navigate("/master-data/sales-channels/create")}
          className="ml-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sales Channel
        </PermissionButton>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesChannels.map((salesChannel) => (
                <TableRow key={salesChannel.id}>
                  <TableCell>{salesChannel.name}</TableCell>
                  <TableCell>{salesChannel.code}</TableCell>
                  <TableCell>{salesChannel.description}</TableCell>
                  <TableCell>
                    <Badge variant={salesChannel.status === "active" ? "outline" : "secondary"}>
                      {salesChannel.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PermissionButton
                        permission="edit-sales-channel"
                        onClick={() => navigate(`/master-data/sales-channels/edit/${salesChannel.id}`)}
                        variant="ghost"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </PermissionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesChannelsList;
