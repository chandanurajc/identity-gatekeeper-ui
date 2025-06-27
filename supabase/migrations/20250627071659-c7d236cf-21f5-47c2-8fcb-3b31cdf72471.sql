
-- Add state_code column to organization_contacts table
ALTER TABLE public.organization_contacts 
ADD COLUMN state_code smallint REFERENCES public.india_state_code(state_code);

-- Add state_code column to division_contacts table  
ALTER TABLE public.division_contacts 
ADD COLUMN state_code smallint REFERENCES public.india_state_code(state_code);

-- Add ship_to_state_code and supplier_state_code columns to purchase_order table
ALTER TABLE public.purchase_order 
ADD COLUMN ship_to_state_code smallint REFERENCES public.india_state_code(state_code),
ADD COLUMN supplier_state_code smallint REFERENCES public.india_state_code(state_code);
