// File removed
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
import { OutstandingPayables } from "./OutstandingPayables";
import { LedgerFilterControls } from "./LedgerFilterControls";
import { GeneralLedgerTable } from "./GeneralLedgerTable";

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

  // Running balance and debit/credit assignment logic, but display with newest first
  const processedData = useMemo(() => {
    if (!ledgerEntries) return [];
    let runningBalance = 0;

    // Always sort by transaction_date ASC, created_on ASC for balance
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
      if (entry.transaction_type === "Payable Invoice" || entry.transaction_type === "Debit Note") {
        credit = amount;
        runningBalance += amount;
      } else if (entry.transaction_type === "Payment" || entry.transaction_type === "Credit Note") {
        debit = amount;
        runningBalance -= amount;
      }
      return {
        ...entry,
        debit,
        credit,
        balance: runningBalance,
      };
    });
    // Reverse for display: newest created_on at top.
    return processed.slice().reverse();
  }, [ledgerEntries]);

  // Outstanding balance: sum all credits minus debits (can be negative if overpaid)
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
          <LedgerFilterControls
            billToOrgName={billToOrg?.name}
            partners={partners}
            selectedRemitTo={selectedRemitTo}
            setSelectedRemitTo={setSelectedRemitTo}
            onLoadLedger={() => setLoadTrigger(t => t + 1)}
            isLoadingLedger={isLoadingLedger}
            canRecordPayment={canRecordPayment}
            onOpenPaymentDialog={() => setIsPaymentDialogOpen(true)}
            disableRecordPayment={!selectedRemitTo || !billToOrg || !remitToOrg}
          />

          {loadTrigger > 0 && remitToOrg && outstandingBalance > 0 && (
            <OutstandingPayables remitToName={remitToOrg.name} outstandingBalance={outstandingBalance} />
          )}

          <GeneralLedgerTable
            processedData={processedData}
            isLoadingLedger={isLoadingLedger}
            loadTrigger={loadTrigger}
          />
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
              refetchLedger();
            }
            setIsPaymentDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default GeneralLedgerViewer;
