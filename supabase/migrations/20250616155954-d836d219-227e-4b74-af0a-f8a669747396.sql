
-- Ensure the foreign key relationship exists between divisions and organizations
ALTER TABLE public.divisions 
DROP CONSTRAINT IF EXISTS divisions_organization_id_fkey;

ALTER TABLE public.divisions 
ADD CONSTRAINT divisions_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES public.organizations(id);
