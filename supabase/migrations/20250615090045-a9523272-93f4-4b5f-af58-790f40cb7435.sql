
-- Drop the constraint if it exists, to prevent errors on re-run
ALTER TABLE public.purchase_order DROP CONSTRAINT IF EXISTS purchase_order_supplier_id_fkey;

-- Add the foreign key constraint to link purchase_order.supplier_id to organizations.id
ALTER TABLE public.purchase_order
ADD CONSTRAINT purchase_order_supplier_id_fkey
FOREIGN KEY (supplier_id)
REFERENCES public.organizations(id);
