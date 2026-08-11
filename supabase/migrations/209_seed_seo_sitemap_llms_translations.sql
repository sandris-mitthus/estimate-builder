-- SEO: human sitemap page + llms.txt UI strings (lv + en).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'sitemap.title',
      'sitemap',
      'HTML site map page title and footer link',
      'Lapas karte',
      'Site map'
    ),
    (
      'sitemap.description',
      'sitemap',
      'HTML site map page description',
      'Visas publiskās lapas — sākums, dokumentācija un juridiskā informācija.',
      'All public pages — home, documentation and legal information.'
    ),
    (
      'sitemap.section.pages',
      'sitemap',
      'Heading above public page links on the HTML site map',
      'Publiskās lapas',
      'Public pages'
    ),
    (
      'sitemap.section.machine',
      'sitemap',
      'Heading above robots/sitemap/llms links on the HTML site map',
      'Meklētājiem un AI',
      'For search engines and AI'
    ),
    (
      'sitemap.pages.home',
      'sitemap',
      'Site map label for the home page',
      'Sākums',
      'Home'
    ),
    (
      'sitemap.pages.docs',
      'sitemap',
      'Site map label for documentation',
      'Dokumentācija',
      'Documentation'
    ),
    (
      'llms.summary',
      'llms',
      'Fallback blockquote summary in /llms.txt when slogan is empty',
      'Tāmju un piedāvājumu programmatūra būvniecībai: atkārtoti lietojama sagatave, kopīgs izcenojumu katalogs, PDF/Excel piedāvājumi un materiālu pasūtīšana pēc apstiprināšanas.',
      'Construction estimate and offer software: reusable templates, a shared price catalog, PDF/Excel offers, and material ordering after approval.'
    ),
    (
      'llms.details',
      'llms',
      'Paragraph under the summary in /llms.txt',
      'Zemāk norādītās publiskās lapas ir drošas indeksēšanai un citēšanai. Lietotāja zonā aiz pierakstīšanās (projekti, tāmes, katalogs, administrācija) nav iekļauta un to nevajadzētu pārmeklēt.',
      'Public pages below are safe for indexing and citation. Application areas behind login (projects, estimates, catalog, admin) are not listed and should not be crawled.'
    ),
    (
      'llms.note.home',
      'llms',
      'Note for the home link in /llms.txt',
      'Mārketinga sākumlapa un produkta pārskats',
      'Marketing landing and product overview'
    ),
    (
      'llms.note.docs',
      'llms',
      'Note for the docs link in /llms.txt',
      'Produkta dokumentācija',
      'Product documentation'
    ),
    (
      'llms.note.sitemap',
      'llms',
      'Note for the HTML site map link in /llms.txt Optional section',
      'Cilvēkiem lasāma lapas karte',
      'Human-readable site map'
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
