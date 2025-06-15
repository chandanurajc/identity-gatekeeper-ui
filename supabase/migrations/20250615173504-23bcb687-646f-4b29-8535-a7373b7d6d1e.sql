
-- Create Enum for GL Transaction Types
CREATE TYPE public.gl_transaction_type AS ENUM (
    'Payable Invoice',
    'Payment',
    'Credit Note',
    'Debit Note'
);

-- Create General Ledger Table
CREATE TABLE public.general_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_to_orgid UUID NOT NULL REFERENCES public.organizations(id),
    remit_to_orgid UUID NOT NULL REFERENCES public.organizations(id),
    transaction_type public.gl_transaction_type NOT NULL,
    transaction_date DATE NOT NULL,
    reference_number TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    created_by TEXT,
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Snapshot fields for Bill To
    bill_to_name TEXT,
    bill_to_address1 TEXT,
    bill_to_address2 TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_country TEXT,
    bill_to_postal_code TEXT,
    bill_to_email TEXT,
    bill_to_phone TEXT,

    -- Snapshot fields for Remit To
    remit_to_name TEXT,
    remit_to_address1 TEXT,
    remit_to_address2 TEXT,
    remit_to_city TEXT,
    remit_to_state TEXT,
    remit_to_country TEXT,
    remit_to_postal_code TEXT,
    remit_to_email TEXT,
    remit_to_phone TEXT
);

-- Enable Row Level Security
ALTER TABLE public.general_ledger ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view GL entries where their org is the Bill To org.
CREATE POLICY "Users can view GL entries for their organization"
ON public.general_ledger
FOR SELECT
USING (bill_to_orgid = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Policy for INSERT: Users can insert GL entries where their org is the Bill To org.
CREATE POLICY "Users can insert GL entries for their organization"
ON public.general_ledger
FOR INSERT
WITH CHECK (bill_to_orgid = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Insert 'View General Ledger' permission
INSERT INTO public.permissions (name, module, component, description)
VALUES ('View General Ledger', 'Finance', 'General Ledger', 'Allows user to view the General Ledger')
ON CONFLICT (name) DO NOTHING;
