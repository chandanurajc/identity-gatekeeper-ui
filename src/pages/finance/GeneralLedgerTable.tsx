
import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./GeneralLedgerColumns";
import { GeneralLedgerEntry } from "@/types/generalLedger";

interface GeneralLedgerTableProps {
  processedData: GeneralLedgerEntry[];
  isLoadingLedger: boolean;
  loadTrigger: number;
}

export function GeneralLedgerTable({ processedData, isLoadingLedger, loadTrigger }: GeneralLedgerTableProps) {
  if (loadTrigger === 0) return null;
  if (isLoadingLedger) {
    return (
      <div className="flex justify-center items-center h-24">
        <p>Loading ledger...</p>
      </div>
    );
  }
  return (
    <DataTable
      columns={columns}
      data={processedData}
    />
  );
}
