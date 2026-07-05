with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.sagatave.auto_hidden_intro.title',
      'estimate',
      'Banera virsraksts — automātiski paslēpta jauna sagataves struktūra',
      'Sagatavē ir jaunas kategorijas, subkategorijas vai pozīcijas',
      'The template has new categories, subcategories, or positions'
    ),
    (
      'estimate.sagatave.auto_hidden_intro.description',
      'estimate',
      'Banera apraksts — automātiski paslēpta sagataves struktūra',
      'Tās automātiski pievienotas šai tāmei kā paslēptas. Apskati sarakstu un apstiprini, kad iepazinies.',
      'They were automatically added to this estimate as hidden. Review the list and confirm when you are done.'
    ),
    (
      'estimate.sagatave.auto_hidden_intro.confirm',
      'estimate',
      'Banera poga — apstiprina iepazīšanos ar jauno sagataves struktūru',
      'Sapratu',
      'Got it'
    ),
    (
      'estimate.sagatave.auto_hidden_intro.category',
      'estimate',
      'Jaunas kategorijas rinda iepazīšanās blokā',
      'Kategorija: {name}',
      'Category: {name}'
    ),
    (
      'estimate.sagatave.auto_hidden_intro.subcategory',
      'estimate',
      'Jaunas subkategorijas rinda iepazīšanās blokā',
      'Subkategorija: {category} → {name}',
      'Subcategory: {category} → {name}'
    ),
    (
      'estimate.sagatave.auto_hidden_intro.position',
      'estimate',
      'Jaunas pozīcijas rinda iepazīšanās blokā',
      'Pozīcija: {category} → {name}',
      'Position: {category} → {name}'
    ),
    (
      'estimate.sagatave.auto_hidden_intro.position_in_sub',
      'estimate',
      'Jaunas pozīcijas rinda subkategorijā iepazīšanās blokā',
      'Pozīcija: {category} → {subcategory} → {name}',
      'Position: {category} → {subcategory} → {name}'
    ),
    (
      'actions.confirming',
      'actions',
      'Apstiprināšanas pogas stāvoklis',
      'Apstiprina…',
      'Confirming…'
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
