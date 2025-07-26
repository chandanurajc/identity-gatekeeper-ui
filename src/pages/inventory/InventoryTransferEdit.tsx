import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { inventoryTransferService } from "@/services/inventoryTransferService";

const editTransferSchema = z.object({
  tracking_number: z.string().optional(),
});

type EditTransferFormData = z.infer<typeof editTransferSchema>;

export default function InventoryTransferEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: transfer, isLoading, error } = useQuery({
    queryKey: ["inventory-transfer", id],
    queryFn: () => inventoryTransferService.getInventoryTransfer(id!),
    enabled: !!id,
  });

  const form = useForm<EditTransferFormData>({
    resolver: zodResolver(editTransferSchema),
    defaultValues: {
      tracking_number: "",
    },
  });

  // Update form when transfer data loads
  React.useEffect(() => {
    if (transfer) {
      form.reset({
        tracking_number: transfer.tracking_number || "",
      });
    }
  }, [transfer, form]);

  const updateTransferMutation = useMutation({
    mutationFn: (data: EditTransferFormData) => 
      inventoryTransferService.updateInventoryTransfer(id!, data.tracking_number),
    onSuccess: () => {
      toast.success("Transfer updated successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory-transfer", id] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      navigate(`/inventory/transfer/${id}`);
    },
    onError: (error) => {
      toast.error(`Failed to update transfer: ${error.message}`);
    },
  });

  const onSubmit = (data: EditTransferFormData) => {
    updateTransferMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-64" />
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

  if (transfer.status !== "Transfer initiated") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            This transfer cannot be edited because it has been confirmed.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(`/inventory/transfer/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transfer
        </Button>
        <h1 className="text-3xl font-bold">Edit Transfer: {transfer.transfer_number}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Only the tracking number can be edited for transfers in "Transfer initiated" status.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transfer ID</label>
                  <p className="text-sm mt-1">{transfer.transfer_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm mt-1">{transfer.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">From Division</label>
                  <p className="text-sm mt-1">{transfer.origin_division_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">To Division</label>
                  <p className="text-sm mt-1">{transfer.destination_division_name}</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="tracking_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tracking number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/inventory/transfer/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTransferMutation.isPending}
            >
              {updateTransferMutation.isPending ? "Updating..." : "Update Transfer"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}