-- Ensure the function exists and has proper permissions
-- First check if function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'generate_invoice_number'
    ) THEN
        RAISE EXCEPTION 'Function generate_invoice_number does not exist in public schema';
    END IF;
END $$;

-- Grant execute permissions explicitly
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(uuid) TO anon;

-- Also ensure the function is security definer to avoid RLS issues
ALTER FUNCTION public.generate_invoice_number(uuid) SECURITY DEFINER;