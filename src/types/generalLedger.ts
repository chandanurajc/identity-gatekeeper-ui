export interface GeneralLedgerEntry {
  id: string;
  billToOrgId: string;
  remitToOrgId: string;
  transactionType: string;
  transactionDate: Date;
  amount: number;
  referenceNumber: string;
  notes?: string;
  paymentMethod?: string;
  createdOn: Date;
  createdBy: string;
}

export interface RecordPaymentFormData {
  paymentDate: Date;
  paymentMethod: "Bank Transfer" | "UPI" | "Cheque" | "Cash";
  amount: number;
  referenceNumber?: string;
  notes?: string;
}