
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
  debitAccountCode?: string;
  creditAccountCode?: string;
  amountSource: string;
  enableSubledger: boolean;
}

export interface AccountingRule {
  id: string;
  organizationId: string;
  ruleName: string;
  divisionId?: string;
  divisionName?: string;
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
  divisionId?: string;
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

// Define PO-specific amount sources
export const PO_AMOUNT_SOURCES = [
  'Total GST value',
  'Total GST Value',
  'sum of line',
  'Total PO Value',
  'Item total price',
  'Total PO CGST',
  'Total PO SGST',
  'Total PO IGST'
] as const;

// Define general amount sources for other transaction types
export const GENERAL_AMOUNT_SOURCES = [
  'Total GST value',
  'Total GST Value',
  'sum of line',
  'Item total price'
] as const;
