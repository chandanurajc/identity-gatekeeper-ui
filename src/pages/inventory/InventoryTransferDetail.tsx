import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Package2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useInventoryTransferPermissions } from "@/hooks/useInventoryTransferPermissions";
import { inventoryTransferService } from "@/services/inventoryTransferService";
import PermissionButton from "@/components/PermissionButton";

export default function InventoryTransferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { canEditInventoryTransfer, canConfirmInventoryTransfer } = useInventoryTransferPermissions();

  const { data: transfer, isLoading, error } = useQuery({
    queryKey: ["inventory-transfer", id],
    queryFn: () => inventoryTransferService.getInventoryTransfer(id!),
    enabled: !!id,
  });

  const confirmTransferMutation = useMutation({
    mutationFn: () => inventoryTransferService.confirmInventoryTransfer(id!, user?.id || ""),
    onSuccess: () => {
      toast.success("Inventory transfer confirmed successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory-transfer", id] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
    },
    onError: (error) => {
      toast.error(`Failed to confirm transfer: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Error loading transfer: {error?.message || "Transfer not found"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleConfirmTransfer = () => {
    confirmTransferMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate("/inventory/transfer")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transfers
          </Button>
          <h1 className="text-3xl font-bold flex items-center">
            <Package2 className="h-8 w-8 mr-3" />
            {transfer.transfer_number}
          </h1>
          <Badge variant={transfer.status === "Transfer confirmed" ? "default" : "secondary"}>
            {transfer.status}
          </Badge>
        </div>

        <div className="flex space-x-2">
          {transfer.status === "Transfer initiated" && canEditInventoryTransfer && (
            <Button variant="outline" onClick={() => navigate(`/inventory/transfer/${id}/edit`)}>
              Edit Transfer
            </Button>
          )}
          
          {transfer.status === "Transfer initiated" && canConfirmInventoryTransfer && (
            <PermissionButton
              permission="Confirm Inventory transfer"
              onClick={handleConfirmTransfer}
              disabled={confirmTransferMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {confirmTransferMutation.isPending ? "Confirming..." : "Confirm Transfer"}
            </PermissionButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transfer ID</p>
                <p className="font-medium">{transfer.transfer_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={transfer.status === "Transfer confirmed" ? "default" : "secondary"}>
                  {transfer.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transfer Date</p>
                <p className="font-medium">{format(new Date(transfer.transfer_date), "MMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                <p className="font-medium">{transfer.tracking_number || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Division Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">From Division</p>
              <p className="font-medium">{transfer.origin_division_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">To Division</p>
              <p className="font-medium">{transfer.destination_division_name}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line #</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity Transferred</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.transfer_lines?.map((line, index) => (
                <TableRow key={line.id}>
                  <TableCell>{line.line_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{line.item_description}</p>
                      <p className="text-sm text-muted-foreground">ID: {line.item_id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {line.quantity_to_transfer.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="font-medium">{transfer.created_by}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created On</p>
                <p className="font-medium">{format(transfer.created_on, "MMM dd, yyyy HH:mm")}</p>
              </div>
              {transfer.updated_by && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Updated By</p>
                    <p className="font-medium">{transfer.updated_by}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Updated On</p>
                    <p className="font-medium">
                      {transfer.updated_on ? format(transfer.updated_on, "MMM dd, yyyy HH:mm") : "-"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}