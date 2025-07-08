export type JournalStatus = 'Draft' | 'Posted' | 'Reversed';
export type RuleSourceType = 'Invoice' | 'PO' | 'Payment';

export interface JournalHeader {
  id: string;
  organizationId: string;
  journalDate: string;
  sourceType?: RuleSourceType;
  sourceReference?: string;
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
  sourceType?: RuleSourceType;
  sourceReference?: string;
  journalLines: JournalLineFormData[];
}

export interface JournalLineFormData {
  lineNumber: number;
  accountCode: string;
  debitAmount?: number;
  creditAmount?: number;
  narration?: string;
}