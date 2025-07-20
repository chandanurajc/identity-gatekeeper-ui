-- Add foreign key constraints for payments table
-- This fixes the "could not find relationship between payments and organizations" error

-- Add foreign key for organization_id
ALTER TABLE public.payments 
ADD CONSTRAINT payments_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add foreign key for division_id
ALTER TABLE public.payments 
ADD CONSTRAINT payments_division_id_fkey 
FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE CASCADE;

-- Add foreign key for payee_organization_id
ALTER TABLE public.payments 
ADD CONSTRAINT payments_payee_organization_id_fkey 
FOREIGN KEY (payee_organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add foreign key for linked_invoice_id (optional)
ALTER TABLE public.payments 
ADD CONSTRAINT payments_linked_invoice_id_fkey 
FOREIGN KEY (linked_invoice_id) REFERENCES public.invoice(id) ON DELETE SET NULL;

-- Add foreign key for payment_audit_log.payment_id
ALTER TABLE public.payment_audit_log 
ADD CONSTRAINT payment_audit_log_payment_id_fkey 
FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE; 