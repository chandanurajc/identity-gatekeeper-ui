-- Disable Row Level Security for payments and payment_audit_log tables
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_log DISABLE ROW LEVEL SECURITY; 