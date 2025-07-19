-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('Created', 'Approved', 'Rejected');

-- Create payment type enum  
CREATE TYPE payment_type AS ENUM ('Invoice-based', 'Ad-hoc');

-- Create payment mode enum
CREATE TYPE payment_mode AS ENUM ('Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Online Payment', 'Wire Transfer');

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_number VARCHAR NOT NULL,
    payment_date DATE NOT NULL,
    payment_type payment_type NOT NULL,
    organization_id UUID NOT NULL,
    division_id UUID NOT NULL,
    payee_organization_id UUID NOT NULL,
    payment_mode payment_mode NOT NULL,
    reference_number VARCHAR,
    amount NUMERIC NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'INR',
    linked_invoice_id UUID,
    notes TEXT,
    status payment_status NOT NULL DEFAULT 'Created',
    created_by TEXT NOT NULL,
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT,
    updated_on TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view payments from their organization" 
ON public.payments 
FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create payments for their organization" 
ON public.payments 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update payments from their organization" 
ON public.payments 
FOR UPDATE 
USING (organization_id = get_user_organization_id(auth.uid()));

-- Create payment audit log table
CREATE TABLE public.payment_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL,
    old_status payment_status,
    new_status payment_status NOT NULL,
    changed_by TEXT NOT NULL,
    changed_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    comments TEXT
);

-- Enable RLS for audit log
ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment audit logs from their organization" 
ON public.payment_audit_log 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments p 
    WHERE p.id = payment_audit_log.payment_id 
    AND p.organization_id = get_user_organization_id(auth.uid())
));

-- Add permissions for payments
INSERT INTO public.permissions (name, module, component, description) VALUES
('view_payments', 'Finance', 'Payments', 'View payments list and details'),
('create_payments', 'Finance', 'Payments', 'Create new payments'),
('edit_payments', 'Finance', 'Payments', 'Edit payments in Created/Rejected status'),
('approve_payments', 'Finance', 'Payments', 'Approve payments'),
('reject_payments', 'Finance', 'Payments', 'Reject payments');

-- Create function to generate payment numbers
CREATE OR REPLACE FUNCTION public.generate_payment_number(org_id UUID)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    seq_name text;
    next_num integer;
    payment_num text;
BEGIN
    -- Create sequence name based on organization ID
    seq_name := 'payment_number_seq_' || replace(org_id::text, '-', '_');
    
    -- Create sequence if it doesn't exist
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', seq_name);
    
    -- Get next number from sequence
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;
    
    -- Format payment number as PAY-YYYY-NNNNNN
    payment_num := 'PAY-' || to_char(current_date, 'YYYY') || '-' || lpad(next_num::text, 6, '0');
    
    RETURN payment_num;
END;
$function$