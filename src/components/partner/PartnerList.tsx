
import { useState } from "react";
import { Partner } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { partnerService } from "@/services/partnerService";
import { useAuth } from "@/context/AuthContext";

interface PartnerListProps {
  partners: Partner[];
  onRefresh: () => void;
}

const PartnerList = ({ partners, onRefresh }: PartnerListProps) => {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleStatusToggle = async (partner: Partner) => {
    if (!user?.name && !user?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User information not available",
      });
      return;
    }

    setUpdatingStatus(partner.id);
    try {
      const newStatus = partner.status === 'active' ? 'inactive' : 'active';
      await partnerService.updatePartnerStatus(
        partner.id, 
        newStatus, 
        user.name || user.email || "System"
      );
      
      toast({
        title: "Success",
        description: `Partnership ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
      
      onRefresh();
    } catch (error) {
      console.error("Error updating partner status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update partnership status",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (partners.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground">No partnerships found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first partnership to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partners ({partners.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Name</TableHead>
              <TableHead>Partner Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Partnership Date</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Updated On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-medium">
                  {partner.organizationName}
                  <div className="text-sm text-muted-foreground">
                    {partner.organizationCode}
                  </div>
                </TableCell>
                <TableCell>{partner.organizationType}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={partner.status === 'active'}
                      onCheckedChange={() => handleStatusToggle(partner)}
                      disabled={updatingStatus === partner.id}
                    />
                    <Badge 
                      variant={partner.status === 'active' ? 'default' : 'secondary'}
                    >
                      {partner.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {partner.partnershipDate.toLocaleDateString()}
                </TableCell>
                <TableCell>{partner.createdBy}</TableCell>
                <TableCell>
                  {partner.createdOn.toLocaleDateString()}
                </TableCell>
                <TableCell>{partner.updatedBy || '-'}</TableCell>
                <TableCell>
                  {partner.updatedOn ? partner.updatedOn.toLocaleDateString() : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PartnerList;
