-- Migration: Add inventory_cost to inventory_stock for PO receive cost tracking
ALTER TABLE public.inventory_stock
ADD COLUMN IF NOT EXISTS inventory_cost NUMERIC;
