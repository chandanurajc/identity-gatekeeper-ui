import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoiceService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useInvoicePermissions } from "@/hooks/useInvoicePermissions";
import { Separator } from "@/components/ui/separator";

const InvoiceDetail = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canApproveInvoice } = useInvoicePermissions();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", invoiceId, organizationId],
    queryFn: () => invoiceService.getInvoiceById(invoiceId!, organizationId!),
    enabled: !!invoiceId && !!organizationId,
  });

  const approveMutation = useMutation({
    mutationFn: () => invoiceService.approveInvoice(invoiceId!, organizationId!, user!.id, user!.email!),
    onSuccess: () => {
      toast({ title: "Success", description: "Invoice approved successfully." });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error approving invoice",
        description: error.message,
      });
    },
  });

  if (isLoading) return <div>Loading invoice details...</div>;
  if (error) return <div>Error fetching invoice: {error.message}</div>;
  if (!invoice) return <div>Invoice not found.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
              <CardDescription>
                From PO: {invoice.po_number}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{invoice.status}</div>
              <div className="text-sm text-muted-foreground">
                Created: {format(new Date(invoice.created_on), 'PPP')}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-muted-foreground uppercase">Bill To</h3>
                  <div className="space-y-1">
                    <p className="font-semibold">{invoice.bill_to_name}</p>
                    <p>{invoice.bill_to_address1}</p>
                    {invoice.bill_to_address2 && <p>{invoice.bill_to_address2}</p>}
                    <p>{invoice.bill_to_city}, {invoice.bill_to_state} {invoice.bill_to_postal_code}</p>
                    <p>{invoice.bill_to_country}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-muted-foreground uppercase">Remit To</h3>
                  <div className="space-y-1">
                    <p className="font-semibold">{invoice.remit_to_name}</p>
                    <p>{invoice.remit_to_address1}</p>
                    {invoice.remit_to_address2 && <p>{invoice.remit_to_address2}</p>}
                    <p>{invoice.remit_to_city}, {invoice.remit_to_state} {invoice.remit_to_postal_code}</p>
                    <p>{invoice.remit_to_country}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-1">
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-semibold">{format(new Date(invoice.due_date), 'PPP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Terms</span>
                    <span className="font-semibold">{invoice.payment_terms || 'N/A'}</span>
                  </div>
                  <Separator/>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(invoice.total_item_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total GST</span>
                    <span className="font-semibold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(invoice.total_gst)}</span>
                  </div>
                  <Separator/>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold">Total Amount</span>
                    <span className="text-xl font-bold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(invoice.total_invoice_amount)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/invoices')}>Back to List</Button>
            {invoice.status === 'Created' && canApproveInvoice && (
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? 'Approving...' : 'Approve Invoice'}
              </Button>
            )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Invoice Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Item Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GST Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.lines?.map((line) => (
                  <tr key={line.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{line.line_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{line.item_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{line.item_description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{line.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{line.uom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(line.unit_cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(line.total_item_cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{line.gst_percent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(line.gst_value)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(line.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;
