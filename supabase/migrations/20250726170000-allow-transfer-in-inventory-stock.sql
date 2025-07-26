-- Migration: Allow 'TRANSFER' as a valid transaction_type in inventory_stock
ALTER TABLE public.inventory_stock
  DROP CONSTRAINT IF EXISTS inventory_stock_transaction_type_check;
ALTER TABLE public.inventory_stock
  ADD CONSTRAINT inventory_stock_transaction_type_check
    CHECK (transaction_type IN ('PO_RECEIVE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'SALES_ORDER', 'TRANSFER'));
