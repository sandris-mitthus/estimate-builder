-- Shorten planned profit export hint copy.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.planned_profit.export_hint',
      'estimate',
      'Hint under PDF and Excel export when planned profit is missing',
      'Piedāvājums un tāme tiks eksportēti bez plānotās peļņas',
      'The offer and estimate will be exported without planned profit'
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
