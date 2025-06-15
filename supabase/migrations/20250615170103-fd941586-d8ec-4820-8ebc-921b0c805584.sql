
ALTER TABLE public.invoice
ADD COLUMN bill_to_pan TEXT,
ADD COLUMN bill_to_cin TEXT,
ADD COLUMN remit_to_pan TEXT,
ADD COLUMN remit_to_cin TEXT;
