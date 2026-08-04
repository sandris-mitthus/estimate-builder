-- Accidental removal of Laika grafiks (module_timeline_graph).
-- Restored by 155_restore_timeline_graph_module.sql. Kept for migration history only.

drop table if exists public.company_timeline_graph_order;

delete from public.site_frontend_modules
where module_key = 'module_timeline_graph';

update public.site_user_groups
set
  permissions =
    (permissions #- '{nav,timeline_graph}') #- '{actions,timeline_graph.manage}',
  updated_at = now()
where permissions ? 'nav'
   or permissions ? 'actions';

update public.company_user_groups
set
  permissions =
    (permissions #- '{nav,timeline_graph}') #- '{actions,timeline_graph.manage}',
  updated_at = now()
where permissions ? 'nav'
   or permissions ? 'actions';

delete from public.site_translations
where namespace = 'timeline_graph'
   or translation_key in (
     'nav.timeline_graph',
     'permissions.nav.timeline_graph',
     'permissions.actions.timeline_graph.manage',
     'errors.timeline_graph_projects_required'
   )
   or translation_key like 'timeline_graph.%';
