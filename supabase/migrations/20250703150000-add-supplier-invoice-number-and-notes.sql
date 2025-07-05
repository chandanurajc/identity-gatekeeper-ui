-- Add supplier invoice number and notes fields to invoice table
ALTER TABLE public.invoice
ADD COLUMN supplier_invoice_number character varying,
ADD COLUMN notes text; 