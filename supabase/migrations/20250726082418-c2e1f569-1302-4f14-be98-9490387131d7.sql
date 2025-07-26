-- Create inventory transfer table
CREATE TABLE public.inventory_transfers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_number character varying NOT NULL,
    organization_id uuid NOT NULL,
    origin_division_id uuid NOT NULL,
    destination_division_id uuid NOT NULL,
    transfer_date date NOT NULL DEFAULT CURRENT_DATE,
    tracking_number character varying,
    status character varying NOT NULL DEFAULT 'Transfer initiated',
    created_on timestamp with time zone NOT NULL DEFAULT now(),
    updated_on timestamp with time zone,
    created_by text NOT NULL,
    updated_by text
);

-- Create inventory transfer lines table
CREATE TABLE public.inventory_transfer_lines (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_id uuid NOT NULL,
    line_number integer NOT NULL,
    item_id character varying NOT NULL,
    quantity_to_transfer numeric NOT NULL,
    created_on timestamp with time zone NOT NULL DEFAULT now(),
    updated_on timestamp with time zone,
    FOREIGN KEY (transfer_id) REFERENCES public.inventory_transfers(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_lines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_transfers
CREATE POLICY "Users can manage inventory transfers within their own organization" 
ON public.inventory_transfers 
FOR ALL 
USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create RLS policies for inventory_transfer_lines
CREATE POLICY "Users can manage inventory transfer lines within their own organization" 
ON public.inventory_transfer_lines 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.inventory_transfers it 
    WHERE it.id = inventory_transfer_lines.transfer_id 
    AND it.organization_id = get_user_organization_id(auth.uid())
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventory_transfers it 
    WHERE it.id = inventory_transfer_lines.transfer_id 
    AND it.organization_id = get_user_organization_id(auth.uid())
));

-- Create function to generate transfer numbers
CREATE OR REPLACE FUNCTION public.generate_transfer_number(org_id uuid)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    seq_name text;
    next_num integer;
    transfer_num text;
BEGIN
    -- Create sequence name based on organization ID
    seq_name := 'transfer_number_seq_' || replace(org_id::text, '-', '_');
    
    -- Create sequence if it doesn't exist
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', seq_name);
    
    -- Get next number from sequence
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;
    
    -- Format transfer number as IT-YYYY-NNNNNN
    transfer_num := 'IT-' || to_char(current_date, 'YYYY') || '-' || lpad(next_num::text, 6, '0');
    
    RETURN transfer_num;
END;
$function$