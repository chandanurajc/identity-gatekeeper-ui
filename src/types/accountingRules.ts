export type RuleSourceType = 'Invoice' | 'PO' | 'Payment';
export type RuleAction = 'Invoice Approved' | 'PO Created' | 'Payment Processed';
export type PartyType = 'Bill To' | 'Remit To';
export type FilterLogicType = 'AND' | 'OR';

export interface FilterCriteria {
  field: string;
  operator: string;
  value: string;
}

export interface AccountingRule {
  id: string;
  organizationId: string;
  ruleName: string;
  sourceType: RuleSourceType;
  sourceReference: string;
  triggeringAction: RuleAction;
  debitAccountCode: string;
  creditAccountCode: string;
  amountSource: string;
  enableSubledger: boolean;
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
  sourceType: RuleSourceType;
  sourceReference: string;
  triggeringAction: RuleAction;
  debitAccountCode: string;
  creditAccountCode: string;
  amountSource: string;
  enableSubledger: boolean;
  partyType?: PartyType;
  partyName?: string;
  partyCode?: string;
  filterLogicType?: FilterLogicType;
  filterCriteria?: FilterCriteria[];
  status: 'Active' | 'Inactive';
}