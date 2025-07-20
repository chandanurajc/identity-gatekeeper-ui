export type PaymentStatus = 'Created' | 'Approved' | 'Rejected';
export type PaymentType = 'Invoice-based' | 'Ad-hoc';
export type PaymentMode = 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Online Payment' | 'Wire Transfer';

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentType: PaymentType;
  organizationId: string;
  divisionId: string;
  payeeOrganizationId: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  amount: number;
  currency: string;
  linkedInvoiceId?: string;
  notes?: string;
  status: PaymentStatus;
  createdBy: string;
  createdOn: Date;
  updatedBy?: string;
  updatedOn?: Date;
  
  // Populated joins
  payeeOrganization?: {
    id: string;
    name: string;
  };
  division?: {
    id: string;
    name: string;
  };
  linkedInvoice?: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    supplierOrganizationId: string;
    supplierName: string;
    totalInvoiceValue: number;
    billToOrgId: string;
    remitToOrgId: string;
    status: string;
  };
}

export interface PaymentFormData {
  paymentNumber?: string;
  paymentDate: string;
  paymentType: PaymentType;
  divisionId: string;
  payeeOrganizationId: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  amount: number;
  linkedInvoiceId?: string;
  notes?: string;
}

export interface PaymentAuditLog {
  id: string;
  paymentId: string;
  oldStatus?: PaymentStatus;
  newStatus: PaymentStatus;
  changedBy: string;
  changedOn: Date;
  comments?: string;
}

export interface InvoiceSearchParams {
  supplierOrgId?: string;
  invoiceNumber?: string;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
}

export interface InvoiceSearchResult {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplierOrganizationId: string;
  supplierName: string;
  totalInvoiceValue: number;
  billToOrgId: string;
  remitToOrgId: string;
  status: string;
}