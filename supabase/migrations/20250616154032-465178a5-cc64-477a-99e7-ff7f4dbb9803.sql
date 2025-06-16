
-- Create item_prices table to store item pricing information
CREATE TABLE IF NOT EXISTS public.item_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id CHARACTER VARYING NOT NULL,
  sales_channel_id UUID NULL,
  price NUMERIC NULL,
  organization_id UUID NULL,
  created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_on TIMESTAMP WITH TIME ZONE NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NULL,
  FOREIGN KEY (sales_channel_id) REFERENCES public.sales_channels(id),
  FOREIGN KEY (item_id) REFERENCES public.items(id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_item_prices_item_id ON public.item_prices(item_id);
CREATE INDEX IF NOT EXISTS idx_item_prices_sales_channel_id ON public.item_prices(sales_channel_id);
CREATE INDEX IF NOT EXISTS idx_item_prices_organization_id ON public.item_prices(organization_id);
