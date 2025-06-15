
import { useFieldArray, useFormContext } from "react-hook-form";
import { POReceiveFormData } from "@/types/purchaseOrder";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function POReceiveLinesSection() {
  const { control, formState: { errors } } = useFormContext<POReceiveFormData>();
  const { fields } = useFieldArray({
    control,
    name: "lines",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Line</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Ordered</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>To Receive</TableHead>
              <TableHead>UOM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
                const remainingQty = field.orderedQuantity - field.totalReceivedQuantity;
                return (
                    <TableRow key={field.id}>
                        <TableCell>{field.lineNumber}</TableCell>
                        <TableCell>
                            <div>{field.itemId}</div>
                            <div className="text-xs text-muted-foreground">{field.itemDescription}</div>
                        </TableCell>
                        <TableCell>{field.orderedQuantity}</TableCell>
                        <TableCell>{field.totalReceivedQuantity}</TableCell>
                        <TableCell>
                            <FormField
                                control={control}
                                name={`lines.${index}.quantityToReceive`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...formField}
                                                className="max-w-[120px]"
                                                max={remainingQty}
                                                min={0}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TableCell>
                        <TableCell>{field.uom}</TableCell>
                    </TableRow>
                );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
