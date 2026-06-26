-- Seed frontend modules admin UI translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('nav.system_admin.site_frontend_modules', 'navigation', '', 'Frontend moduļi', 'Frontend modules'),
    ('frontend_modules.page.subtitle', 'frontend_modules', '', 'Definē frontend moduļu atslēgas un ieslēgšanas statusu', 'Define frontend module keys and enabled status'),
    ('frontend_modules.create.title', 'frontend_modules', '', 'Jauns modulis', 'New module'),
    ('frontend_modules.create.description', 'frontend_modules', '', 'Pievieno unikālu moduļa atslēgu, piemēram `reports` vai `inventory.sync`.', 'Add a unique module key, for example `reports` or `inventory.sync`.'),
    ('frontend_modules.create.key_placeholder', 'frontend_modules', '', 'Moduļa atslēga', 'Module key'),
    ('frontend_modules.feedback.key_required', 'frontend_modules', '', 'Ievadi moduļa atslēgu.', 'Enter the module key.'),
    ('frontend_modules.feedback.created', 'frontend_modules', '', 'Modulis pievienots.', 'Module added.'),
    ('frontend_modules.feedback.status_saved', 'frontend_modules', '', 'Moduļa statuss saglabāts.', 'Module status saved.'),
    ('frontend_modules.feedback.deleted', 'frontend_modules', '', 'Modulis dzēsts.', 'Module deleted.'),
    ('frontend_modules.table.key', 'frontend_modules', '', 'Atslēga', 'Key'),
    ('frontend_modules.table.enabled', 'frontend_modules', '', 'Ieslēgts', 'Enabled'),
    ('frontend_modules.table.empty', 'frontend_modules', '', 'Nav moduļu.', 'No modules yet.'),
    ('frontend_modules.aria.enabled', 'frontend_modules', '', '{key} ieslēgts', '{key} enabled'),
    ('frontend_modules.delete.confirm_title', 'frontend_modules', '', 'Dzēst moduli?', 'Delete module?'),
    ('frontend_modules.delete.confirm_description', 'frontend_modules', '', 'Modulis {key} tiks neatgriezeniski dzēsts.', 'Module {key} will be permanently deleted.'),
    ('errors.frontend_module_key_exists', 'errors', '', 'Modulis ar šo atslēgu jau eksistē.', 'A module with this key already exists.'),
    ('errors.frontend_module_key_invalid', 'errors', '', 'Atslēgai jābūt formātā ar mazajiem burtiem, cipariem, punktiem, svītrām, apakšsvītrām un kolu.', 'Key must use lowercase letters, numbers, dots, dashes, underscores, and colons.'),
    ('errors.frontend_module_create_failed', 'errors', '', 'Neizdevās izveidot frontend moduli.', 'Failed to create frontend module.'),
    ('errors.frontend_module_delete_failed', 'errors', '', 'Neizdevās dzēst frontend moduli.', 'Failed to delete frontend module.'),
    ('errors.frontend_module_not_found', 'errors', '', 'Frontend modulis nav atrasts.', 'Frontend module not found.'),
    ('errors.frontend_module_status_save_failed', 'errors', '', 'Neizdevās saglabāt moduļa statusu.', 'Failed to save module status.')
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
