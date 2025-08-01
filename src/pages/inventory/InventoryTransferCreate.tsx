import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { inventoryTransferService } from "@/services/inventoryTransferService";
import { inventoryService } from "@/services/inventoryService";
import { divisionService } from "@/services/divisionService";
import { itemService } from "@/services/itemService";
import { InventoryTransferFormData } from "@/types/inventoryTransfer";
import { Division } from "@/types/division";
import { Item } from "@/types/item";
import { InventoryStockSummaryItem } from "@/types/inventory";

const transferLineSchema = z.object({
  item_id: z.string().min(1, "Item is required"),
  quantity_to_transfer: z.number().min(0.01, "Quantity must be greater than 0"),
});

const transferSchema = z.object({
  origin_division_id: z.string().min(1, "Origin division is required"),
  destination_division_id: z.string().min(1, "Destination division is required"),
  transfer_date: z.string().min(1, "Transfer date is required"),
  tracking_number: z.string().optional(),
  transfer_lines: z.array(transferLineSchema).min(1, "At least one transfer line is required"),
}).refine((data) => data.origin_division_id !== data.destination_division_id, {
  message: "Origin and destination divisions must be different",
  path: ["destination_division_id"],
});

export default function InventoryTransferCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const form = useForm<InventoryTransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      origin_division_id: "",
      destination_division_id: "",
      transfer_date: format(new Date(), "yyyy-MM-dd"),
      tracking_number: "",
      transfer_lines: [{ item_id: "", quantity_to_transfer: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "transfer_lines",
  });

  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  const originDivisionId = form.watch("origin_division_id");
  const destinationDivisionId = form.watch("destination_division_id");

  // Fetch divisions
  const { data: divisions } = useQuery({
    queryKey: ["divisions", organizationId],
    queryFn: () => divisionService.getDivisions(organizationId),
    enabled: !!organizationId,
  });

  // Fetch items
  const { data: items } = useQuery({
    queryKey: ["items", organizationId],
    queryFn: () => itemService.getItems(),
    enabled: !!organizationId,
  });

  // Fetch inventory stock summary for quantities
  const { data: stockSummary } = useQuery({
    queryKey: ["inventory-stock-summary", organizationId],
    queryFn: () => inventoryService.getInventoryStockSummary(organizationId, true),
    enabled: !!organizationId,
  });

  const createTransferMutation = useMutation({
    mutationFn: inventoryTransferService.createInventoryTransfer,
    onSuccess: () => {
      toast.success("Inventory transfer created successfully");
      navigate("/inventory/transfer");
    },
    onError: (error) => {
      toast.error(`Failed to create transfer: ${error.message}`);
    },
  });

  const onSubmit = (data: InventoryTransferFormData) => {
    if (!user?.id || !organizationId) return;

    const transferData = {
      organization_id: organizationId,
      origin_division_id: data.origin_division_id,
      destination_division_id: data.destination_division_id,
      transfer_date: data.transfer_date,
      tracking_number: data.tracking_number,
      created_by: user.id,
          transfer_lines: data.transfer_lines.map((line: any, idx: number) => {
            const item = items?.find(item => item.id === line.item_id);
            const unitCost = item?.costs?.[0]?.cost || 0;
            const inventoryCost = unitCost * (line.quantity_to_transfer || 0);
            return {
              line_number: idx + 1,
              item_id: line.item_id,
              quantity_to_transfer: line.quantity_to_transfer,
              inventory_cost: inventoryCost,
            };
          }),
    };

    createTransferMutation.mutate(transferData);
  };

  const getQuantityInDivision = (itemId: string, divisionId: string): number => {
    if (!stockSummary || !itemId || !divisionId) return 0;
    const stock = stockSummary.find(
      s => s.item_id === itemId && s.division_id === divisionId
    );
    return stock?.quantity_available || 0;
  };

  const addTransferLine = () => {
    append({ item_id: "", quantity_to_transfer: 0 });
    setSearchTerms(prev => [...prev, ""]);
  };

  const removeTransferLine = (index: number) => {
    const lineItemId = form.getValues(`transfer_lines.${index}.item_id`);
    if (lineItemId) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(lineItemId);
        return newSet;
      });
    }
    remove(index);
    setSearchTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, itemId: string) => {
    const previousItemId = form.getValues(`transfer_lines.${index}.item_id`);
    
    // Remove previous item from selected set
    if (previousItemId) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(previousItemId);
        return newSet;
      });
    }

    // Add new item to selected set
    if (itemId) {
      setSelectedItems(prev => new Set(prev).add(itemId));
    }

    // Reset quantity when item changes
    form.setValue(`transfer_lines.${index}.quantity_to_transfer`, 0);
  };

  const availableItems = items?.filter(item => !selectedItems.has(item.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create Inventory Transfer</h1>
        <Button variant="outline" onClick={() => navigate("/inventory/transfer")}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origin_division_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin Division</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select origin division" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {divisions?.map((division) => (
                            <SelectItem key={division.id} value={division.id}>
                              {division.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination_division_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Division</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination division" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {divisions?.filter(d => d.id !== originDivisionId)?.map((division) => (
                            <SelectItem key={division.id} value={division.id}>
                              {division.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-row gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <FormField
                      control={form.control}
                      name="transfer_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Transfer Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <FormField
                      control={form.control}
                      name="tracking_number"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Tracking Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tracking number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transfer Lines</CardTitle>
                <Button type="button" onClick={addTransferLine} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 font-medium text-center">#</th>
                      <th className="px-2 py-2 font-medium text-center">Item *</th>
                      <th className="px-2 py-2 font-medium text-center">Desc.</th>
                      <th className="px-2 py-2 font-medium text-center">Origin Qty</th>
                      <th className="px-2 py-2 font-medium text-center">Transfer Qty</th>
                      <th className="px-2 py-2 font-medium text-center">Dest. Qty</th>
                      <th className="px-2 py-2 font-medium text-center">Inventory Cost</th>
                      <th className="px-2 py-2 font-medium text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const lineItemId = form.watch(`transfer_lines.${index}.item_id`);
                      const originQty = getQuantityInDivision(lineItemId, originDivisionId);
                      const destinationQty = getQuantityInDivision(lineItemId, destinationDivisionId);
                      const currentItem = items?.find(item => item.id === lineItemId);
                      const unitCost = currentItem?.costs?.[0]?.cost || 0;
                      const transferQty = form.watch(`transfer_lines.${index}.quantity_to_transfer`);
                      const inventoryCost = unitCost * transferQty;
                      const searchTerm = searchTerms[index] || "";
                      const handleSearchChange = (val: string) => {
                        setSearchTerms(prev => {
                          const copy = [...prev];
                          copy[index] = val;
                          return copy;
                        });
                      };
                      const filteredItems = availableItems
                        .filter(item =>
                          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice(0, 10);
                      return (
                        <tr key={field.id} className="border-b">
                          <td className="px-2 py-2 text-center align-middle">{index + 1}</td>
                          <td className="px-2 py-2 align-middle">
                            <Input
                              placeholder="Search by ID or description"
                              value={searchTerm}
                              onChange={e => handleSearchChange(e.target.value)}
                              className="h-8 text-xs text-center mb-1"
                            />
                            <FormField
                              control={form.control}
                              name={`transfer_lines.${index}.item_id`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      handleItemChange(index, value);
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select Item" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {filteredItems.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                          <div className="flex flex-col items-start">
                                            <span className="font-medium">{item.id}</span>
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <Input
                              value={currentItem?.description || ""}
                              readOnly
                              placeholder="Item description"
                              className="h-8 text-xs text-center bg-gray-50"
                            />
                          </td>
                          <td className="px-2 py-2 text-center align-middle">{originQty.toLocaleString()}</td>
                          <td className="px-2 py-2 align-middle">
                            <FormField
                              control={form.control}
                              name={`transfer_lines.${index}.quantity_to_transfer`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={originQty}
                                      disabled={originQty === 0}
                                      placeholder="0"
                                      className="h-8 text-xs text-center"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-2 py-2 text-center align-middle">{destinationQty.toLocaleString()}</td>
                          <td className="px-2 py-2 text-center align-middle">{isNaN(inventoryCost) ? '-' : inventoryCost.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</td>
                          <td className="px-2 py-2 text-center align-middle">
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeTransferLine(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/inventory/transfer")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransferMutation.isPending}
            >
              {createTransferMutation.isPending ? "Creating..." : "Create Transfer"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}