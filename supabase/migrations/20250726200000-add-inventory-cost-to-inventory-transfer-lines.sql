-- Migration: Add inventory_cost to inventory_transfer_lines for transfer cost tracking
ALTER TABLE public.inventory_transfer_lines
ADD COLUMN IF NOT EXISTS inventory_cost NUMERIC;
