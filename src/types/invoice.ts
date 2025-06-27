
export interface Invoice {
  id: string;
  organization_id: string;
  po_id?: string;
  division_id?: string;
  bill_to_organization_id?: string;
  remit_to_organization_id?: string;
  bill_to_contact_id?: string;
  remit_to_contact_id?: string;
  invoice_number: string;
  invoice_date: string;
  invoice_type: 'Payable' | 'Receivable';
  status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  
  // Reference transaction
  reference_transaction_type?: 'Purchase Order' | 'Sales Order';
  reference_transaction_id?: string;
  reference_transaction_number?: string;
  
  // Ship to details
  ship_to_same_as_division?: boolean;
  ship_to_name?: string;
  ship_to_address1?: string;
  ship_to_address2?: string;
  ship_to_postal_code?: string;
  ship_to_city?: string;
  ship_to_state?: string;
  ship_to_state_code?: number;
  ship_to_country?: string;
  ship_to_phone?: string;
  
  // Bill to details (snapshot)
  bill_to_name?: string;
  bill_to_address1?: string;
  bill_to_address2?: string;
  bill_to_city?: string;
  bill_to_state?: string;
  bill_to_country?: string;
  bill_to_postal_code?: string;
  bill_to_phone?: string;
  bill_to_email?: string;
  bill_to_pan?: string;
  bill_to_cin?: string;
  bill_to_gst?: string;
  bill_to_accounting_code?: string;
  
  // Remit to details (snapshot)
  remit_to_name?: string;
  remit_to_address1?: string;
  remit_to_address2?: string;
  remit_to_city?: string;
  remit_to_state?: string;
  remit_to_country?: string;
  remit_to_postal_code?: string;
  remit_to_phone?: string;
  remit_to_email?: string;
  remit_to_pan?: string;
  remit_to_cin?: string;
  remit_to_gst?: string;
  remit_to_accounting_code?: string;
  
  // Financial totals
  total_item_cost: number;
  total_item_value: number;
  total_gst: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_invoice_amount: number;
  
  // Payment terms
  payment_terms?: string;
  due_date: string;
  
  created_by?: string;
  created_on: Date;
  updated_by?: string;
  updated_on?: Date;
  
  // Related data
  lines?: InvoiceLine[];
  gstLines?: InvoiceGSTLine[];
  statusHistory?: InvoiceStatusHistory[];
  division?: {
    name: string;
    code: string;
  };
  billToOrganization?: {
    name: string;
    code: string;
  };
  remitToOrganization?: {
    name: string;
    code: string;
  };
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  organization_id: string;
  line_number: number;
  item_id: string;
  item_description?: string;
  item_group_name?: string;
  classification?: string;
  sub_classification?: string;
  quantity: number;
  uom: string;
  unit_cost: number;
  total_item_cost: number;
  gst_percent: number;
  gst_value: number;
  line_total: number;
  weight_per_unit?: number;
  weight_uom?: string;
  total_weight?: number;
  created_by?: string;
  created_on?: Date;
  updated_by?: string;
  updated_on?: Date;
}

export interface InvoiceGSTLine {
  id: string;
  invoice_id: string;
  organization_id: string;
  gst_type: 'CGST' | 'SGST' | 'IGST';
  gst_percent: number;
  taxable_amount: number;
  gst_amount: number;
  created_on: Date;
  created_by?: string;
}

export interface InvoiceStatusHistory {
  id: string;
  invoice_id: string;
  organization_id: string;
  status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  changed_by: string;
  changed_on: Date;
  comments?: string;
}

export interface TaxMaster {
  id: string;
  organization_id: string;
  tax_code: string;
  tax_name: string;
  tax_percent: number;
  is_active: boolean;
  created_on: Date;
  created_by: string;
  updated_on?: Date;
  updated_by?: string;
}

export interface InvoiceFormData {
  // Basic details
  invoice_number: string;
  invoice_date: string;
  invoice_type: 'Payable' | 'Receivable';
  division_id: string;
  
  // Party details
  bill_to_organization_id?: string;
  bill_to_contact_id?: string;
  remit_to_organization_id?: string;
  remit_to_contact_id?: string;
  
  // Reference transaction
  reference_transaction_type?: 'Purchase Order' | 'Sales Order';
  reference_transaction_id?: string;
  reference_transaction_number?: string;
  
  // Ship to address
  ship_to_same_as_division: boolean;
  ship_to_name?: string;
  ship_to_address1?: string;
  ship_to_address2?: string;
  ship_to_postal_code?: string;
  ship_to_city?: string;
  ship_to_state?: string;
  ship_to_state_code?: number;
  ship_to_country?: string;
  ship_to_phone?: string;
  
  // Payment terms
  payment_terms: string;
  due_date: string;
  
  // Line items
  lines: InvoiceLineFormData[];
}

export interface InvoiceLineFormData {
  line_number: number;
  item_id: string;
  quantity: number;
  uom: string;
  unit_cost: number;
  weight_per_unit?: number;
  weight_uom?: string;
  gst_percent: number;
  // Calculated fields
  total_item_cost: number;
  total_weight?: number;
  gst_value: number;
  line_total: number;
}

export interface ReferenceTransactionSearch {
  transaction_type: 'Purchase Order' | 'Sales Order';
  transaction_number?: string;
  transaction_date?: string;
  supplier_name?: string;
}

export interface ReferenceTransaction {
  id: string;
  transaction_type: 'Purchase Order' | 'Sales Order';
  transaction_number: string;
  transaction_date: string;
  supplier_name?: string;
  total_amount?: number;
  status: string;
}

export interface GSTPersistence {
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
}
