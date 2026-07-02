with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.attention.enable',
      'estimate',
      'Enable attention flag on sagatave position',
      'Ieslēgt īpašo uzmanību',
      'Enable special attention'
    ),
    (
      'estimate.attention.disable',
      'estimate',
      'Disable attention flag on sagatave position',
      'Izslēgt īpašo uzmanību',
      'Disable special attention'
    ),
    (
      'estimate.attention.enabled',
      'estimate',
      'Attention flag is on',
      'Īpaša uzmanība ieslēgta (piem. ierobežots budžets)',
      'Special attention enabled (e.g. restricted budget)'
    ),
    (
      'estimate.attention.disabled',
      'estimate',
      'Attention flag is off',
      'Atzīmēt pozīciju ar īpašu uzmanību',
      'Mark position for special attention'
    ),
    (
      'estimate.sagatave.change_field.requires_attention',
      'estimate',
      'Sagatave sync field: requires attention',
      'Īpaša uzmanība',
      'Special attention'
    ),
    (
      'estimate.sagatave.change_field.multi_requires_attention',
      'estimate',
      'Sagatave sync field: multi requires attention',
      'Multi īpaša uzmanība',
      'Multi special attention'
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
