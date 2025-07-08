-- Add missing accounting permissions to Admin-Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin-Role'
AND p.name IN (
    'View COA',
    'Create COA', 
    'Edit COA',
    'View Rules',
    'Create Rules',
    'Edit Rules',
    'Delete Rules',
    'View Journal',
    'Post Journal',
    'Reverse Journal',
    'View Subledger'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);