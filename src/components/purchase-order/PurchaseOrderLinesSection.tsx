import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { PurchaseOrderLine, Item } from "@/types/purchaseOrder";

interface POLinesSectionProps {
  fields: any;
  append: (line: PurchaseOrderLine) => void;
  remove: (idx: number) => void;
  watchedLines: PurchaseOrderLine[];
  setValue: any;
  items: Item[];
  filteredItems: Item[];
  searchItems: (s: string) => void;
  handleItemChange: (idx: number, id: string) => void;
  calculateLineTotal: (idx: number) => void;
  errors: any;
  addPOLine: () => void;
}

const PurchaseOrderLinesSection: React.FC<POLinesSectionProps> = ({
  fields,
  append,
  remove,
  watchedLines,
  setValue,
  items,
  filteredItems,
  searchItems,
  handleItemChange,
  calculateLineTotal,
  errors,
  addPOLine,
}) => {

  const calculateSummary = () => {
    const itemTotal = watchedLines.reduce((sum, line) => sum + (line.totalUnitPrice || 0), 0);
    const totalGST = watchedLines.reduce((sum, line) => sum + (line.gstValue || 0), 0);
    return { itemTotal, totalGST };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Purchase Order Lines</CardTitle>
          <Button type="button" onClick={addPOLine}>
            <Plus className="mr-2 h-4 w-4" />
            Add PO Line
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="rounded-md border min-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[60px]">Line #</TableHead>
                  <TableHead className="min-w-[200px]">Item *</TableHead>
                  <TableHead className="min-w-[200px]">Item Description</TableHead>
                  <TableHead className="min-w-[80px]">Qty *</TableHead>
                  <TableHead className="min-w-[80px]">UOM *</TableHead>
                  <TableHead className="min-w-[100px]">Unit Cost *</TableHead>
                  <TableHead className="min-w-[120px]">Total Item Cost</TableHead>
                  <TableHead className="min-w-[80px]">GST %</TableHead>
                  <TableHead className="min-w-[100px]">GST Value</TableHead>
                  <TableHead className="min-w-[100px]">Line Total</TableHead>
                  <TableHead className="min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field: any, index: number) => {
                  const selectedItem = items.find(item => item.id === watchedLines[index]?.itemId);
                  return (
                    <TableRow key={field.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Input
                            placeholder="Search by Item ID"
                            onChange={(e) => searchItems(e.target.value)}
                            className="mb-2"
                          />
                          <Select 
                            onValueChange={(value) => handleItemChange(index, value)} 
                            defaultValue={watchedLines[index]?.itemId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Item" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.id} - {item.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={selectedItem?.description || ""}
                          readOnly
                          className="bg-muted"
                          placeholder="Item description will appear here"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={watchedLines[index]?.quantity ?? ""}
                          onChange={(e) => {
                            setValue(`lines.${index}.quantity`, parseFloat(e.target.value) || 0);
                            calculateLineTotal(index);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={watchedLines[index]?.uom || ""}
                          readOnly
                          className="bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={watchedLines[index]?.unitPrice ?? ""}
                          onChange={(e) => {
                            setValue(`lines.${index}.unitPrice`, parseFloat(e.target.value) || 0);
                            calculateLineTotal(index);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={watchedLines[index]?.totalUnitPrice?.toFixed(2) || "0.00"}
                          readOnly
                          className="bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={watchedLines[index]?.gstPercent ?? ""}
                          onChange={(e) => {
                            setValue(`lines.${index}.gstPercent`, parseFloat(e.target.value) || 0);
                            calculateLineTotal(index);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={watchedLines[index]?.gstValue?.toFixed(2) || "0.00"}
                          readOnly
                          className="bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={watchedLines[index]?.lineTotal?.toFixed(2) || "0.00"}
                          readOnly
                          className="bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No line items added yet. Click "Add PO Line" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {fields.length > 0 && (() => {
          const { itemTotal, totalGST } = calculateSummary();
          return (
            <div className="mt-4 flex justify-end">
              <Card className="w-80">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Item Cost:</span>
                      <span>₹{itemTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total GST Value:</span>
                      <span>₹{totalGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Grand Total:</span>
                      <span>₹{(itemTotal + totalGST).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderLinesSection;
