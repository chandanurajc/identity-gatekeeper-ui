
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SalesChannel } from "@/types/salesChannel";
import { salesChannelService } from "@/services/salesChannelService";
import { useSalesChannelPermissions } from "@/hooks/useSalesChannelPermissions";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import { SearchIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import PermissionButton from "@/components/PermissionButton";

const SalesChannelsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canViewSalesChannel, canCreateSalesChannel, canEditSalesChannel } = useSalesChannelPermissions();
  
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof SalesChannel>("createdOn");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (canViewSalesChannel) {
      fetchSalesChannels();
    } else {
      setLoading(false);
    }
  }, [canViewSalesChannel]);

  useEffect(() => {
    filterAndSortChannels();
  }, [salesChannels, searchTerm, sortField, sortDirection]);

  const fetchSalesChannels = async () => {
    try {
      const data = await salesChannelService.getSalesChannels();
      setSalesChannels(data);
    } catch (error) {
      console.error("Error fetching sales channels:", error);
      toast.error("Failed to fetch sales channels");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortChannels = () => {
    let filtered = salesChannels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (channel.createdBy && channel.createdBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (channel.updatedBy && channel.updatedBy.toLowerCase().includes(searchTerm.toLowerCase()))
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

    setFilteredChannels(filtered);
  };

  const handleSort = (field: keyof SalesChannel) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectChannel = (channelId: string, checked: boolean) => {
    if (checked) {
      setSelectedChannels([...selectedChannels, channelId]);
    } else {
      setSelectedChannels(selectedChannels.filter(id => id !== channelId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedChannels(filteredChannels.map(channel => channel.id));
    } else {
      setSelectedChannels([]);
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sales Channels</h1>
        <PermissionButton
          permission="create-sales-channel"
          onClick={() => navigate("/master-data/sales-channels/create")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Sales Channel
        </PermissionButton>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Sales Channels List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sales channels..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <PermissionButton
                permission="edit-sales-channel"
                onClick={() => {
                  if (selectedChannels.length === 1) {
                    navigate(`/master-data/sales-channels/edit/${selectedChannels[0]}`);
                  }
                }}
                disabled={selectedChannels.length !== 1}
                variant="outline"
              >
                Edit
              </PermissionButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading sales channels...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedChannels.length === filteredChannels.length && filteredChannels.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      Sales Channel Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("status")}
                    >
                      Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
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
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("updatedBy")}
                    >
                      Updated by {sortField === "updatedBy" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("updatedOn")}
                    >
                      Updated on {sortField === "updatedOn" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChannels.length > 0 ? (
                    filteredChannels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedChannels.includes(channel.id)}
                            onCheckedChange={(checked) => handleSelectChannel(channel.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{channel.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            channel.status === 'active' ? 'bg-green-100 text-green-800' :
                            channel.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            channel.status === 'under_development' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {channel.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{channel.createdBy || '-'}</TableCell>
                        <TableCell>{formatDate(channel.createdOn)}</TableCell>
                        <TableCell>{channel.updatedBy || '-'}</TableCell>
                        <TableCell>{formatDate(channel.updatedOn)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        No sales channels found.
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

export default SalesChannelsList;
