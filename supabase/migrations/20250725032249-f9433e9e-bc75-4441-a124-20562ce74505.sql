-- Remove RLS policies from subledger table
DROP POLICY IF EXISTS "Users can view subledger entries for their organization" ON public.subledger;
DROP POLICY IF EXISTS "Users can insert subledger entries for their organization" ON public.subledger;
DROP POLICY IF EXISTS "Users can update subledger entries for their organization" ON public.subledger;

-- Disable RLS on subledger table
ALTER TABLE public.subledger DISABLE ROW LEVEL SECURITY;