
-- Update permission module for 'View Open PO Widget' from 'Order Management' to 'Dashboard'
UPDATE public.permissions
SET module = 'Dashboard', component = 'Dashboard'
WHERE name = 'View Open PO Widget';
