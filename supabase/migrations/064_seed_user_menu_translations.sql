with translations (translation_key, namespace, description, lv, en) as (
  values
    ('user_menu.label', 'user_menu', 'User menu aria label', 'Lietotāja izvēlne', 'User menu'),
    ('user_menu.settings', 'user_menu', 'User settings menu item', 'Lietotāja uzstādījumi', 'User settings'),
    (
      'user_menu.settings_dummy',
      'user_menu',
      'Temporary user settings frontend placeholder',
      'Lietotāja uzstādījumi būs pieejami drīzumā.',
      'User settings will be available soon.'
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
