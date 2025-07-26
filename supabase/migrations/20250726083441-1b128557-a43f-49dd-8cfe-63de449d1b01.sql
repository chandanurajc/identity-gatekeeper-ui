-- Disable RLS for inventory transfer tables
ALTER TABLE public.inventory_transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_lines DISABLE ROW LEVEL SECURITY;