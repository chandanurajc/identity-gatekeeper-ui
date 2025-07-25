import { subledgerService } from "./subledgerService";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import type { AccountingRule } from "@/types/accountingRules";

/**
 * Creates subledger entries for Invoice accounting rule lines with enableSubledger = true
 */
export async function createSubledgerEntriesForInvoice(
  invoice: Invoice,
  rule: AccountingRule,
  journalId: string,
  createdBy: string
) {
  const subledgerLines = rule.lines.filter((line: any) => line.enableSubledger);
  if (subledgerLines.length === 0) return;

  for (const line of subledgerLines) {
    let amount = 0;
    if (line.amountSource === "Total GST value") {
      amount = invoice.totalGstValue || 0;
    } else if (line.amountSource === "Total invoice value") {
      amount = invoice.totalInvoiceValue || 0;
    } else if (line.amountSource === "Total item value") {
      amount = invoice.totalItemValue || 0;
    }
    if (!amount || amount === 0) continue;

    try {
      await subledgerService.createSubledgerEntry({
        organizationId: invoice.organizationId,
        journalId,
        partyOrgId: invoice.remitToOrgId, // remit to org for invoice
        partyName: invoice.remitToName,
        partyCode: undefined, // Not available on Invoice, can be set if needed
        partyContactId: invoice.remitToContactId, // remit to contact for invoice
        transactionDate: new Date().toISOString().split("T")[0],
        debitAmount: line.debitAccountCode ? amount : null,
        creditAmount: line.creditAccountCode ? amount : null,
        sourceReference: invoice.invoiceNumber,
        transactionCategory: "Invoice",
        triggeringAction: "Invoice Approved",
        createdBy,
        updatedBy: createdBy,
      });
    } catch (error) {
      console.error(`Error creating subledger entry for invoice line ${line.lineNumber}:`, error);
    }
  }
}
