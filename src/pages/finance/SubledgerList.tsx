import { useQuery } from "@tanstack/react-query";
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subledger</h1>
        <p className="text-muted-foreground">View party-wise transaction records</p>
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
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Party Code</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Source Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subledgers.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {new Date(entry.transactionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{entry.partyName}</TableCell>
                    <TableCell>{entry.partyCode}</TableCell>
                    <TableCell className={entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(entry.amount).toLocaleString('en-IN')}
                      {entry.amount >= 0 ? ' Dr' : ' Cr'}
                    </TableCell>
                    <TableCell>{entry.sourceReference || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'Open' ? 'default' : 'secondary'}>
                        {entry.status}
                      </Badge>
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