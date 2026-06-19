-- Company user access management permission.

update public.company_user_groups
set permissions = jsonb_set(
  permissions,
  '{actions,users.manage_company_access}',
  case when slug = 'admin' then 'true'::jsonb else 'false'::jsonb end,
  true
);

update public.user_groups
set permissions = jsonb_set(
  permissions,
  '{actions,users.manage_company_access}',
  case when slug = 'admin' then 'true'::jsonb else 'false'::jsonb end,
  true
);
