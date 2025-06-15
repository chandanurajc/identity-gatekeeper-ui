
export interface GeneralLedgerEntry {
  id: string;
  bill_to_orgid: string;
  remit_to_orgid: string;
  transaction_type: 'Payable Invoice' | 'Payment' | 'Credit Note' | 'Debit Note';
  transaction_date: string;
  reference_number: string;
  amount: number;
  created_by?: string;
  created_on: Date;
  
  // Optional for display
  balance?: number;
  debit?: number;
  credit?: number;
}
