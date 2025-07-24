-- Fix the foreign key constraint for subledger.journal_id
-- It should point to journal_header.id, not journal_line.id

-- Drop the incorrect foreign key constraint
ALTER TABLE subledger DROP CONSTRAINT IF EXISTS subledger_journal_id_fkey;

-- Add the correct foreign key constraint pointing to journal_header
ALTER TABLE subledger ADD CONSTRAINT subledger_journal_id_fkey 
    FOREIGN KEY (journal_id) REFERENCES journal_header(id);