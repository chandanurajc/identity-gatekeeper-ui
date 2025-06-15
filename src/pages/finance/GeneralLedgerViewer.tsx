import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { partnerService } from "@/services/partnerService";
import { organizationService } from "@/services/organizationService";
import { generalLedgerService } from "@/services/generalLedgerService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./GeneralLedgerColumns";
import { GeneralLedgerEntry } from "@/types/generalLedger";
import { useToast } from "@/components/ui/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { RecordPaymentDialog } from "./RecordPaymentDialog";

const GeneralLedgerViewer = () => {
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { toast } = useToast();
  const { canRecordPayment } = usePermissions();

  const [selectedRemitTo, setSelectedRemitTo] = useState<string | null>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { data: billToOrg } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: () => organizationService.getOrganizationById(organizationId!),
    enabled: !!organizationId,
  });

  const { data: partners } = useQuery({
    queryKey: ['activePartners', organizationId],
    queryFn: () => partnerService.getActivePartners(organizationId!),
    enabled: !!organizationId,
  });
  
  const { data: remitToOrg } = useQuery({
    queryKey: ['organization', selectedRemitTo],
    queryFn: () => organizationService.getOrganizationById(selectedRemitTo!),
    enabled: !!selectedRemitTo,
  });

  const { data: ledgerEntries, isLoading: isLoadingLedger, error: ledgerError, refetch: refetchLedger } = useQuery({
    queryKey: ['generalLedger', organizationId, selectedRemitTo, loadTrigger],
    queryFn: async () => {
        if (!organizationId || !selectedRemitTo || loadTrigger === 0) return [];
        return generalLedgerService.getLedgerEntries(organizationId, selectedRemitTo);
    },
    enabled: !!organizationId && !!selectedRemitTo && loadTrigger > 0,
  });

  useEffect(() => {
    if (ledgerError) {
        toast({
            variant: "destructive",
            title: "Error fetching ledger",
            description: ledgerError.message,
        });
    }
  }, [ledgerError, toast]);

  // Diagnostic logging for ledger entries
  useEffect(() => {
    if (ledgerEntries) {
      console.log("[GeneralLedger] Loaded ledgerEntries:", ledgerEntries);
    }
  }, [ledgerEntries]);

  // Running balance and debit/credit assignment logic
  const processedData = useMemo(() => {
    if (!ledgerEntries) return [];
    let runningBalance = 0;

    const sortedEntries = [...ledgerEntries].sort((a, b) => {
      const aDate = new Date(a.transaction_date).getTime();
      const bDate = new Date(b.transaction_date).getTime();
      if (aDate !== bDate) return aDate - bDate;
      return new Date(a.created_on).getTime() - new Date(b.created_on).getTime();
    });

    const processed = sortedEntries.map((entry) => {
      let debit = 0;
      let credit = 0;
      let amount = Number(entry.amount);
      if (isNaN(amount)) {
        console.warn(`[GeneralLedger] BAD ENTRY: amount is not a number for entry`, entry);
        amount = 0;
      }
      // Correct accounting logic
      if (entry.transaction_type === "Payable Invoice" || entry.transaction_type === "Debit Note") {
        credit = amount;
        runningBalance += amount;
      } else if (entry.transaction_type === "Payment" || entry.transaction_type === "Credit Note") {
        debit = amount;
        runningBalance -= amount;
      }
      // Diagnostic for each row
      console.log(`[GeneralLedger] After ${entry.transaction_type} (${amount}): Balance = ${runningBalance}`);
      return {
        ...entry,
        debit,
        credit,
        balance: runningBalance,  // Always show actual running balance (can be negative)
      };
    });
    console.log("[GeneralLedger] Processed data for table:", processed);
    return processed;
  }, [ledgerEntries]);

  // Outstanding balance remains the same: sum all credits minus debits, can be negative if overpaid
  const outstandingBalance = useMemo(() => {
    if (!ledgerEntries || ledgerEntries.length === 0) return 0;
    const totalCredit = ledgerEntries
      .filter(e => e.transaction_type === "Payable Invoice" || e.transaction_type === "Debit Note")
      .reduce((acc, entry) => acc + Number(entry.amount), 0);
    const totalDebit = ledgerEntries
      .filter(e => e.transaction_type === "Payment" || e.transaction_type === "Credit Note")
      .reduce((acc, entry) => acc + Number(entry.amount), 0);
    return totalCredit - totalDebit;
  }, [ledgerEntries]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>General Ledger Viewer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4 p-4 border rounded-lg bg-slate-50">
            <div className="flex-1">
              <label className="text-sm font-medium">Bill To Organization</label>
              <input value={billToOrg?.name || ''} readOnly className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1 bg-white"/>
            </div>
            <div className="flex-1">
              <label htmlFor="remitTo" className="text-sm font-medium">Remit To Organization</label>
              <Select onValueChange={setSelectedRemitTo} value={selectedRemitTo || undefined}>
                <SelectTrigger id="remitTo" className="mt-1">
                  <SelectValue placeholder="Select a partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners?.map(p => (
                    <SelectItem key={p.id} value={p.organizationId}>{p.organizationName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setLoadTrigger(t => t + 1)} disabled={!selectedRemitTo || isLoadingLedger}>
              {isLoadingLedger ? 'Loading...' : 'Load Ledger'}
            </Button>
            {canRecordPayment && (
              <Button
                onClick={() => setIsPaymentDialogOpen(true)}
                disabled={!selectedRemitTo || !billToOrg || !remitToOrg}
                variant="secondary"
              >
                Record Payment
              </Button>
            )}
          </div>
          
          {loadTrigger > 0 && remitToOrg && outstandingBalance > 0 && (
            <div className="p-3 text-base font-semibold border rounded-lg bg-slate-100 text-center">
              Outstanding Payables to {remitToOrg.name}: ₹{outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}

          {loadTrigger > 0 && (
            isLoadingLedger ? (
              <div className="flex justify-center items-center h-24">
                <p>Loading ledger...</p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={processedData}
              />
            )
          )}
        </CardContent>
      </Card>
      {billToOrg && remitToOrg && (
        <RecordPaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          billToOrg={billToOrg}
          remitToOrg={remitToOrg}
          outstandingBalance={outstandingBalance}
          onPaymentSuccess={() => {
            setLoadTrigger(t => t + 1);
            if (refetchLedger) {
              refetchLedger(); // Force refetch in case query client is slow
            }
            setIsPaymentDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default GeneralLedgerViewer;
