
-- Add GST percentage and UOM columns to the items table
ALTER TABLE public.items 
ADD COLUMN gst_percentage numeric DEFAULT 0,
ADD COLUMN uom character varying DEFAULT 'Unit';

-- Update any existing records to have default values
UPDATE public.items 
SET gst_percentage = 0, uom = 'Unit' 
WHERE gst_percentage IS NULL OR uom IS NULL;
