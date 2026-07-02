-- Planned profit missing / zero informational notices in project estimate UI.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.planned_profit.missing_notice',
      'estimate',
      'Warning when planned profit is empty or zero before estimate table',
      'Plānotā peļņa nav norādīta vai ir 0%. Vai tiešām vēlaties turpināt bez plānotās peļņas? Visas summas tabulā tiek rādītas bez peļņas piemērošanas.',
      'Planned profit is not set or is 0%. Do you really want to continue without planned profit? All amounts in the table are shown without profit applied.'
    ),
    (
      'estimate.planned_profit.export_hint',
      'estimate',
      'Hint under PDF and Excel export when planned profit is missing',
      'Piedāvājums un tāme tiks eksportēti bez plānotās peļņas — summas atbilst tabulā redzamajām.',
      'The offer and estimate export will not include planned profit — amounts match what you see in the table.'
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
