-- Shorten additional work section description (lv + en).

with translations (translation_key, lv, en) as (
  values
    (
      'additional_work.section.description',
      'Darbi, kas radušies procesā un nav iekļauti līguma tāmē.',
      'Work that arose during the project and is not in the contract estimate.'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  'additional_work',
  'Explains additional work estimates',
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  values = public.site_translations.values || excluded.values,
  updated_at = now();
