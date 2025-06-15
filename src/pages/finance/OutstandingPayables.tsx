
import React from "react";

interface OutstandingPayablesProps {
  remitToName: string;
  outstandingBalance: number;
}

export function OutstandingPayables({ remitToName, outstandingBalance }: OutstandingPayablesProps) {
  if (outstandingBalance <= 0) return null;
  return (
    <div className="p-3 text-base font-semibold border rounded-lg bg-slate-100 text-center">
      Outstanding Payables to {remitToName}: ₹
      {outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </div>
  );
}
