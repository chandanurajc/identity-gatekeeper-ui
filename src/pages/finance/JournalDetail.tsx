import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useJournalPermissions } from "@/hooks/useJournalPermissions";
import { journalService } from "@/services/journalService";
import { chartOfAccountsService } from "@/services/chartOfAccountsService";

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewJournal } = useJournalPermissions();

  const { data: journal, isLoading } = useQuery({
    queryKey: ['journal', id],
    queryFn: () => id && organizationId ? journalService.getJournalById(id, organizationId) : null,
    enabled: !!id && !!organizationId && canViewJournal,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['chart-of-accounts', organizationId],
    queryFn: () => organizationId ? chartOfAccountsService.getChartOfAccounts(organizationId) : Promise.resolve([]),
    enabled: !!organizationId,
  });

  // Create a map for accountCode -> accountName
  const accountCodeToName = new Map(accounts.map(acc => [acc.accountCode, acc.accountName]));

  if (!canViewJournal) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view journals.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Journal Not Found</CardTitle>
            <CardDescription>The requested journal could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalDebit = journal.journalLines?.reduce((sum, line) => sum + (line.debitAmount || 0), 0) || 0;
  const totalCredit = journal.journalLines?.reduce((sum, line) => sum + (line.creditAmount || 0), 0) || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/finance/journals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Journals
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal Entry</h1>
            <p className="text-muted-foreground">
              {new Date(journal.journalDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        {journal.status === 'Draft' && (
          <Link to={`/finance/journals/${journal.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Journal
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Journal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <Badge 
                  variant={
                    journal.status === 'Posted' ? 'default' : 
                    journal.status === 'Reversed' ? 'destructive' : 'secondary'
                  }
                >
                  {journal.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Journal Date</label>
              <p className="mt-1">{new Date(journal.journalDate).toLocaleDateString()}</p>
            </div>
            {journal.transactionType && (
              <div>
                <label className="text-sm font-medium text-gray-500">Transaction Type</label>
                <p className="mt-1">{journal.transactionType}</p>
              </div>
            )}
            {journal.transactionReference && (
              <div>
                <label className="text-sm font-medium text-gray-500">Transaction Reference</label>
                <p className="mt-1">{journal.transactionReference}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Total Lines</label>
              <p className="mt-1 text-2xl font-bold">{journal.journalLines?.length || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Debit</label>
              <p className="mt-1 text-lg font-semibold">₹{totalDebit.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Credit</label>
              <p className="mt-1 text-lg font-semibold">₹{totalCredit.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Balance</label>
              <p className={`mt-1 text-lg font-semibold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(totalDebit - totalCredit).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Created By</label>
              <p className="mt-1">{journal.createdBy}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created On</label>
              <p className="mt-1">{new Date(journal.createdOn).toLocaleString()}</p>
            </div>
            {journal.updatedBy && (
              <div>
                <label className="text-sm font-medium text-gray-500">Updated By</label>
                <p className="mt-1">{journal.updatedBy}</p>
              </div>
            )}
            {journal.updatedOn && (
              <div>
                <label className="text-sm font-medium text-gray-500">Updated On</label>
                <p className="mt-1">{new Date(journal.updatedOn).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal Lines</CardTitle>
          <CardDescription>Detailed breakdown of debit and credit entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {journal.journalLines && journal.journalLines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line #</TableHead>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit Amount</TableHead>
                  <TableHead className="text-right">Credit Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journal.journalLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.lineNumber}</TableCell>
                    <TableCell>{line.accountCode}</TableCell>
                    <TableCell>{accountCodeToName.get(line.accountCode) || '-'}</TableCell>
                    <TableCell>{line.narration || '-'}</TableCell>
                    <TableCell className="text-right">
                      {line.debitAmount ? `₹${line.debitAmount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.creditAmount ? `₹${line.creditAmount.toLocaleString()}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">₹{totalDebit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{totalCredit.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No journal lines found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}