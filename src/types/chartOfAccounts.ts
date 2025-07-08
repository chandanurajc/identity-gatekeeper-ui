export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  id: string;
  organizationId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  status: 'Active' | 'Inactive';
  createdOn: Date;
  updatedOn?: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface ChartOfAccountFormData {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  status: 'Active' | 'Inactive';
}