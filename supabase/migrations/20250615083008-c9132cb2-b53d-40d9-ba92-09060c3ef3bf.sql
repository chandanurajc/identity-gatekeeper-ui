
-- Drop the existing incorrect foreign key constraint on purchase_order.division_id
ALTER TABLE public.purchase_order DROP CONSTRAINT IF EXISTS purchase_order_division_id_fkey;

-- Add the correct foreign key constraint, referencing the divisions table
ALTER TABLE public.purchase_order ADD CONSTRAINT purchase_order_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id);
