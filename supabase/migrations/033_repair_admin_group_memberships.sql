-- Repair admin group permissions and ensure all auth users belong to admin when unassigned

update public.user_groups
set permissions = '{"nav":{"projects":true,"modules":true,"estimate":true,"positions":true,"excluded_positions":true,"users":true,"user_groups":true,"settings":true},"actions":{"project.create":true,"project.edit":true,"project.delete":true,"project.approve":true,"project.reject":true,"project.complete":true,"estimate.save":true,"estimate.export":true,"estimate.dates":true,"sagatave.save":true,"modules.manage":true,"positions.manage":true,"excluded_positions.manage":true,"project_module.manage":true,"users.invite":true,"users.assign_group":true,"groups.manage":true,"settings.save":true,"materials.assign":true,"materials.order":true}}'::jsonb
where slug = 'admin';

insert into public.user_group_members (user_id, group_id)
select u.id, g.id
from auth.users u
cross join public.user_groups g
where g.slug = 'admin'
  and not exists (
    select 1
    from public.user_group_members m
    where m.user_id = u.id
  )
on conflict (user_id) do nothing;
