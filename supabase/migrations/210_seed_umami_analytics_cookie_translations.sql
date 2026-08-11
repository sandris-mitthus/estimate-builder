-- Umami analytics: cookie consent copy + registry entries (lv + en).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'cookie_consent.category.analytics.description',
      'cookie_consent',
      'Analytics cookie category description',
      'Ļauj anonīmi mērīt sistēmas lietojumu ar Umami, lai uzlabotu funkcionalitāti. Ieslēdzas tikai ar tavu piekrišanu.',
      'They allow anonymous measurement of how the system is used with Umami so we can improve it. They are enabled only with your consent.'
    ),
    (
      'legal.cookies.categories.p1',
      'legal',
      'Cookie policy categories intro paragraph',
      'Obligātās sīkdatnes nodrošina pieslēgšanos, drošību, izvēlēto valodu un tavas piekrišanas saglabāšanu. Preferenču sīkdatnes atceras saskarnes izvēles. Statistikas sīkdatnes (Umami) mēra anonīmu lietojumu tikai ar tavu piekrišanu. Mārketinga sīkdatnes šobrīd sistēmā netiek izmantotas.',
      'Necessary cookies provide sign-in, security, the selected language and storing your consent. Preference cookies remember interface choices. Statistics cookies (Umami) measure anonymous usage only with your consent. Marketing cookies are not currently used in the system.'
    ),
    (
      'legal.cookies.table.umami.purpose',
      'legal',
      'Cookie registry purpose for Umami analytics',
      'Anonīma lapu apmeklējumu un lietojuma statistika (Umami Cloud), lai uzlabotu sistēmu.',
      'Anonymous page-view and usage statistics (Umami Cloud) to improve the system.'
    ),
    (
      'legal.cookies.table.umami.retention',
      'legal',
      'Cookie registry retention for Umami analytics',
      'Līdz 24 mēnešiem vai līdz piekrišanas atsaukšanai',
      'Up to 24 months or until consent is withdrawn'
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
