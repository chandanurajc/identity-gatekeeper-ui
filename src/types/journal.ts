export type JournalStatus = 'Draft' | 'Posted' | 'Reversed';
export type RuleTransactionType = 'Invoice' | 'PO' | 'Payment';

export interface JournalHeader {
  id: string;
  organizationId: string;
  journalDate: string;
  transactionType?: RuleTransactionType;
  transactionReference?: string;
  status: JournalStatus;
  createdOn: Date;
  updatedOn?: Date;
  createdBy: string;
  updatedBy?: string;
  journalLines?: JournalLine[];
}

export interface JournalLine {
  id: string;
  journalId: string;
  lineNumber: number;
  accountCode: string;
  debitAmount?: number;
  creditAmount?: number;
  narration?: string;
  slReferenceId?: string;
  createdOn: Date;
}

export interface JournalFormData {
  journalDate: string;
  transactionType?: RuleTransactionType;
  transactionReference?: string;
  journalLines: JournalLineFormData[];
}

export interface JournalLineFormData {
  lineNumber: number;
  accountCode: string;
  debitAmount?: number;
  creditAmount?: number;
  narration?: string;
}