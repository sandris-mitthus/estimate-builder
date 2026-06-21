-- Seed reusable system/admin error translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('errors.database_not_configured', 'errors', '', 'Datubāze nav konfigurēta.', 'Database is not configured.'),
    ('errors.default_language_cannot_deactivate', 'errors', '', 'Noklusējuma valodu nevar deaktivizēt.', 'The default language cannot be deactivated.'),
    ('errors.default_language_cannot_delete', 'errors', '', 'Noklusējuma valodu nevar dzēst.', 'The default language cannot be deleted.'),
    ('errors.default_language_save_failed', 'errors', '', 'Neizdevās saglabāt noklusējuma valodu.', 'Failed to save the default language.'),
    ('errors.group_create_failed', 'errors', '', 'Neizdevās izveidot grupu.', 'Failed to create group.'),
    ('errors.group_delete_failed', 'errors', '', 'Neizdevās dzēst grupu.', 'Failed to delete group.'),
    ('errors.group_name_required', 'errors', '', 'Grupas nosaukums nav norādīts.', 'Group name is required.'),
    ('errors.group_name_too_long', 'errors', '', 'Grupas nosaukums ir pārāk garš.', 'Group name is too long.'),
    ('errors.group_not_found', 'errors', '', 'Grupa nav atrasta.', 'Group not found.'),
    ('errors.group_required', 'errors', '', 'Grupa nav norādīta.', 'Group is required.'),
    ('errors.language_code_exists', 'errors', '', 'Valoda ar šo kodu jau eksistē.', 'A language with this code already exists.'),
    ('errors.language_code_invalid', 'errors', '', 'Valodas kodam jābūt formātā lv, en vai en-US.', 'Language code must use the format lv, en, or en-US.'),
    ('errors.language_create_failed', 'errors', '', 'Neizdevās izveidot valodu.', 'Failed to create language.'),
    ('errors.language_delete_failed', 'errors', '', 'Neizdevās dzēst valodu.', 'Failed to delete language.'),
    ('errors.language_name_required', 'errors', '', 'Ievadi valodas nosaukumu.', 'Enter the language name.'),
    ('errors.language_not_active', 'errors', '', 'Valoda nav atrasta vai nav aktīva.', 'Language was not found or is not active.'),
    ('errors.language_not_found', 'errors', '', 'Valoda nav atrasta.', 'Language not found.'),
    ('errors.language_old_code_remove_failed', 'errors', '', 'Valoda saglabāta, bet veco kodu neizdevās noņemt.', 'Language was saved, but the old code could not be removed.'),
    ('errors.language_required', 'errors', '', 'Valoda nav norādīta.', 'Language is required.'),
    ('errors.language_save_failed', 'errors', '', 'Neizdevās saglabāt valodu.', 'Failed to save language.'),
    ('errors.language_status_save_failed', 'errors', '', 'Neizdevās saglabāt valodas statusu.', 'Failed to save language status.'),
    ('errors.site_group_permissions_save_failed', 'errors', '', 'Neizdevās saglabāt sistēmas grupas tiesības.', 'Failed to save system group permissions.'),
    ('errors.site_settings_save_failed', 'errors', '', 'Neizdevās saglabāt sistēmas uzstādījumus.', 'Failed to save system settings.'),
    ('errors.translation_create_failed', 'errors', '', 'Neizdevās izveidot tulkojumu.', 'Failed to create translation.'),
    ('errors.translation_delete_failed', 'errors', '', 'Neizdevās dzēst tulkojumu.', 'Failed to delete translation.'),
    ('errors.translation_key_exists', 'errors', '', 'Tulkojums ar šo key jau eksistē.', 'A translation with this key already exists.'),
    ('errors.translation_key_invalid', 'errors', '', 'Key drīkst saturēt burtus, ciparus, punktus, svītras, apakšsvītras un kolus.', 'Key may contain letters, numbers, dots, dashes, underscores, and colons.'),
    ('errors.translation_required', 'errors', '', 'Tulkojums nav norādīts.', 'Translation is required.'),
    ('errors.translation_save_failed', 'errors', '', 'Neizdevās saglabāt tulkojumu.', 'Failed to save translation.'),
    ('errors.unauthorized', 'errors', '', 'Nav autorizācijas.', 'Not authorized.')
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
