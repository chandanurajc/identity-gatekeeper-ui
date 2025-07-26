-- Add 'Assets - Inventory' to the account_type enum in Postgres
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'Assets - Inventory';
