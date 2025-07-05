
export type InvoiceStatus = 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected';
export type InvoiceType = 'Payable' | 'Receivable';
export type TransactionType = 'Purchase Order' | 'Sales Order';
export type PaymentTerms = 'Net 15' | 'Net 30' | 'Net 60' | 'Net 90' | 'Due on Receipt';

export interface Invoice {
  id: string;
  organizationId: string;
  divisionId: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  
  // Bill To details
  billToOrgId: string;
  billToName?: string;
  billToAddress1?: string;
  billToAddress2?: string;
  billToPostalCode?: string;
  billToCity?: string;
  billToState?: string;
  billToStateCode?: number;
  billToCountry?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToGstin?: string;
  billToCin?: string;
  
  // Remit To details
  remitToOrgId: string;
  remitToName?: string;
  remitToAddress1?: string;
  remitToAddress2?: string;
  remitToPostalCode?: string;
  remitToCity?: string;
  remitToState?: string;
  remitToStateCode?: number;
  remitToCountry?: string;
  remitToEmail?: string;
  remitToPhone?: string;
  remitToGstin?: string;
  remitToCin?: string;
  
  // Ship To details
  sameAsDivisionAddress: boolean;
  shipToName?: string;
  shipToAddress1?: string;
  shipToAddress2?: string;
  shipToPostalCode?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToStateCode?: number;
  shipToCountry?: string;
  shipToPhone?: string;
  
  // Reference transaction
  referenceTransactionType?: TransactionType;
  referenceTransactionNumber?: string;
  referenceTransactionDate?: string;
  
  // Payment terms
  paymentTerms: PaymentTerms;
  dueDate?: string;
  
  // Notes
  notes?: string;
  
  // Totals
  totalItemValue: number;
  totalGstValue: number;
  totalInvoiceValue: number;
  
  // Audit fields
  createdOn: Date;
  updatedOn?: Date;
  createdBy: string;
  updatedBy?: string;
  approvalRequestedOn?: Date;
  approvalRequestedBy?: string;
  
  // Related data
  invoiceLines?: InvoiceLine[];
  gstBreakdown?: InvoiceGstBreakdown[];
  auditLog?: InvoiceAuditLog[];
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  lineNumber: number;
  itemId: string;
  itemDescription: string;
  quantity: number;
  uom: string;
  weightPerUnit?: number;
  weightUom?: string;
  totalWeight?: number;
  unitPrice: number;
  totalPrice: number;
  gstPercentage: number;
  gstValue: number;
  lineTotal: number;
  createdOn: Date;
  updatedOn?: Date;
}

export interface InvoiceGstBreakdown {
  id: string;
  invoiceId: string;
  gstPercentage: number;
  taxableAmount: number;
  cgstPercentage: number;
  cgstAmount: number;
  sgstPercentage: number;
  sgstAmount: number;
  igstPercentage: number;
  igstAmount: number;
  totalGstAmount: number;
}

export interface InvoiceAuditLog {
  id: string;
  invoiceId: string;
  oldStatus?: InvoiceStatus;
  newStatus: InvoiceStatus;
  changedBy: string;
  changedOn: Date;
  comments?: string;
}

export interface InvoiceFormData {
  divisionId: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  billToOrgId: string;
  billToContactId?: string;
  billToName?: string;
  billToAddress1?: string;
  billToAddress2?: string;
  billToPostalCode?: string;
  billToCity?: string;
  billToState?: string;
  billToStateCode?: number;
  billToCountry?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToGstin?: string;
  billToCin?: string;
  remitToOrgId: string;
  remitToContactId?: string;
  remitToName?: string;
  remitToAddress1?: string;
  remitToAddress2?: string;
  remitToPostalCode?: string;
  remitToCity?: string;
  remitToState?: string;
  remitToStateCode?: number;
  remitToCountry?: string;
  remitToEmail?: string;
  remitToPhone?: string;
  remitToGstin?: string;
  remitToCin?: string;
  sameAsDivisionAddress: boolean;
  shipToName?: string;
  shipToAddress1?: string;
  shipToAddress2?: string;
  shipToPostalCode?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToStateCode?: number;
  shipToCountry?: string;
  shipToPhone?: string;
  referenceTransactionType?: TransactionType;
  referenceTransactionNumber?: string;
  referenceTransactionDate?: string;
  paymentTerms: PaymentTerms;
  dueDate?: string;
  notes?: string;
  invoiceLines: InvoiceLineFormData[];
}

export interface InvoiceLineFormData {
  lineNumber: number;
  itemId: string;
  itemDescription: string;
  quantity: number;
  uom: string;
  weightPerUnit?: number;
  weightUom?: string;
  totalWeight?: number;
  unitPrice: number;
  totalPrice: number;
  gstPercentage: number;
  gstValue: number;
  lineTotal: number;
}

export interface ReferenceTransactionSearchParams {
  transactionType: TransactionType;
  transactionNumber?: string;
  transactionDate?: string;
  supplierName?: string;
}

export interface ReferenceTransactionResult {
  id: string;
  transactionType: TransactionType;
  transactionNumber: string;
  transactionDate: string;
  supplierName: string;
  totalValue: number;
}
