-- Add foreign key constraints for subledger table
ALTER TABLE public.subledger 
ADD CONSTRAINT subledger_party_org_id_fkey 
FOREIGN KEY (party_org_id) REFERENCES public.organizations(id);

ALTER TABLE public.subledger 
ADD CONSTRAINT subledger_party_contact_id_fkey 
FOREIGN KEY (party_contact_id) REFERENCES public.organization_contacts(id);