
-- Create enumeration types for invoice status
CREATE TYPE public.invoice_status AS ENUM ('Created', 'Approved');

-- Create the invoice table to store header-level information
CREATE TABLE public.invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    po_id UUID NOT NULL UNIQUE REFERENCES public.purchase_order(id),
    invoice_number TEXT NOT NULL,
    po_number TEXT NOT NULL,
    invoice_type TEXT NOT NULL DEFAULT 'Payable',
    status public.invoice_status NOT NULL DEFAULT 'Created',
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date DATE NOT NULL,
    bill_to_name TEXT,
    bill_to_address1 TEXT,
    bill_to_address2 TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_country TEXT,
    bill_to_postal_code TEXT,
    bill_to_phone TEXT,
    bill_to_email TEXT,
    remit_to_name TEXT,
    remit_to_address1 TEXT,
    remit_to_address2 TEXT,
    remit_to_city TEXT,
    remit_to_state TEXT,
    remit_to_country TEXT,
    remit_to_postal_code TEXT,
    remit_to_phone TEXT,
    remit_to_email TEXT,
    total_item_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_gst NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_invoice_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_by TEXT,
    created_on TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by TEXT,
    updated_on TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_invoice_number_organization_id UNIQUE (invoice_number, organization_id)
);

-- Add comments to the invoice table columns
COMMENT ON COLUMN public.invoice.po_id IS 'Foreign key to the purchase order. Made unique to prevent multiple invoices per PO.';
COMMENT ON COLUMN public.invoice.status IS 'The current status of the invoice, e.g., Created, Approved.';

-- Create the invoice_line table to store line-item details
CREATE TABLE public.invoice_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoice(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    line_number INT NOT NULL,
    item_id VARCHAR NOT NULL REFERENCES public.items(id),
    item_description TEXT,
    item_group_name TEXT,
    classification VARCHAR,
    sub_classification VARCHAR,
    quantity NUMERIC(15, 2) NOT NULL,
    uom VARCHAR NOT NULL,
    unit_cost NUMERIC(15, 2) NOT NULL,
    total_item_cost NUMERIC(15, 2) NOT NULL,
    gst_percent NUMERIC(5, 2) NOT NULL,
    gst_value NUMERIC(15, 2) NOT NULL,
    line_total NUMERIC(15, 2) NOT NULL,
    created_by TEXT,
    created_on TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by TEXT,
    updated_on TIMESTAMP WITH TIME ZONE
);

-- Create the invoice_audit_log table
CREATE TABLE public.invoice_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoice(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID NOT NULL,
    event_description TEXT NOT NULL,
    change_details JSONB,
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.invoice_audit_log.change_details IS 'Stores before and after values for auditable changes, e.g., status updates.';

-- Create a function to generate invoice numbers prefixed with 'INV-' and padded with leading zeros
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_organization_id uuid)
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_invoice_number TEXT;
BEGIN
    -- This sequence will be unique for each organization
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS invoice_number_seq_' || replace(p_organization_id::text, '-', '');
    EXECUTE 'SELECT nextval(''invoice_number_seq_' || replace(p_organization_id::text, '-', '') || ''')' INTO next_val;
    new_invoice_number := 'INV-' || to_char(next_val, 'FM000000');
    RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Insert new permissions for Invoice Management
INSERT INTO public.permissions (name, module, component, description)
VALUES
    ('View Invoices', 'Finance', 'Invoice Management', 'Access list and details of payable invoices'),
    ('Approve Invoice', 'Finance', 'Invoice Management', 'Approve an invoice from the details screen')
ON CONFLICT (name) DO NOTHING;
