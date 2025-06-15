
-- First, drop the existing CHECK constraints on contact_type for both tables.
-- The constraint names are assumed based on standard PostgreSQL naming conventions.
ALTER TABLE public.organization_contacts DROP CONSTRAINT organization_contacts_contact_type_check;
ALTER TABLE public.division_contacts DROP CONSTRAINT division_contacts_contact_type_check;

-- Then, add new CHECK constraints with the updated list of contact types.
ALTER TABLE public.organization_contacts ADD CONSTRAINT organization_contacts_contact_type_check 
  CHECK (contact_type IN ('Registered location', 'Billing', 'Shipping', 'Owner', 'Bill To', 'Remit To'));

ALTER TABLE public.division_contacts ADD CONSTRAINT division_contacts_contact_type_check 
  CHECK (contact_type IN ('Registered location', 'Billing', 'Shipping', 'Owner', 'Bill To', 'Remit To'));
