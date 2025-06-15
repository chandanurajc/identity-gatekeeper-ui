
-- Grant usage on the public schema to the authenticated role.
-- This allows authenticated users to access objects within the schema.
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant all privileges on all tables in the public schema to the authenticated role.
-- This includes SELECT, INSERT, UPDATE, DELETE.
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure that any new tables created in the public schema will also have these privileges.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;

-- Grant execute permission on all functions in the public schema to the authenticated role.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure that any new functions created in the public schema will also be executable.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
