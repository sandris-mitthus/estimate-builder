-- Public docs get-started overview + richer seed articles.

insert into public.site_doc_categories (id, title, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Sākt šeit', 10),
  ('22222222-2222-4222-8222-222222222222', 'Projekti un tāmes', 20),
  ('33333333-3333-4333-8333-333333333333', 'Sagatave un katalogs', 30),
  ('44444444-4444-4444-8444-444444444444', 'Eksports un komanda', 40),
  ('55555555-5555-4555-8555-555555555555', 'Pēc apstiprināšanas', 50)
on conflict (id) do update
set
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.site_docs (id, category_id, title, description, sort_order)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Tipiska darba plūsma',
    E'Ikdienā sistēma tiek lietota šādā secībā: sagatave un katalogs → projekts → tāmes pielāgošana → piedāvājuma eksports.\n\n- Uzturi vienu atkārtoti lietojamu tāmes sagatavi un cenu katalogu.\n- Jaunam darbam izveido projektu un saņem tāmi no sagataves.\n- Pielāgo pozīcijas, daudzumus un redzamību konkrētajam klientam.\n- Eksportē PDF piedāvājumu vai Excel tāmi.\n\nJa projekts tiek apstiprināts, turpini ar materiālu sarakstu, uzdevumiem un laika grafiku tajā pašā sistēmā.',
    10
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
    '11111111-1111-4111-8111-111111111111',
    'Kam šī sistēma der?',
    E'Estimate Builder ir paredzēts būvniecības uzņēmumiem, kas regulāri gatavo tāmes un klientu piedāvājumus.\n\n- Estimatori un projektu vadītāji, kuriem vajag ātru, atkārtojamu aprēķinu.\n- Komandas, kas grib vienu katalogu un vienu sagatavi visiem projektiem.\n- Uzņēmumi, kuriem pēc līguma vajag materiālu un darbu kontroli, ne tikai piedāvājuma PDF.\n\nSistēma noder visvairāk tad, kad līdzīgi objekti atkārtojas un struktūra var tikt atkārtoti izmantota.',
    20
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Projekta dzīves cikls',
    E'Projekts ir vieta, kur sagatave kļūst par reālu piedāvājumu.\n\n- Izveido projektu, aizpildi klienta un objekta datus.\n- Sistēma nokopē tāmi no sagataves, lai sāktu ar gatavu struktūru.\n- Piesaisti ēkas moduli, ja daudzumi nāk no tipveida izmēriem.\n- Aktīvos projektus turi galvenajā sarakstā; pabeigtos vari pārcelt arhīvā.\n\nLīdzīgam nākamajam darbam vari kopēt esošu projektu, nevis sākt no nulles.',
    10
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc',
    '22222222-2222-4222-8222-222222222222',
    'Tāmes redaktors',
    E'Tāmes redaktors ir Excel tipa tabula ar kategorijām, apakškategorijām un pozīcijām.\n\n- Pārkārto pozīcijas ar drag-and-drop.\n- Saloki sadaļas, lai vieglāk strādātu ar lielām tāmēm.\n- Kopsummas pārrēķinās, kamēr ievadi daudzumus un cenas.\n- Multi-pozīcijas ļauj vienā rindā turēt vairākas izvēles.\n\nProjektā vari pielāgot sagataves struktūru konkrētajam piedāvājumam, nesabojājot uzņēmuma bāzes sagatavi.',
    20
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd',
    '22222222-2222-4222-8222-222222222222',
    'Papildu darbi',
    E'Papildu darbi ir atsevišķas tāmes ārpus pamatlīguma.\n\n- Izveido papildu darbu ar datumu un manuāliem daudzumiem.\n- Tās neaizstāj pamata projekta tāmi, bet papildina to.\n- Dzēšanai ir apstiprinājums, lai nejauši nezaudētu datus.\n\nIzmanto, kad klientam vajag papildu pozīcijas pēc galvenā piedāvājuma.',
    30
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '33333333-3333-4333-8333-333333333333',
    'Tāmes sagatave',
    E'Sagatave nosaka pozīcijas, aprēķinu un piedāvājuma struktūru.\n\n- Definē kategorijas, apakškategorijas un pozīcijas vienreiz.\n- Pozīcijā norādi laika normu, materiālus un mehānismus.\n- Darba izmaksas nāk no laika normas un stundas likmes.\n- Materiālu un mehānismu cenas nāk no kataloga.\n\nJaunā projekta tāme sākas no šīs sagataves; projektā to var pielāgot, bet bāze paliek atkārtoti lietojama.',
    10
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccd',
    '33333333-3333-4333-8333-333333333333',
    'Cenu katalogs',
    E'Katalogs ir uzņēmuma vienotais materiālu un mehānismu cenu avots.\n\n- Uzturi vienības cenas, piegādātājus un cenu vēsturi.\n- Kad katalogā cena mainās, projektā redzi novecojušās pozīcijas.\n- Tāmes paliek saistītas ar katalogu, nevis ar izkaisītiem manuāliem skaitļiem.\n\nTas palīdz turēt piedāvājumus aktuālus, nemeklējot cenas katrā projektā atsevišķi.',
    20
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-ccccccccccce',
    '33333333-3333-4333-8333-333333333333',
    'Ēku moduļi un apjomi',
    E'Ēku modulis apraksta ēkas tipu, vizuālos materiālus un aprēķinu izmērus.\n\n- Saglabā rasējumus, PDF un mērījumus (arī sanitārās telpas).\n- Piesaisti tāmes pozīcijas moduļa lielumiem, lai daudzumi atjaunotos automātiski.\n- Apjomus vari kombinēt ar +/- vai ×2.\n\nPiemēram, ja modulī ir sienu platība, pozīcija var ņemt daudzumu no tās, nevis pārrakstīt manuāli katrā projektā.',
    30
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccf',
    '33333333-3333-4333-8333-333333333333',
    'Materiāla patēriņš',
    E'Ja pozīcijas mērvienība atšķiras no materiāla mērvienības, izmanto lauku „Patēriņš”.\n\n- Tas nozīmē: cik materiāla vienību vajag uz vienu pozīcijas vienību.\n- Formula: materiāla vienības cena × patēriņš = izmaksas uz 1 pozīcijas vienību.\n- Ja mērvienības sakrīt, patēriņš ir 1 un lauks netiek rādīts.\n\nPiemērs: pozīcija m², līste m par 2.50 EUR/m, patēriņš 1.8 → 4.50 EUR/m².',
    40
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '44444444-4444-4444-8444-444444444444',
    'PDF un Excel eksports',
    E'No projekta vari sagatavot dokumentus klientam un iekšējai kontrolei.\n\n- PDF piedāvājums ar uzņēmuma datiem, logo un vizualizācijām.\n- Excel tāme ar pilnu cenu sadalījumu un PVN.\n- Piedāvājumā vari paslēpt pozīcijas vai cenas, atstājot tikai kopsummu.\n- Vari turēt arī darbu sarakstu, kas piedāvājumā nav iekļauti.\n\nTā no vienas tāmes iegūsti gan klienta dokumentu, gan iekšējo aprēķinu.',
    10
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddde',
    '44444444-4444-4444-8444-444444444444',
    'Komanda un pieejas',
    E'Vairāki uzņēmumi un lietotāji var strādāt vienā sistēmā ar grupu tiesībām.\n\n- Lietotāju grupas nosaka, ko katrs redz un drīkst darīt.\n- Uzaicinājumi un pieejas bloķēšana palīdz pārvaldīt komandu.\n- Jaunam lietotājam bez uzņēmuma jāreģistrē uzņēmums pirms darba sākšanas.\n\nSistēmas administrators pārvalda uzņēmumus, valodas, tulkojumus un publisko dokumentāciju.',
    20
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '55555555-5555-4555-8555-555555555555',
    'Materiālu saraksts',
    E'Apstiprinātā projektā materiālu saraksts rāda, kas vēl jāpasūta.\n\n- Katrai pozīcijai redzi budžeta cenu un pasūtīts / nav pasūtīts statusu.\n- Materiālus vari deleģēt konkrētiem cilvēkiem.\n- Atgādinājuma baneris paliek, kamēr viss nav pasūtīts.\n\nTas palīdz pāriet no piedāvājuma uz iepirkumu bez atsevišķas izklājlapas.',
    10
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeef',
    '55555555-5555-4555-8555-555555555555',
    'Uzdevumi, darbinieki un grafiks',
    E'Pēc tāmes sistēma palīdz organizēt izpildi.\n\n- Personīgie uzdevumu dēļi komandas darbiem.\n- Darbinieku katalogs ar fotogrāfijām.\n- Instrumentu inventārs ar nodošanas vēsturi.\n- Laika grafiks ar projekta prioritāti, cilvēku skaitu un pārklājošiem projektiem.\n\nMērķis: turēt tāmi, materiālus un izpildes plānu vienā vietā.',
    20
  )
on conflict (id) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'wiki.docs.subtitle',
      'wiki',
      'Public docs sidebar subtitle',
      'Īss ceļvedis, ko ar sistēmu var izdarīt no projekta līdz piedāvājumam.',
      'A short guide to what you can do in the system from project to offer.'
    ),
    (
      'wiki.docs.get_started.nav',
      'wiki',
      'Public docs get started nav item',
      'Sākt šeit',
      'Get started'
    ),
    (
      'wiki.docs.get_started.eyebrow',
      'wiki',
      'Public docs get started eyebrow',
      'Sākt šeit',
      'Get started'
    ),
    (
      'wiki.docs.get_started.title',
      'wiki',
      'Public docs get started title',
      'Ko ar sistēmu var izdarīt?',
      'What can you do with the system?'
    ),
    (
      'wiki.docs.get_started.body_1',
      'wiki',
      'Public docs get started first paragraph',
      'Estimate Builder ir darba vide būvniecības uzņēmumiem: vienā vietā uzturi tāmes sagatavi un cenu katalogu, no tiem ātri izveido projekta piedāvājumu un eksportē PDF vai Excel.',
      'Estimate Builder is a workspace for construction companies: keep one estimate template and price catalog, turn them into a project offer quickly, and export PDF or Excel.'
    ),
    (
      'wiki.docs.get_started.body_2',
      'wiki',
      'Public docs get started second paragraph',
      'Šī dokumentācija īsi izskaidro galvenās darbības. Izvēlies tēmu sānjoslā vai zemāk, lai izlasītu detalizētāku aprakstu.',
      'This documentation briefly explains the main workflows. Pick a topic in the sidebar or below to read a more detailed description.'
    ),
    (
      'wiki.docs.capabilities.title',
      'wiki',
      'Public docs capabilities section title',
      'Galvenās iespējas',
      'Key capabilities'
    ),
    (
      'wiki.docs.capabilities.projects.title',
      'wiki',
      'Public docs capability projects title',
      'Projekti un piedāvājumi',
      'Projects and offers'
    ),
    (
      'wiki.docs.capabilities.projects.description',
      'wiki',
      'Public docs capability projects description',
      'Izveido projektu ar klienta datiem, saņem tāmi no sagataves un pielāgo konkrētajam objektam.',
      'Create a project with client details, get an estimate from the template, and adapt it to the specific object.'
    ),
    (
      'wiki.docs.capabilities.template.title',
      'wiki',
      'Public docs capability template title',
      'Atkārtoti lietojama sagatave',
      'Reusable template'
    ),
    (
      'wiki.docs.capabilities.template.description',
      'wiki',
      'Public docs capability template description',
      'Vienreiz uzbūvē tāmes struktūru; jaunie projekti sākas no tās, nevis no tukšas tabulas.',
      'Build the estimate structure once; new projects start from it instead of an empty table.'
    ),
    (
      'wiki.docs.capabilities.catalog.title',
      'wiki',
      'Public docs capability catalog title',
      'Cenu katalogs',
      'Price catalog'
    ),
    (
      'wiki.docs.capabilities.catalog.description',
      'wiki',
      'Public docs capability catalog description',
      'Materiālu un mehānismu cenas vienā katalogā; sistēma brīdina, kad tāmēs cenas novecojušas.',
      'One catalog for material and mechanism prices; the system warns when estimate prices are outdated.'
    ),
    (
      'wiki.docs.capabilities.modules.title',
      'wiki',
      'Public docs capability modules title',
      'Ēku moduļi',
      'Building modules'
    ),
    (
      'wiki.docs.capabilities.modules.description',
      'wiki',
      'Public docs capability modules description',
      'Piesaisti daudzumus ēkas tipam un izmēriem, lai apjomi projektā atjaunotos automātiski.',
      'Link quantities to a building type and sizes so project volumes update automatically.'
    ),
    (
      'wiki.docs.capabilities.exports.title',
      'wiki',
      'Public docs capability exports title',
      'PDF un Excel',
      'PDF and Excel'
    ),
    (
      'wiki.docs.capabilities.exports.description',
      'wiki',
      'Public docs capability exports description',
      'Klienta PDF piedāvājums ar zīmolu un detalizēta Excel tāme iekšējai pārbaudei.',
      'A branded PDF offer for the client and a detailed Excel estimate for internal review.'
    ),
    (
      'wiki.docs.capabilities.delivery.title',
      'wiki',
      'Public docs capability delivery title',
      'Pēc apstiprināšanas',
      'After approval'
    ),
    (
      'wiki.docs.capabilities.delivery.description',
      'wiki',
      'Public docs capability delivery description',
      'Materiālu saraksts, uzdevumi, darbinieki, instrumenti un laika grafiks vienā sistēmā.',
      'Material list, tasks, workers, tools, and schedule in one system.'
    ),
    (
      'wiki.docs.index.title',
      'wiki',
      'Public docs browse section title',
      'Detalizētākas tēmas',
      'More detailed topics'
    ),
    (
      'wiki.docs.index.subtitle',
      'wiki',
      'Public docs browse section subtitle',
      'Izvēlies rakstu, lai uzzinātu vairāk par konkrētu darbību vai aprēķinu loģiku.',
      'Choose an article to learn more about a specific workflow or calculation logic.'
    ),
    (
      'wiki.docs.article.back_to_list',
      'wiki',
      'Public docs back to overview button',
      'Atpakaļ uz pārskatu',
      'Back to overview'
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
