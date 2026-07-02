-- Ensure company Administrators profile can delete projects.

update public.site_user_groups
set
  permissions = jsonb_set(
    permissions,
    '{actions,project.delete}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'admin';

update public.company_user_groups
set
  permissions = jsonb_set(
    permissions,
    '{actions,project.delete}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'admin'
  and is_system = true;
