-- Add remit_to_contact_id to purchase_order table
ALTER TABLE public.purchase_order 
ADD COLUMN remit_to_contact_id uuid REFERENCES public.organization_contacts(id);

-- Add remit_to_contact_id to invoice table  
ALTER TABLE public.invoice 
ADD COLUMN remit_to_contact_id uuid REFERENCES public.organization_contacts(id);

-- Add index for better performance on purchase_order
CREATE INDEX idx_purchase_order_remit_to_contact_id ON public.purchase_order(remit_to_contact_id);

-- Add index for better performance on invoice
CREATE INDEX idx_invoice_remit_to_contact_id ON public.invoice(remit_to_contact_id);