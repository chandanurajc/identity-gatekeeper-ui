-- Modify subledger table structure
-- Add organization contact ID, debit/credit columns, transaction category and triggering action
-- Remove status field

-- Add new columns to subledger table
ALTER TABLE subledger 
ADD COLUMN organization_contact_id uuid,
ADD COLUMN debit_amount numeric DEFAULT 0,
ADD COLUMN credit_amount numeric DEFAULT 0,
ADD COLUMN transaction_category character varying,
ADD COLUMN triggering_action character varying;

-- Drop the status column
ALTER TABLE subledger DROP COLUMN IF EXISTS status;

-- Add foreign key constraint for organization_contact_id
ALTER TABLE subledger ADD CONSTRAINT subledger_organization_contact_id_fkey 
    FOREIGN KEY (organization_contact_id) REFERENCES organization_contacts(id);