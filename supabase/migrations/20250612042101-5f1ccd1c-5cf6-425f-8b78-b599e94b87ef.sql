
-- First, let's rename the item_prices table to item_costs_new (since item_costs already exists)
-- and update the existing item_costs table structure

-- Drop the existing item_prices table
DROP TABLE IF EXISTS public.item_prices;

-- Update the existing item_costs table to include the price field (rename cost to price)
ALTER TABLE public.item_costs 
ADD COLUMN IF NOT EXISTS price numeric;

-- Copy cost values to price column if price is null
UPDATE public.item_costs 
SET price = cost 
WHERE price IS NULL;

-- Drop the cost column
ALTER TABLE public.item_costs 
DROP COLUMN IF EXISTS cost;

-- Make supplier_id nullable (it should already be nullable, but ensuring it)
ALTER TABLE public.item_costs 
ALTER COLUMN supplier_id DROP NOT NULL;

-- Add a comment to clarify the table purpose
COMMENT ON TABLE public.item_costs IS 'Stores item pricing information for different suppliers. Supplier can be null for default pricing.';
COMMENT ON COLUMN public.item_costs.supplier_id IS 'Optional supplier ID. If null, represents default pricing for the item.';
COMMENT ON COLUMN public.item_costs.price IS 'Price of the item for the specified supplier or default price if supplier is null.';
