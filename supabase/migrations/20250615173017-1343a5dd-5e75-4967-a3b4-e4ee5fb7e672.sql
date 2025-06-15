
ALTER TABLE public.invoice
ADD COLUMN bill_to_organization_id UUID,
ADD COLUMN remit_to_organization_id UUID;

ALTER TABLE public.invoice
ADD CONSTRAINT invoice_bill_to_organization_id_fkey
FOREIGN KEY (bill_to_organization_id)
REFERENCES public.organizations(id);

ALTER TABLE public.invoice
ADD CONSTRAINT invoice_remit_to_organization_id_fkey
FOREIGN KEY (remit_to_organization_id)
REFERENCES public.organizations(id);
