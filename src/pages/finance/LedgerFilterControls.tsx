
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LedgerFilterControlsProps {
  billToOrgName: string | undefined;
  partners: { id: string; organizationId: string; organizationName: string }[] | undefined;
  selectedRemitTo: string | null;
  setSelectedRemitTo: (v: string) => void;
  onLoadLedger: () => void;
  isLoadingLedger: boolean;
  canRecordPayment: boolean;
  onOpenPaymentDialog: () => void;
  disableRecordPayment: boolean;
}

export function LedgerFilterControls({
  billToOrgName,
  partners,
  selectedRemitTo,
  setSelectedRemitTo,
  onLoadLedger,
  isLoadingLedger,
  canRecordPayment,
  onOpenPaymentDialog,
  disableRecordPayment,
}: LedgerFilterControlsProps) {
  return (
    <div className="flex items-end gap-4 p-4 border rounded-lg bg-slate-50">
      <div className="flex-1">
        <label className="text-sm font-medium">Bill To Organization</label>
        <input
          value={billToOrgName || ''}
          readOnly
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1 bg-white"
        />
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
      <Button onClick={onLoadLedger} disabled={!selectedRemitTo || isLoadingLedger}>
        {isLoadingLedger ? 'Loading...' : 'Load Ledger'}
      </Button>
      {canRecordPayment && (
        <Button
          onClick={onOpenPaymentDialog}
          disabled={disableRecordPayment}
          variant="secondary"
        >
          Record Payment
        </Button>
      )}
    </div>
  );
}
