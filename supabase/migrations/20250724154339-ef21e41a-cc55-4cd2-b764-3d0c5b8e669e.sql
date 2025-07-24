-- Remove RLS policies from subledger table
DROP POLICY IF EXISTS "Users can manage subledger entries for their organization" ON subledger;

-- Disable RLS on subledger table
ALTER TABLE subledger DISABLE ROW LEVEL SECURITY;