
-- Add new columns for payment details to the general_ledger table
ALTER TABLE public.general_ledger
ADD COLUMN payment_method TEXT,
ADD COLUMN notes TEXT;

-- Insert 'Record Payment' permission for the General Ledger component
INSERT INTO public.permissions (name, module, component, description)
VALUES ('Record Payment', 'Finance', 'General Ledger', 'Allows user to record a payment in the General Ledger')
ON CONFLICT (name) DO NOTHING;

-- Create a reusable function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, p_permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id AND p.name = p_permission_name
  );
$$;
