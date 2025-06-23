
-- Move "View Open PO Widget" permission from Order Management to Dashboard module under Purchase Orders component
UPDATE public.permissions
SET module = 'Dashboard', component = 'Purchase Orders'
WHERE name = 'View Open PO Widget';

-- Remove email column from profiles table if it exists
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
