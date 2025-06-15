import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoiceService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";

const InvoiceDetail = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { organizationId } = useMultiTenant();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canApproveInvoice } = usePermissions();

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
              <CardDescription>
                From PO: {invoice.po_number}
              </CardDescription>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status: </span>
              <span className="font-semibold">{invoice.status}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Bill To</h3>
              <p>{invoice.bill_to_name}</p>
              <p>{invoice.bill_to_address1}</p>
              {invoice.bill_to_address2 && <p>{invoice.bill_to_address2}</p>}
              <p>{invoice.bill_to_city}, {invoice.bill_to_state} {invoice.bill_to_postal_code}</p>
              <p>{invoice.bill_to_country}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Remit To</h3>
              <p>{invoice.remit_to_name}</p>
              <p>{invoice.remit_to_address1}</p>
              {invoice.remit_to_address2 && <p>{invoice.remit_to_address2}</p>}
              <p>{invoice.remit_to_city}, {invoice.remit_to_state} {invoice.remit_to_postal_code}</p>
              <p>{invoice.remit_to_country}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Details</h3>
              <p><strong>Due Date:</strong> {format(new Date(invoice.due_date), 'PPP')}</p>
              <p><strong>Total Amount:</strong> {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(invoice.total_invoice_amount)}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.lines?.map((line) => (
                  <tr key={line.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{line.line_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{line.item_description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{line.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(line.unit_cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(line.line_total)}</td>
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
