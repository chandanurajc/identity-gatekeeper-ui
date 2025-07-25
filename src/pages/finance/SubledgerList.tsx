import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useSubledgerPermissions } from "@/hooks/useSubledgerPermissions";
import { subledgerService } from "@/services/subledgerService";
import { SubledgerFilters, type SubledgerFilterState } from "@/components/finance/SubledgerFilters";

export default function SubledgerList() {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewSubledger } = useSubledgerPermissions();
  const [filters, setFilters] = useState<SubledgerFilterState>({
    search: "",
    transactionCategory: "",
    dateFrom: null,
    dateTo: null,
    amountFrom: "",
    amountTo: "",
    transactionType: "all",
    partyOrganization: "",
  });

  const { data: allSubledgers = [], isLoading } = useQuery({
    queryKey: ['subledgers', organizationId],
    queryFn: () => organizationId ? subledgerService.getSubledgers(organizationId) : Promise.resolve([]),
    enabled: !!organizationId && canViewSubledger,
  });

  // Filter subledgers based on the current filter state
  const filteredSubledgers = useMemo(() => {
    return allSubledgers.filter(entry => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchMatch = 
          (entry.sourceReference?.toLowerCase().includes(searchLower)) ||
          (entry.organizationName?.toLowerCase().includes(searchLower)) ||
          (entry.contactName?.toLowerCase().includes(searchLower)) ||
          (entry.transactionCategory?.toLowerCase().includes(searchLower));
        if (!searchMatch) return false;
      }

      // Transaction category filter
      if (filters.transactionCategory && entry.transactionCategory !== filters.transactionCategory) {
        return false;
      }

      // Party organization filter
      if (filters.partyOrganization) {
        const orgMatch = entry.organizationName?.toLowerCase().includes(filters.partyOrganization.toLowerCase());
        if (!orgMatch) return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const entryDate = new Date(entry.createdOn);
        if (entryDate < filters.dateFrom) return false;
      }

      if (filters.dateTo) {
        const entryDate = new Date(entry.createdOn);
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999); // End of day
        if (entryDate > dateTo) return false;
      }

      // Amount filters
      if (filters.amountFrom) {
        const minAmount = parseFloat(filters.amountFrom);
        const entryAmount = (entry.debitAmount || 0) + (entry.creditAmount || 0);
        if (entryAmount < minAmount) return false;
      }

      if (filters.amountTo) {
        const maxAmount = parseFloat(filters.amountTo);
        const entryAmount = (entry.debitAmount || 0) + (entry.creditAmount || 0);
        if (entryAmount > maxAmount) return false;
      }

      // Transaction type filter
      if (filters.transactionType === "debit" && !entry.debitAmount) return false;
      if (filters.transactionType === "credit" && !entry.creditAmount) return false;

      return true;
    });
  }, [allSubledgers, filters]);

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
    if (!filteredSubledgers || filteredSubledgers.length === 0) return;
    // Prepare data for export
    const exportData = filteredSubledgers.map(entry => ({
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
          <p className="text-muted-foreground">View party-wise transaction records ({filteredSubledgers.length} of {allSubledgers.length})</p>
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 disabled:opacity-50"
          onClick={handleExport}
          disabled={isLoading || filteredSubledgers.length === 0}
        >
          Export to XLSX
        </button>
      </div>

      <SubledgerFilters onFiltersChange={setFilters} isLoading={isLoading} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : filteredSubledgers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {allSubledgers.length === 0 ? "No subledger entries found." : "No entries match the current filters."}
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
                {filteredSubledgers.map((entry) => (
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