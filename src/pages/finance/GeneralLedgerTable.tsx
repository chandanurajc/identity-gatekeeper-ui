import { GeneralLedgerEntry } from "@/types/generalLedger";

interface GeneralLedgerTableProps {
  entries: GeneralLedgerEntry[];
}

export function GeneralLedgerTable({ entries }: GeneralLedgerTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reference
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {entry.transactionDate.toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {entry.transactionType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {entry.amount.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {entry.referenceNumber}
              </td>
              <td className="px-6 py-4 text-sm">
                {entry.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}