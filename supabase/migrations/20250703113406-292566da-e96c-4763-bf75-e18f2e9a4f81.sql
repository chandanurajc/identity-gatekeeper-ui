-- Grant execute permission on generate_invoice_number function to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(uuid) TO authenticated;

-- Also grant execute to anon role for broader access
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(uuid) TO anon;