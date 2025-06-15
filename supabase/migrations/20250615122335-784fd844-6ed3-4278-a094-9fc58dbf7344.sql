
-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(uuid) TO authenticated;
