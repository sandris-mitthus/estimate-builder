-- Normalize system UI translation keys and remove duplicated generic labels.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('actions.add', 'common', '', 'Pievienot', 'Add'),
    ('actions.cancel', 'common', '', 'Atcelt', 'Cancel'),
    ('actions.close', 'common', '', 'Aizvērt', 'Close'),
    ('actions.continue', 'common', '', 'Turpināt', 'Continue'),
    ('actions.create', 'common', '', 'Izveidot', 'Create'),
    ('actions.creating', 'common', '', 'Veido…', 'Creating...'),
    ('actions.delete', 'common', '', 'Dzēst', 'Delete'),
    ('actions.deleting', 'common', '', 'Dzēš…', 'Deleting...'),
    ('actions.edit', 'common', '', 'Labot', 'Edit'),
    ('actions.end', 'common', '', 'Izbeigt', 'End'),
    ('actions.save', 'common', '', 'Saglabāt', 'Save'),
    ('actions.saving', 'common', '', 'Saglabā…', 'Saving...'),
    ('common.active', 'common', '', 'Aktīva', 'Active'),
    ('common.code', 'common', '', 'Kods', 'Code'),
    ('common.key', 'common', '', 'Key', 'Key'),
    ('common.language', 'common', '', 'Valoda', 'Language'),
    ('common.namespace', 'common', '', 'Namespace', 'Namespace'),

    ('modal.confirm_exit.title', 'modal', '', 'Izbeigt darbību?', 'End action?'),
    ('modal.confirm_exit.description', 'modal', '', 'Vai vēlaties izbeigt šo darbību?', 'Do you want to end this action?'),

    ('site_user_groups.feedback.created', 'site_user_groups', '', 'Grupa izveidota.', 'Group created.'),
    ('site_user_groups.feedback.permissions_saved', 'site_user_groups', '', 'Sistēmas grupas tiesības saglabātas.', 'System group permissions saved.'),
    ('site_user_groups.feedback.deleted', 'site_user_groups', '', 'Grupa dzēsta.', 'Group deleted.'),
    ('site_user_groups.empty', 'site_user_groups', '', 'Nav atrasta neviena sistēmas grupa.', 'No system groups found.'),
    ('site_user_groups.create.title', 'site_user_groups', '', 'Jauna grupa', 'New group'),
    ('site_user_groups.create.description', 'site_user_groups', '', 'Izveido sistēmas grupu un pēc tam izvēlies tās tiesības zemāk.', 'Create a system group and then choose its permissions below.'),
    ('site_user_groups.create.action', 'site_user_groups', '', 'Izveidot grupu', 'Create group'),
    ('site_user_groups.delete.named_action', 'site_user_groups', '', 'Dzēst grupu {name}', 'Delete group {name}'),
    ('site_user_groups.card.eyebrow', 'site_user_groups', '', 'Sistēmas default grupa', 'System default group'),
    ('site_user_groups.permissions.save', 'site_user_groups', '', 'Saglabāt grupas tiesības', 'Save group permissions'),
    ('site_user_groups.delete.title', 'site_user_groups', '', 'Dzēst grupu?', 'Delete group?'),
    ('site_user_groups.delete.confirm_prefix', 'site_user_groups', '', 'Vai tiešām dzēst grupu', 'Are you sure you want to delete group'),
    ('user_groups.name_placeholder', 'user_groups', '', 'Piemēram, Projektu vadītājs', 'For example, Project manager'),

    ('site_translations.create.action', 'site_translations', '', 'Jauns tulkojums', 'New translation')
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

delete from public.site_translations
where translation_key in (
  'common.add',
  'common.delete',
  'common.deleting',
  'common.save',
  'common.saving',
  'site_settings.page.title',
  'site_languages.page.title',
  'site_languages.table.language',
  'site_languages.table.code',
  'site_languages.table.active',
  'site_translations.page.title',
  'site_translations.create.button',
  'site_translations.edit.action',
  'site_translations.delete.action',
  'site_translations.edit.title',
  'site_translations.create.title',
  'site_user_groups.page.title'
);
