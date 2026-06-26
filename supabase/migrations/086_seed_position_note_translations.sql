with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'positions.note.placeholder',
      'positions',
      'Position note placeholder in estimate line item modal',
      'Papildu informācija par pozīciju',
      'Additional information about the position'
    ),
    (
      'positions.validation.note_too_long',
      'positions',
      'Position note max length validation',
      'Piezīme nedrīkst būt garāka par 255 zīmēm.',
      'The note must be no longer than 255 characters.'
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
