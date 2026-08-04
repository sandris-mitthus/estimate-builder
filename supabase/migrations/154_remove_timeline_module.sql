-- Remove Termiņu grafiks (module_timeline): table, module flag, permissions, unique translations.

drop table if exists public.company_timeline_entries;

delete from public.site_frontend_modules
where module_key = 'module_timeline';

update public.site_user_groups
set
  permissions =
    (permissions #- '{nav,timeline}') #- '{actions,timeline.manage}',
  updated_at = now()
where permissions ? 'nav'
   or permissions ? 'actions';

update public.company_user_groups
set
  permissions =
    (permissions #- '{nav,timeline}') #- '{actions,timeline.manage}',
  updated_at = now()
where permissions ? 'nav'
   or permissions ? 'actions';

delete from public.site_translations
where namespace = 'timeline'
   or translation_key in (
     'nav.timeline',
     'permissions.nav.timeline',
     'permissions.actions.timeline.manage',
     'errors.timeline_entry_not_found',
     'errors.timeline_save_failed'
   )
   or translation_key like 'timeline.%';
