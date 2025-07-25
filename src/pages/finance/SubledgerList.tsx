import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useSubledgerPermissions } from "@/hooks/useSubledgerPermissions";
import { subledgerService } from "@/services/subledgerService";

export default function SubledgerList() {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewSubledger } = useSubledgerPermissions();

  const { data: subledgers = [], isLoading } = useQuery({
    queryKey: ['subledgers', organizationId],
    queryFn: () => organizationId ? subledgerService.getSubledgers(organizationId) : Promise.resolve([]),
    enabled: !!organizationId && canViewSubledger,
  });

  if (!canViewSubledger) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view subledgers.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Export to XLSX handler
  const handleExport = () => {
    if (!subledgers || subledgers.length === 0) return;
    // Prepare data for export
    const exportData = subledgers.map(entry => ({
      'Party Organization': entry.organizationName || '-',
      'Party Name': entry.contactName || '-',
      'Transaction Category': entry.transactionCategory || '-',
      'Source Reference': entry.sourceReference || '-',
      'Debit': entry.debitAmount || 0,
      'Credit': entry.creditAmount || 0,
      'Created On': entry.createdOn ? new Date(entry.createdOn).toLocaleDateString() : '-',
      'Created By': entry.createdBy || '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subledger");
    XLSX.writeFile(workbook, "subledger_export.xlsx");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subledger</h1>
          <p className="text-muted-foreground">View party-wise transaction records</p>
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 disabled:opacity-50"
          onClick={handleExport}
          disabled={isLoading || subledgers.length === 0}
        >
          Export to XLSX
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : subledgers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No subledger entries found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Party Organization</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Transaction Category</TableHead>
                  <TableHead>Source Reference</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subledgers.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.organizationName || '-'}
                    </TableCell>
                    <TableCell>{entry.contactName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {entry.transactionCategory || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.sourceReference || '-'}</TableCell>
                    <TableCell className="text-right">
                      {entry.debitAmount ? (
                        <span className="text-green-600">
                          ₹{entry.debitAmount.toLocaleString('en-IN')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.creditAmount ? (
                        <span className="text-red-600">
                          ₹{entry.creditAmount.toLocaleString('en-IN')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(entry.createdOn).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{entry.createdBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}