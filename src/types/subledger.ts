export type SubledgerStatus = 'Open' | 'Settled';

export interface Subledger {
  id: string;
  organizationId: string;
  journalId?: string;
  partyOrgId: string;
  partyName: string;
  partyCode?: string;
  partyContactId?: string;
  transactionDate: string;
  amount: number;
  sourceReference?: string;
  status: SubledgerStatus;
  createdOn: Date;
  updatedOn?: Date;
  createdBy: string;
  updatedBy?: string;
}