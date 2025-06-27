
-- Create invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('Draft', 'Awaiting Approval', 'Approved', 'Rejected');

-- Create invoice type enum  
CREATE TYPE public.invoice_type AS ENUM ('Payable', 'Receivable');

-- Create transaction type enum for reference transactions
CREATE TYPE public.transaction_type AS ENUM ('Purchase Order', 'Sales Order');

-- Create payment terms enum
CREATE TYPE public.payment_terms AS ENUM ('Net 30', 'Net 60', 'Net 90', 'Due on Receipt');

-- Create main invoice table
CREATE TABLE public.invoice (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    division_id uuid NOT NULL,
    invoice_number character varying NOT NULL,
    invoice_date date NOT NULL DEFAULT CURRENT_DATE,
    invoice_type invoice_type NOT NULL,
    status invoice_status NOT NULL DEFAULT 'Draft',
    
    -- Bill To details
    bill_to_org_id uuid NOT NULL,
    bill_to_name text,
    bill_to_address1 text,
    bill_to_address2 text,
    bill_to_postal_code character varying,
    bill_to_city character varying,
    bill_to_state character varying,
    bill_to_state_code smallint,
    bill_to_country character varying,
    bill_to_email character varying,
    bill_to_phone character varying,
    bill_to_gstin character varying,
    bill_to_cin character varying,
    
    -- Remit To details
    remit_to_org_id uuid NOT NULL,
    remit_to_name text,
    remit_to_address1 text,
    remit_to_address2 text,
    remit_to_postal_code character varying,
    remit_to_city character varying,
    remit_to_state character varying,
    remit_to_state_code smallint,
    remit_to_country character varying,
    remit_to_email character varying,
    remit_to_phone character varying,
    remit_to_gstin character varying,
    remit_to_cin character varying,
    
    -- Ship To details
    same_as_division_address boolean DEFAULT false,
    ship_to_name text,
    ship_to_address1 text,
    ship_to_address2 text,
    ship_to_postal_code character varying,
    ship_to_city character varying,
    ship_to_state character varying,
    ship_to_state_code smallint,
    ship_to_country character varying,
    ship_to_phone character varying,
    
    -- Reference transaction
    reference_transaction_type transaction_type,
    reference_transaction_number character varying,
    reference_transaction_date date,
    
    -- Payment terms
    payment_terms payment_terms DEFAULT 'Net 30',
    due_date date,
    
    -- Totals
    total_item_value numeric(15,2) DEFAULT 0,
    total_gst_value numeric(15,2) DEFAULT 0,
    total_invoice_value numeric(15,2) DEFAULT 0,
    
    -- Audit fields
    created_on timestamp with time zone NOT NULL DEFAULT now(),
    updated_on timestamp with time zone,
    created_by text NOT NULL,
    updated_by text
);

-- Create invoice line items table
CREATE TABLE public.invoice_line (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES public.invoice(id) ON DELETE CASCADE,
    line_number integer NOT NULL,
    item_id character varying NOT NULL,
    item_description text NOT NULL,
    quantity numeric(15,3) NOT NULL,
    uom character varying NOT NULL,
    weight_per_unit numeric(15,3),
    weight_uom character varying DEFAULT 'kg',
    total_weight numeric(15,3),
    unit_price numeric(15,2) NOT NULL,
    total_price numeric(15,2) NOT NULL,
    gst_percentage numeric(5,2) NOT NULL DEFAULT 0,
    gst_value numeric(15,2) NOT NULL DEFAULT 0,
    line_total numeric(15,2) NOT NULL,
    
    created_on timestamp with time zone NOT NULL DEFAULT now(),
    updated_on timestamp with time zone
);

-- Create GST breakdown table
CREATE TABLE public.invoice_gst_breakdown (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES public.invoice(id) ON DELETE CASCADE,
    gst_percentage numeric(5,2) NOT NULL,
    taxable_amount numeric(15,2) NOT NULL,
    cgst_percentage numeric(5,2) DEFAULT 0,
    cgst_amount numeric(15,2) DEFAULT 0,
    sgst_percentage numeric(5,2) DEFAULT 0,
    sgst_amount numeric(15,2) DEFAULT 0,
    igst_percentage numeric(5,2) DEFAULT 0,
    igst_amount numeric(15,2) DEFAULT 0,
    total_gst_amount numeric(15,2) NOT NULL
);

-- Create invoice audit log for status changes
CREATE TABLE public.invoice_audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES public.invoice(id) ON DELETE CASCADE,
    old_status invoice_status,
    new_status invoice_status NOT NULL,
    changed_by text NOT NULL,
    changed_on timestamp with time zone NOT NULL DEFAULT now(),
    comments text
);

-- Create function to generate invoice numbers per organization
CREATE OR REPLACE FUNCTION public.generate_invoice_number(org_id uuid)
RETURNS character varying
LANGUAGE plpgsql
AS $$
DECLARE
    seq_name text;
    next_num integer;
    invoice_num text;
BEGIN
    -- Create sequence name based on organization ID
    seq_name := 'invoice_number_seq_' || replace(org_id::text, '-', '_');
    
    -- Create sequence if it doesn't exist
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', seq_name);
    
    -- Get next number from sequence
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;
    
    -- Format invoice number as INV-YYYY-NNNNNN
    invoice_num := 'INV-' || to_char(current_date, 'YYYY') || '-' || lpad(next_num::text, 6, '0');
    
    RETURN invoice_num;
END;
$$;

-- Add invoice-related permissions
INSERT INTO public.permissions (name, module, component, description) VALUES 
('View Invoices', 'Finance', 'Invoice Management', 'Permission to view invoices'),
('Create Invoice', 'Finance', 'Invoice Management', 'Permission to create invoices'),
('Edit Invoice', 'Finance', 'Invoice Management', 'Permission to edit invoices'),
('Delete Invoice', 'Finance', 'Invoice Management', 'Permission to delete invoices'),
('Send Invoice for Approval', 'Finance', 'Invoice Management', 'Permission to send invoices for approval'),
('Approve Invoice', 'Finance', 'Invoice Management', 'Permission to approve invoices'),
('Reject Invoice', 'Finance', 'Invoice Management', 'Permission to reject invoices');

-- Create indexes for better performance
CREATE INDEX idx_invoice_organization_id ON public.invoice(organization_id);
CREATE INDEX idx_invoice_division_id ON public.invoice(division_id);
CREATE INDEX idx_invoice_status ON public.invoice(status);
CREATE INDEX idx_invoice_type ON public.invoice(invoice_type);
CREATE INDEX idx_invoice_number ON public.invoice(invoice_number);
CREATE INDEX idx_invoice_line_invoice_id ON public.invoice_line(invoice_id);
CREATE INDEX idx_invoice_gst_breakdown_invoice_id ON public.invoice_gst_breakdown(invoice_id);
CREATE INDEX idx_invoice_audit_log_invoice_id ON public.invoice_audit_log(invoice_id);
