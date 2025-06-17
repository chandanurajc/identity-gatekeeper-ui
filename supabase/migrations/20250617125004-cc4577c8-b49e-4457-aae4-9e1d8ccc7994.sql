
-- Add GST fields to the invoice table for both bill_to and remit_to parties
ALTER TABLE public.invoice 
ADD COLUMN IF NOT EXISTS bill_to_gst text,
ADD COLUMN IF NOT EXISTS remit_to_gst text;

-- Add weight UOM to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS weight_uom character varying DEFAULT 'kg';

-- Add weight columns to purchase_order_line table (referencing item weight and calculating total)
ALTER TABLE public.purchase_order_line 
ADD COLUMN IF NOT EXISTS item_weight_per_unit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_weight_uom character varying DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS total_line_weight numeric DEFAULT 0;

-- Add weight columns to invoice_line table (referencing item weight and calculating total)
ALTER TABLE public.invoice_line 
ADD COLUMN IF NOT EXISTS item_weight_per_unit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_weight_uom character varying DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS total_line_weight numeric DEFAULT 0;
