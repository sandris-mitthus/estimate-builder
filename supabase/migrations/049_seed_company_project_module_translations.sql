-- Seed company project form and module management translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('actions.creating', 'common', '', 'Izveido…', 'Creating...'),
    ('common.module', 'common', '', 'Modulis', 'Module'),
    ('common.project', 'common', '', 'Projekts', 'Project'),
    ('validation.address_required', 'validation', '', 'Ievadi adresi.', 'Enter an address.'),
    ('validation.module_required', 'validation', '', 'Izvēlies moduli.', 'Choose a module.'),

    ('projects.edit.title', 'projects', '', 'Labot projektu', 'Edit project'),
    ('projects.create.title', 'projects', '', 'Jauns projekts', 'New project'),
    ('projects.form.description', 'projects', '', 'Ievadi pasūtītāja kontaktinformāciju', 'Enter customer contact information'),
    ('projects.validation.client_name_required', 'projects', '', 'Ievadi pasūtītāja vārdu un uzvārdu.', 'Enter the customer first and last name.'),
    ('projects.client_name', 'projects', '', 'Pasūtītāja vārds, uzvārds', 'Customer first and last name'),
    ('projects.create.submit', 'projects', '', 'Izveidot projektu', 'Create project'),

    ('modules.edit.title', 'modules', '', 'Labot moduli', 'Edit module'),
    ('modules.feedback.deleted', 'modules', '', 'Modulis dzēsts.', 'Module deleted.'),
    ('modules.delete.title', 'modules', '', 'Dzēst moduli?', 'Delete module?'),
    ('modules.delete.confirm_prefix', 'modules', '', 'Vai tiešām vēlies dzēst moduli', 'Are you sure you want to delete module'),
    ('modules.visualizations.title', 'modules', '', 'Vizualizācijas', 'Visualizations'),
    ('modules.visualizations.drag', 'modules', '', 'Pārvietot vizualizācijas bloku', 'Move visualization block'),
    ('modules.visualizations.empty', 'modules', '', 'Nav vizualizāciju.', 'No visualizations.'),
    ('modules.visualizations.upload_hint', 'modules', '', 'Tikai attēli: PNG, JPG, WEBP, GIF · max 10 MB', 'Images only: PNG, JPG, WEBP, GIF · max 10 MB'),
    ('modules.project_files.drag', 'modules', '', 'Pārvietot projekta bloku', 'Move project block'),
    ('modules.project_files.empty', 'modules', '', 'Nav projekta failu.', 'No project files.'),
    ('modules.project_files.upload_hint', 'modules', '', 'Tikai PDF faili · max 20 MB', 'PDF files only · max 20 MB'),
    ('modules.project_description.feedback.saved', 'modules', '', 'Projekta apraksts saglabāts.', 'Project description saved.'),

    ('errors.file_required', 'errors', '', 'Izvēlies failu.', 'Choose a file.'),
    ('errors.module_delete_failed', 'errors', '', 'Neizdevās dzēst moduli.', 'Failed to delete module.'),
    ('errors.module_save_failed', 'errors', '', 'Neizdevās saglabāt moduli.', 'Failed to save module.'),
    ('errors.file_upload_failed', 'errors', '', 'Neizdevās augšupielādēt failu.', 'Failed to upload file.')
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
