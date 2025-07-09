-- Add new triggering action 'Purchase order receive'
ALTER TYPE rule_action ADD VALUE 'Purchase order receive';

-- Rename columns in accounting_rules table
ALTER TABLE accounting_rules RENAME COLUMN source_type TO transaction_type;
ALTER TABLE accounting_rules RENAME COLUMN source_reference TO transaction_reference;

-- Rename columns in journal_header table  
ALTER TABLE journal_header RENAME COLUMN source_type TO transaction_type;
ALTER TABLE journal_header RENAME COLUMN source_reference TO transaction_reference;

-- Add transaction_type_text field to accounting_rules
ALTER TABLE accounting_rules ADD COLUMN transaction_type_text TEXT;

-- Add po_type enum and column to purchase_order table
CREATE TYPE po_type AS ENUM ('Consumables', 'Assets', 'Finished goods', 'Raw materials');
ALTER TABLE purchase_order ADD COLUMN po_type po_type;