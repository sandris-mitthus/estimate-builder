-- Seed public wiki page translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'auth.login.view_system_wiki',
      'auth',
      'Login page link to the public system wiki',
      'Ko var darīt sistēmā?',
      'What can you do in the system?'
    ),
    (
      'wiki.metadata.title',
      'wiki',
      'Public wiki metadata title',
      'Sistēmas iespējas',
      'System capabilities'
    ),
    (
      'wiki.metadata.description',
      'wiki',
      'Public wiki metadata description',
      'Pārskats par tāmes veidošanu, ēku moduļiem, pozīciju katalogu un piedāvājumu eksportu.',
      'Overview of estimate building, building modules, position catalog, and offer exports.'
    ),
    (
      'wiki.hero.title',
      'wiki',
      'Public wiki hero title',
      'Tāmes un piedāvājumi no viena darba procesa',
      'Estimates and offers from one workflow'
    ),
    (
      'wiki.hero.description',
      'wiki',
      'Public wiki hero description',
      'Estimate Builder palīdz būvniecības komandām sagatavot projektus, uzturēt pozīciju katalogu, aprēķināt izmaksas un izveidot klientam saprotamu piedāvājumu.',
      'Estimate Builder helps construction teams prepare projects, maintain a position catalog, calculate costs, and create clear offers for clients.'
    ),
    (
      'wiki.actions.sign_in',
      'wiki',
      'Public wiki sign in action',
      'Pieslēgties sistēmai',
      'Sign in to the system'
    ),
    (
      'wiki.actions.view_features',
      'wiki',
      'Public wiki anchor action for features',
      'Skatīt iespējas',
      'View capabilities'
    ),
    (
      'wiki.features.title',
      'wiki',
      'Public wiki features section accessible title',
      'Sistēmas iespējas',
      'System capabilities'
    ),
    (
      'wiki.capabilities.projects.title',
      'wiki',
      'Public wiki projects capability title',
      'Projektu darba vide',
      'Project workspace'
    ),
    (
      'wiki.capabilities.projects.description',
      'wiki',
      'Public wiki projects capability description',
      'Vienuviet tiek uzturēti aktīvie projekti, arhīvs, klienta kontaktinformācija un projekta statuss.',
      'Active projects, archive, client contact details, and project status are maintained in one place.'
    ),
    (
      'wiki.capabilities.projects.item_status',
      'wiki',
      'Public wiki projects status bullet',
      'Aktīvo un pabeigto projektu pārskatīšana',
      'Review active and completed projects'
    ),
    (
      'wiki.capabilities.projects.item_client',
      'wiki',
      'Public wiki projects client bullet',
      'Klienta datu un kontaktu saglabāšana piedāvājumam',
      'Store client details and contacts for the offer'
    ),
    (
      'wiki.capabilities.projects.item_team',
      'wiki',
      'Public wiki projects team bullet',
      'Lietotāju piesaiste uzņēmumam un pieejām',
      'Assign users to a company and access levels'
    ),
    (
      'wiki.capabilities.modules.title',
      'wiki',
      'Public wiki modules capability title',
      'Ēku moduļi un izmēri',
      'Building modules and sizes'
    ),
    (
      'wiki.capabilities.modules.description',
      'wiki',
      'Public wiki modules capability description',
      'Sistēma palīdz strukturēt ēkas piedāvājumu pēc moduļiem, aprakstiem, rasējumiem un izmēru variantiem.',
      'The system helps structure a building offer by modules, descriptions, drawings, and size variants.'
    ),
    (
      'wiki.capabilities.modules.item_blocks',
      'wiki',
      'Public wiki modules blocks bullet',
      'Moduļa apraksta bloki un vizuālie materiāli',
      'Module description blocks and visual materials'
    ),
    (
      'wiki.capabilities.modules.item_sizes',
      'wiki',
      'Public wiki modules sizes bullet',
      'Izmēru varianti ar automātisku apjomu sasaisti',
      'Size variants with automatic quantity linking'
    ),
    (
      'wiki.capabilities.modules.item_notes',
      'wiki',
      'Public wiki modules notes bullet',
      'Piezīmes un pabeigtības statuss moduļu sagatavošanai',
      'Notes and completion status for module preparation'
    ),
    (
      'wiki.capabilities.estimate.title',
      'wiki',
      'Public wiki estimate capability title',
      'Tāmes sagatave',
      'Estimate template'
    ),
    (
      'wiki.capabilities.estimate.description',
      'wiki',
      'Public wiki estimate capability description',
      'Pozīciju sagatave ļauj veidot atkārtoti izmantojamu tāmes struktūru un pielāgot to konkrētam projektam.',
      'The position template lets you build a reusable estimate structure and adapt it to a specific project.'
    ),
    (
      'wiki.capabilities.estimate.item_sections',
      'wiki',
      'Public wiki estimate sections bullet',
      'Kategorijas, apakškategorijas un pozīciju kārtošana',
      'Organize categories, subcategories, and positions'
    ),
    (
      'wiki.capabilities.estimate.item_prices',
      'wiki',
      'Public wiki estimate prices bullet',
      'Materiālu, darba un pielāgoto izmaksu aprēķini',
      'Material, labor, and custom cost calculations'
    ),
    (
      'wiki.capabilities.estimate.item_visibility',
      'wiki',
      'Public wiki estimate visibility bullet',
      'Piedāvājumā redzamo sadaļu un cenu kontrole',
      'Control sections and prices visible in the offer'
    ),
    (
      'wiki.capabilities.catalog.title',
      'wiki',
      'Public wiki catalog capability title',
      'Pozīciju katalogs',
      'Position catalog'
    ),
    (
      'wiki.capabilities.catalog.description',
      'wiki',
      'Public wiki catalog capability description',
      'Biežāk lietotās pozīcijas var uzturēt katalogā ar cenu vēsturi, piegādātāju un mērvienībām.',
      'Frequently used positions can be maintained in a catalog with price history, supplier, and units.'
    ),
    (
      'wiki.capabilities.catalog.item_history',
      'wiki',
      'Public wiki catalog history bullet',
      'Cenu vēsture un pēdējās atjaunošanas datums',
      'Price history and last update date'
    ),
    (
      'wiki.capabilities.catalog.item_units',
      'wiki',
      'Public wiki catalog units bullet',
      'Mērvienības, mainīgie daudzumi un pašizmaksas tips',
      'Units, variable quantities, and cost type'
    ),
    (
      'wiki.capabilities.catalog.item_excluded',
      'wiki',
      'Public wiki catalog excluded positions bullet',
      'Neiekļauto pozīciju saraksts alternatīvām izmaksām',
      'Excluded positions list for alternative costs'
    ),
    (
      'wiki.capabilities.exports.title',
      'wiki',
      'Public wiki exports capability title',
      'Piedāvājumi un eksports',
      'Offers and exports'
    ),
    (
      'wiki.capabilities.exports.description',
      'wiki',
      'Public wiki exports capability description',
      'No projekta var sagatavot klientam nododamus dokumentus un iekšējai darbībai nepieciešamu tāmes failu.',
      'A project can produce client-ready documents and an internal estimate file for operations.'
    ),
    (
      'wiki.capabilities.exports.item_pdf',
      'wiki',
      'Public wiki exports PDF bullet',
      'PDF piedāvājums ar uzņēmuma rekvizītiem un derīguma termiņu',
      'PDF offer with company details and validity period'
    ),
    (
      'wiki.capabilities.exports.item_excel',
      'wiki',
      'Public wiki exports Excel bullet',
      'Excel tāme detalizētai pārbaudei un aprēķinu kontrolei',
      'Excel estimate for detailed review and calculation control'
    ),
    (
      'wiki.capabilities.exports.item_profit',
      'wiki',
      'Public wiki exports profit bullet',
      'Plānotās peļņas un gala summu pārskatīšana',
      'Review planned profit and final totals'
    ),
    (
      'wiki.capabilities.admin.title',
      'wiki',
      'Public wiki administration capability title',
      'Administrēšana',
      'Administration'
    ),
    (
      'wiki.capabilities.admin.description',
      'wiki',
      'Public wiki administration capability description',
      'Sistēmas administratori var pārvaldīt uzņēmumus, valodas, tulkojumus un lietotāju grupu pieejas.',
      'System administrators can manage companies, languages, translations, and user group access.'
    ),
    (
      'wiki.capabilities.admin.item_companies',
      'wiki',
      'Public wiki administration companies bullet',
      'Uzņēmumu un lietotāju pārvaldība',
      'Manage companies and users'
    ),
    (
      'wiki.capabilities.admin.item_permissions',
      'wiki',
      'Public wiki administration permissions bullet',
      'Navigācijas un darbību tiesības grupām',
      'Navigation and action permissions for groups'
    ),
    (
      'wiki.capabilities.admin.item_languages',
      'wiki',
      'Public wiki administration languages bullet',
      'Latviešu un angļu UI tekstu uzturēšana',
      'Maintain Latvian and English UI texts'
    ),
    (
      'wiki.workflow.title',
      'wiki',
      'Public wiki workflow section title',
      'Tipiska darba plūsma',
      'Typical workflow'
    ),
    (
      'wiki.workflow.step_label',
      'wiki',
      'Public wiki workflow step label with number parameter',
      'Solis {number}',
      'Step {number}'
    ),
    (
      'wiki.workflow.step_1',
      'wiki',
      'Public wiki workflow first step',
      'Izveido projektu un izvēlies piemērotu ēkas moduli.',
      'Create a project and choose the appropriate building module.'
    ),
    (
      'wiki.workflow.step_2',
      'wiki',
      'Public wiki workflow second step',
      'Pielāgo moduļa datus, izmērus un projektam vajadzīgās pozīcijas.',
      'Adjust module data, sizes, and the positions needed for the project.'
    ),
    (
      'wiki.workflow.step_3',
      'wiki',
      'Public wiki workflow third step',
      'Pārbaudi izmaksas, redzamību piedāvājumā un plānoto peļņu.',
      'Check costs, offer visibility, and planned profit.'
    ),
    (
      'wiki.workflow.step_4',
      'wiki',
      'Public wiki workflow fourth step',
      'Eksportē piedāvājumu PDF formātā vai tāmi Excel failā.',
      'Export the offer as a PDF or the estimate as an Excel file.'
    ),
    (
      'wiki.audience.title',
      'wiki',
      'Public wiki audience section title',
      'Kam tas ir paredzēts?',
      'Who is it for?'
    ),
    (
      'wiki.audience.description',
      'wiki',
      'Public wiki audience section description',
      'Sistēma ir piemērota komandām, kurām regulāri jāveido atkārtojami būvniecības piedāvājumi un jāuztur vienota izmaksu datubāze.',
      'The system is suitable for teams that regularly create repeatable construction offers and maintain a shared cost database.'
    ),
    (
      'wiki.outcome.title',
      'wiki',
      'Public wiki outcome section title',
      'Rezultāts lietotājam',
      'User outcome'
    ),
    (
      'wiki.outcome.description',
      'wiki',
      'Public wiki outcome section description',
      'Mazāk manuālas pārrakstīšanas, pārskatāmāka cenu kontrole un ātrāka pāreja no projekta datiem uz klientam nosūtāmu piedāvājumu.',
      'Less manual retyping, clearer price control, and a faster path from project data to a client-ready offer.'
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
