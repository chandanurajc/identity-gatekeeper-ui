
-- Drop the invoice_audit_log table first (has foreign key to invoice)
DROP TABLE IF EXISTS public.invoice_audit_log CASCADE;

-- Drop the invoice_line table (has foreign key to invoice)
DROP TABLE IF EXISTS public.invoice_line CASCADE;

-- Drop the invoice table
DROP TABLE IF EXISTS public.invoice CASCADE;

-- Drop the invoice_status enum type
DROP TYPE IF EXISTS public.invoice_status CASCADE;

-- Remove invoice-related permissions from the permissions table
DELETE FROM public.permissions 
WHERE name IN (
    'View Invoices', 
    'Approve Invoice'
) AND module = 'Finance' AND component = 'Invoice Management';

-- Drop the generate_invoice_number function
DROP FUNCTION IF EXISTS public.generate_invoice_number(uuid) CASCADE;

-- Remove invoice number sequences (these are created dynamically per organization)
-- Note: Since sequences are created dynamically with organization IDs, 
-- we'll need to drop them individually if they exist
-- This is a best-effort cleanup - some sequences may remain if organizations were deleted
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    -- Get all invoice number sequences and drop them
    FOR seq_name IN 
        SELECT schemaname||'.'||sequencename as full_name
        FROM pg_sequences 
        WHERE sequencename LIKE 'invoice_number_seq_%'
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || seq_name || ' CASCADE';
    END LOOP;
END $$;
