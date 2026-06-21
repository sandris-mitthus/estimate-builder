-- Remove legacy default groups that were kept as company-owned groups.
-- Current defaults are only Administrators and Skatītājs; custom company groups
-- use their own slugs and are not affected by this cleanup.

with legacy_groups as (
  select company_id, id
  from public.company_user_groups
  where slug in ('manager', 'materials')
),
viewer_groups as (
  select company_id, id
  from public.company_user_groups
  where slug = 'viewer'
)
update public.company_group_members membership
set
  group_id = viewer_groups.id,
  updated_at = now()
from legacy_groups
join viewer_groups on viewer_groups.company_id = legacy_groups.company_id
where membership.company_id = legacy_groups.company_id
  and membership.group_id = legacy_groups.id;

delete from public.company_user_groups legacy_group
where legacy_group.slug in ('manager', 'materials')
  and not exists (
    select 1
    from public.company_group_members membership
    where membership.company_id = legacy_group.company_id
      and membership.group_id = legacy_group.id
  );
