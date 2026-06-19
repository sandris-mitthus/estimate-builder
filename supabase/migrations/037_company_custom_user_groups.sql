-- Company custom user groups.
-- Keep only Administrator and Viewer as protected defaults; other legacy groups
-- become company-owned groups, or are removed when unused.

update public.user_groups
set is_system = false
where slug in ('manager', 'materials');

update public.company_user_groups
set is_system = false
where slug in ('manager', 'materials');

delete from public.company_user_groups company_group
where company_group.slug in ('manager', 'materials')
  and not exists (
    select 1
    from public.company_group_members membership
    where membership.company_id = company_group.company_id
      and membership.group_id = company_group.id
  );
