
export interface Invoice {
  id: string;
  organization_id: string;
  po_id: string;
  invoice_number: string;
  po_number: string;
  invoice_type: 'Payable';
  status: 'Created' | 'Approved';
  created_date: string;
  due_date: string;
  bill_to_name?: string;
  bill_to_address1?: string;
  bill_to_address2?: string;
  bill_to_city?: string;
  bill_to_state?: string;
  bill_to_country?: string;
  bill_to_postal_code?: string;
  bill_to_phone?: string;
  bill_to_email?: string;
  remit_to_name?: string;
  remit_to_address1?: string;
  remit_to_address2?: string;
  remit_to_city?: string;
  remit_to_state?: string;
  remit_to_country?: string;
  remit_to_postal_code?: string;
  remit_to_phone?: string;
  remit_to_email?: string;
  total_item_cost: number;
  total_gst: number;
  total_invoice_amount: number;
  created_by?: string;
  created_on: Date;
  updated_by?: string;
  updated_on?: Date;
  lines?: InvoiceLine[];
  supplier?: {
    name: string;
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
}
