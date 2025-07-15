-- Add division_id to accounting_rules
ALTER TABLE public.accounting_rules
ADD COLUMN division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL; 