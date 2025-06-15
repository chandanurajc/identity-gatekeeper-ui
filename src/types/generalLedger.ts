
import { GeneralLedgerEntry } from '@/types/generalLedger';

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
  payment_method?: string;
  notes?: string;
  
  // Optional for display
  balance?: number;
  debit?: number;
  credit?: number;
}

export interface RecordPaymentFormData {
  paymentDate: Date;
  paymentMethod: 'UPI' | 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber?: string;
  amount: number;
  notes?: string;
}
