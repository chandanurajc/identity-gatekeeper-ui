-- Disable RLS on finance tables
ALTER TABLE public.chart_of_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_header DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_line DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subledger DISABLE ROW LEVEL SECURITY;