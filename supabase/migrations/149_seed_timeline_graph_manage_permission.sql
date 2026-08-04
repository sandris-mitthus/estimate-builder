-- Least privilege: timeline_graph.manage for priority reorder (view-only without it).

update public.site_user_groups
set
  permissions = jsonb_set(
    permissions,
    '{actions,timeline_graph.manage}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'admin';

update public.site_user_groups
set
  permissions = jsonb_set(
    permissions,
    '{actions,timeline_graph.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer';

update public.company_user_groups
set
  permissions = jsonb_set(
    permissions,
    '{actions,timeline_graph.manage}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'admin'
  and is_system = true;

update public.company_user_groups
set
  permissions = jsonb_set(
    permissions,
    '{actions,timeline_graph.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer'
  and is_system = true;

-- Custom company groups: default false unless they already manage the deadline timeline.
update public.company_user_groups
set
  permissions = jsonb_set(
    permissions,
    '{actions,timeline_graph.manage}',
    coalesce(permissions #> '{actions,timeline.manage}', 'false'::jsonb),
    true
  ),
  updated_at = now()
where is_system = false
  and permissions #> '{actions,timeline_graph.manage}' is null;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'permissions.actions.timeline_graph.manage',
      'permissions',
      'Change timeline graph project priority order',
      'Mainīt laika grafika prioritāti',
      'Change timeline graph priority'
    ),
    (
      'permissions.actions.timeline.manage',
      'permissions',
      'Manage deadline timeline permission',
      'Pārvaldīt termiņu grafiku',
      'Manage deadline schedule'
    ),
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas.',
      'Collapse a project to one row, or expand categories and subcategories.'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();
