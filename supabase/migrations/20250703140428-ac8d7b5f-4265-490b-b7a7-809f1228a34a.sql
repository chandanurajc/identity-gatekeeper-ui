-- Disable RLS on purchase_order and purchase_order_line tables to fix data access issues
ALTER TABLE public.purchase_order DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_line DISABLE ROW LEVEL SECURITY;