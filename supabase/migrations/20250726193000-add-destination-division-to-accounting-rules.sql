ALTER TABLE public.accounting_rules ADD COLUMN IF NOT EXISTS destination_division_id UUID REFERENCES divisions(id);
