-- Add foreign key constraints for inventory_transfers table
ALTER TABLE public.inventory_transfers 
ADD CONSTRAINT fk_inventory_transfers_organization 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE public.inventory_transfers 
ADD CONSTRAINT fk_inventory_transfers_origin_division 
FOREIGN KEY (origin_division_id) REFERENCES public.divisions(id);

ALTER TABLE public.inventory_transfers 
ADD CONSTRAINT fk_inventory_transfers_destination_division 
FOREIGN KEY (destination_division_id) REFERENCES public.divisions(id);

-- Add foreign key constraint for inventory_transfer_lines table
ALTER TABLE public.inventory_transfer_lines 
ADD CONSTRAINT fk_inventory_transfer_lines_transfer 
FOREIGN KEY (transfer_id) REFERENCES public.inventory_transfers(id);

ALTER TABLE public.inventory_transfer_lines 
ADD CONSTRAINT fk_inventory_transfer_lines_item 
FOREIGN KEY (item_id) REFERENCES public.items(id);