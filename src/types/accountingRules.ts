export type RuleTransactionCategory = 'Invoice' | 'PO' | 'Payment';
export type RuleAction = 'Invoice Approved' | 'PO Created' | 'Payment Processed' | 'Purchase order receive';
export type PartyType = 'Bill To' | 'Remit To';
export type FilterLogicType = 'AND' | 'OR';

export interface FilterCriteria {
  field: string;
  operator: string;
  value: string;
}

export interface AccountingRuleLine {
  id?: string;
  lineNumber: number;
  debitAccountCode: string;
  creditAccountCode: string;
  amountSource: string;
  enableSubledger: boolean;
}

export interface AccountingRule {
  id: string;
  organizationId: string;
  ruleName: string;
  transactionCategory: RuleTransactionCategory;
  transactionReference: string;
  transactionType?: string;
  triggeringAction: RuleAction;
  lines: AccountingRuleLine[];
  partyType?: PartyType;
  partyName?: string;
  partyCode?: string;
  filterLogicType?: FilterLogicType;
  filterCriteria?: FilterCriteria[];
  status: 'Active' | 'Inactive';
  createdOn: Date;
  updatedOn?: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface AccountingRuleFormData {
  ruleName: string;
  transactionCategory: RuleTransactionCategory;
  transactionReference: string;
  transactionType?: string;
  triggeringAction: RuleAction;
  lines: AccountingRuleLine[];
  partyType?: PartyType;
  partyName?: string;
  partyCode?: string;
  filterLogicType?: FilterLogicType;
  filterCriteria?: FilterCriteria[];
  status: 'Active' | 'Inactive';
}