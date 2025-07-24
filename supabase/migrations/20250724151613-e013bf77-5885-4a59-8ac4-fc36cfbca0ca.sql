-- Add missing columns to subledger table
ALTER TABLE public.subledger 
ADD COLUMN IF NOT EXISTS party_code character varying,
ADD COLUMN IF NOT EXISTS party_contact_id uuid;

-- Add foreign key constraint to organization_contacts
ALTER TABLE public.subledger 
ADD CONSTRAINT fk_subledger_party_contact 
FOREIGN KEY (party_contact_id) 
REFERENCES public.organization_contacts(id);