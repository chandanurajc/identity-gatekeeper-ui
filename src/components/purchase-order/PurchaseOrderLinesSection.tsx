
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { PurchaseOrderLine } from "@/types/purchaseOrder";
import { Item } from "@/types/item";

const sectionTitleClass = "text-base font-semibold text-muted-foreground tracking-tight mb-1";
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
    const totalWeight = watchedLines.reduce((sum, line) => sum + (line.totalLineWeight || 0), 0);
    return { itemTotal, totalGST, totalWeight };
  };

  const calculateLineWeight = (index: number, quantity?: number) => {
    const line = watchedLines[index];
    const selectedItem = items.find(item => item.id === line?.itemId);
    const qty = quantity !== undefined ? quantity : (line?.quantity || 0);
    
    if (selectedItem?.weight && qty > 0) {
      const totalLineWeight = selectedItem.weight * qty;
      setValue(`lines.${index}.itemWeightPerUnit`, selectedItem.weight);
      setValue(`lines.${index}.itemWeightUom`, selectedItem.weightUom || 'kg');
      setValue(`lines.${index}.totalLineWeight`, totalLineWeight);
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseFloat(value) || 0;
    setValue(`lines.${index}.quantity`, quantity);
    calculateLineTotal(index);
    calculateLineWeight(index, quantity);
  };

  const handleItemSelection = (index: number, itemId: string) => {
    handleItemChange(index, itemId);
    // Calculate weight after item selection
    setTimeout(() => calculateLineWeight(index), 100);
  };

  return (
    <section className="bg-transparent pt-2">
      <div className="flex justify-between items-center mb-1">
        <h2 className={sectionTitleClass + " mb-0"}>PO Lines</h2>
        <Button type="button" onClick={addPOLine} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Line
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full rounded border border-muted/30">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="py-1 px-2 w-[36px]">#</TableHead>
                <TableHead className="py-1 px-2 min-w-[200px]">Item *</TableHead>
                <TableHead className="py-1 px-2 min-w-[200px]">Desc.</TableHead>
                <TableHead className="py-1 px-2 min-w-[80px] text-center">Qty *</TableHead>
                <TableHead className="py-1 px-2 min-w-[80px]">UOM *</TableHead>
                <TableHead className="py-1 px-2 min-w-[100px] text-right">Cost *</TableHead>
                <TableHead className="py-1 px-2 min-w-[100px] text-right">Total</TableHead>
                <TableHead className="py-1 px-2 min-w-[80px] text-center">GST %</TableHead>
                <TableHead className="py-1 px-2 min-w-[100px] text-right">GST Val</TableHead>
                <TableHead className="py-1 px-2 min-w-[100px] text-right">Weight/Unit</TableHead>
                <TableHead className="py-1 px-2 min-w-[100px] text-right">Total Weight</TableHead>
                <TableHead className="py-1 px-2 min-w-[120px] text-right">Line Total</TableHead>
                <TableHead className="py-1 px-2 w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const selectedItem = items.find(item => item.id === watchedLines[index]?.itemId);
                return (
                  <TableRow key={field.id}>
                    <TableCell className="p-1 text-center">{index + 1}</TableCell>
                    <TableCell className="p-1">
                      <div className="space-y-1">
                        <Input
                          placeholder="Search by ID"
                          onChange={(e) => searchItems(e.target.value)}
                          className="mb-1 h-8"
                        />
                        <Select 
                          onValueChange={(value) => handleItemSelection(index, value)} 
                          value={watchedLines[index]?.itemId || ""}
                        >
                          <SelectTrigger className="h-8">
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
                    <TableCell className="p-1">
                      <Input
                        value={selectedItem?.description || ""}
                        readOnly
                        className="bg-muted/40 h-8"
                        placeholder="Item description"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.quantity ?? ""}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="h-8 text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={watchedLines[index]?.uom || ""}
                        readOnly
                        className="bg-muted/40 h-8"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.unitPrice ?? ""}
                        onChange={(e) => {
                          setValue(`lines.${index}.unitPrice`, parseFloat(e.target.value) || 0);
                          calculateLineTotal(index);
                        }}
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.totalUnitPrice?.toFixed(2) || "0.00"}
                        readOnly
                        className="bg-muted/40 h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.gstPercent ?? ""}
                        onChange={(e) => {
                          setValue(`lines.${index}.gstPercent`, parseFloat(e.target.value) || 0);
                          calculateLineTotal(index);
                        }}
                        className="h-8 text-center"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.gstValue?.toFixed(2) || "0.00"}
                        readOnly
                        className="bg-muted/40 h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={selectedItem?.weight ? `${selectedItem.weight} ${selectedItem.weightUom || 'kg'}` : ""}
                        readOnly
                        className="bg-muted/40 h-8 text-right text-xs"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={watchedLines[index]?.totalLineWeight ? `${watchedLines[index].totalLineWeight.toFixed(2)} ${watchedLines[index]?.itemWeightUom || 'kg'}` : ""}
                        readOnly
                        className="bg-muted/40 h-8 text-right text-xs"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={watchedLines[index]?.lineTotal?.toFixed(2) || "0.00"}
                        readOnly
                        className="bg-muted/40 h-8 text-right font-semibold"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => remove(index)}
                        aria-label="Remove line"
                      >
                        <span className="sr-only">Remove</span>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground py-3">
                    No line items added yet. Click "Add Line" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {fields.length > 0 && (() => {
        const { itemTotal, totalGST, totalWeight } = calculateSummary();
        return (
          <div className="mt-2 flex justify-end">
            <div className={summaryCardClass}>
              <div className="px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span>₹{itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST:</span>
                  <span>₹{totalGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Weight:</span>
                  <span>{totalWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1 text-base">
                  <span>Total:</span>
                  <span>₹{(itemTotal + totalGST).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

export default PurchaseOrderLinesSection;
