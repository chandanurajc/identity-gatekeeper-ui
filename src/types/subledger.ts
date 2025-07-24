export interface Subledger {
  id: string;
  organizationId: string;
  journalId?: string;
  partyOrgId: string;
  partyName: string;
  partyCode?: string;
  partyContactId?: string;
  organizationContactId?: string;
  transactionDate: string;
  debitAmount?: number;
  creditAmount?: number;
  sourceReference?: string;
  transactionCategory?: string;
  triggeringAction?: string;
  createdOn: Date;
  updatedOn?: Date;
  createdBy: string;
  updatedBy?: string;
  // UI fields
  organizationName?: string;
  contactName?: string;
}