import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { PurchaseOrderLine } from "@/types/purchaseOrder";
import { Item } from "@/types/item";

// --- UI Clean: helper styles for lean table ---
const sectionTitleClass = "text-lg font-semibold text-muted-foreground tracking-tight mb-2";
const summaryCardClass = "w-80 border border-muted/30 rounded-lg bg-muted/40";

const PurchaseOrderLinesSection = ({
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
    <Card className="rounded-lg border border-muted/30 mb-3 shadow-sm bg-white">
      <CardHeader className="pb-2 bg-transparent border-none">
        <div className="flex justify-between items-center">
          <CardTitle className={sectionTitleClass}>PO Lines</CardTitle>
          <Button type="button" onClick={addPOLine} size="sm">
            + Add Line
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <div className="rounded border border-muted/30 min-w-full">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="min-w-[36px] py-1">#</TableHead>
                  <TableHead className="min-w-[120px] py-1">Item *</TableHead>
                  <TableHead className="min-w-[120px] py-1">Desc.</TableHead>
                  <TableHead className="min-w-[44px] py-1">Qty *</TableHead>
                  <TableHead className="min-w-[48px] py-1">UOM *</TableHead>
                  <TableHead className="min-w-[68px] py-1">Cost *</TableHead>
                  <TableHead className="min-w-[68px] py-1">Total</TableHead>
                  <TableHead className="min-w-[52px] py-1">GST %</TableHead>
                  <TableHead className="min-w-[68px] py-1">GST Val</TableHead>
                  <TableHead className="min-w-[56px] py-1">Total</TableHead>
                  <TableHead className="min-w-[32px] py-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const selectedItem = items.find(item => item.id === watchedLines[index]?.itemId);
                  return (
                    <TableRow key={field.id}>
                      <TableCell className="py-1">{index + 1}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            placeholder="Search by ID"
                            onChange={(e) => searchItems(e.target.value)}
                            className="mb-1"
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
                          className="bg-muted/40"
                          placeholder="Item description"
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
                          className="bg-muted/40"
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
                          className="bg-muted/40"
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
                          className="bg-muted/40"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={watchedLines[index]?.lineTotal?.toFixed(2) || "0.00"}
                          readOnly
                          className="bg-muted/40"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => remove(index)}
                          aria-label="Remove line"
                        >
                          <span className="sr-only">Remove</span>
                          <span aria-hidden>×</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-3">
                      No line items added yet. Click "Add Line" to get started.
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
            <div className="mt-2 flex justify-end">
              <Card className={summaryCardClass}>
                <CardHeader className="pb-1 border-none bg-transparent">
                  <CardTitle className="text-sm font-medium mb-0">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 py-2">
                  <div className="flex justify-between text-sm">
                    <span>Items:</span>
                    <span>₹{itemTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST:</span>
                    <span>₹{totalGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1 text-base">
                    <span>Total:</span>
                    <span>₹{(itemTotal + totalGST).toFixed(2)}</span>
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
