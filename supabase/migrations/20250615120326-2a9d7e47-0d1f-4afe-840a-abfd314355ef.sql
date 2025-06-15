
-- Grant permissions for sequences to the authenticated role
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;

-- Change the function to run with the permissions of the owner, who has create rights
ALTER FUNCTION public.generate_invoice_number(uuid) SECURITY DEFINER;
