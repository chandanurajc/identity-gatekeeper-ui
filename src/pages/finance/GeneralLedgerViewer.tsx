
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

const GeneralLedgerViewer = () => {
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { toast } = useToast();

  const [selectedRemitTo, setSelectedRemitTo] = useState<string | null>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);

  const { data: billToOrg } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: () => organizationService.getOrganizationById(organizationId!),
    enabled: !!organizationId,
  });

  const { data: partners } = useQuery({
    queryKey: ['partners', organizationId],
    queryFn: () => partnerService.getPartners(organizationId!),
    enabled: !!organizationId,
  });

  const suppliers = useMemo(() => {
    if (!partners) return [];
    return partners.filter(p => p.organizationType === 'Supplier' && p.status === 'active');
  }, [partners]);

  const { data: ledgerEntries, isLoading: isLoadingLedger, error: ledgerError } = useQuery({
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

  const processedData = useMemo(() => {
    if (!ledgerEntries) return [];
    let runningBalance = 0;
    return ledgerEntries.map((entry: GeneralLedgerEntry) => {
      runningBalance -= entry.amount;
      return {
        ...entry,
        debit: entry.amount < 0 ? -entry.amount : 0,
        credit: entry.amount > 0 ? entry.amount : 0,
        balance: runningBalance,
      };
    });
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
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.organizationName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setLoadTrigger(t => t + 1)} disabled={!selectedRemitTo || isLoadingLedger}>
              {isLoadingLedger ? 'Loading...' : 'Load Ledger'}
            </Button>
          </div>
          
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
    </div>
  );
};

export default GeneralLedgerViewer;
