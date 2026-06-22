-- Seed settings and unsaved-navigation translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('units.days', 'units', '', 'dienas', 'days'),
    ('settings.bank_account_placeholder', 'settings', '', 'LV… IBAN', 'LV... IBAN'),
    ('unsaved_changes.title', 'common', '', 'Doties prom nesaglabājot?', 'Leave without saving?'),
    (
      'unsaved_changes.description',
      'common',
      '',
      'Vai tiešām vēlies doties prom nesaglabājot? Visi dati tiks pazaudēti, ja netiks saglabāts!',
      'Are you sure you want to leave without saving? Unsaved changes will be lost!'
    ),
    ('unsaved_changes.stay', 'common', '', 'Turpināt rediģēt', 'Keep editing'),
    ('unsaved_changes.leave', 'common', '', 'Doties prom', 'Leave')
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
