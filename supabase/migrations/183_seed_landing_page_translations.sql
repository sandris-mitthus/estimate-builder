-- Public landing page + dedicated login/signup screens.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'landing.nav.features',
      'landing',
      'Landing header link to the features section',
      'Iespējas',
      'Features'
    ),
    (
      'landing.nav.workflow',
      'landing',
      'Landing header link to the workflow section',
      'Kā tas strādā',
      'How it works'
    ),
    (
      'landing.hero.eyebrow',
      'landing',
      'Small label above the landing headline',
      'Tāmju sistēma būvniecībai',
      'Estimating system for construction'
    ),
    (
      'landing.hero.title',
      'landing',
      'Landing hero headline',
      'Būvniecības tāmes, kas paliek precīzas līdz pēdējam materiālam',
      'Construction estimates that stay accurate down to the last material'
    ),
    (
      'landing.hero.description',
      'landing',
      'Landing hero paragraph',
      'Izcenojumu katalogs, tāmju redaktors un materiālu plūsma vienā sistēmā. Sagatavo tāmi, izveido klientam piedāvājumu un seko, kas jāpasūta, kad projekts ir apstiprināts.',
      'A price catalogue, an estimate editor and material flow in one system. Build the estimate, create the client offer and track what has to be ordered once the project is approved.'
    ),
    (
      'landing.hero.note',
      'landing',
      'Small note under the landing hero buttons',
      'Pieslēdzies ar Google vai izveido kontu ar e-pastu.',
      'Sign in with Google or create an account with your email.'
    ),
    (
      'landing.preview.project',
      'landing',
      'Project name in the decorative estimate preview',
      'Dzīvojamā māja Jūrmalā',
      'Residential house in Jurmala'
    ),
    (
      'landing.preview.status',
      'landing',
      'Approved status pill in the decorative estimate preview',
      'Apstiprināts',
      'Approved'
    ),
    (
      'landing.preview.category',
      'landing',
      'Category row in the decorative estimate preview',
      'Pamati un pagrabs',
      'Foundations and basement'
    ),
    (
      'landing.preview.row_1',
      'landing',
      'First position in the decorative estimate preview',
      'Betona pamatu izbūve',
      'Concrete foundation works'
    ),
    (
      'landing.preview.row_2',
      'landing',
      'Second position in the decorative estimate preview',
      'Pamatu hidroizolācija',
      'Foundation waterproofing'
    ),
    (
      'landing.preview.row_3',
      'landing',
      'Third position in the decorative estimate preview',
      'Grunts blietēšana',
      'Soil compaction'
    ),
    (
      'landing.features.title',
      'landing',
      'Landing features section heading',
      'Viss, kas vajadzīgs tāmes ceļam',
      'Everything an estimate needs on its way'
    ),
    (
      'landing.features.subtitle',
      'landing',
      'Landing features section paragraph',
      'No pirmās pozīcijas līdz apstiprinātam projektam un materiālu pasūtījumiem.',
      'From the first position to an approved project and material orders.'
    ),
    (
      'landing.features.estimates.title',
      'landing',
      'Landing feature card title: estimate editor',
      'Tāmes redaktors',
      'Estimate editor'
    ),
    (
      'landing.features.estimates.description',
      'landing',
      'Landing feature card text: estimate editor',
      'Kategorijas, apakškategorijas un pozīcijas ar pārvilkšanu. Summas pārrēķinās uzreiz, kolonnas pielāgojamas katram projektam.',
      'Categories, subcategories and positions with drag and drop. Totals recalculate instantly and columns adapt to every project.'
    ),
    (
      'landing.features.template.title',
      'landing',
      'Landing feature card title: shared template',
      'Kopīgā sagatave',
      'Shared template'
    ),
    (
      'landing.features.template.description',
      'landing',
      'Landing feature card text: shared template',
      'Viena izcenojumu sagatave visiem projektiem. Kad cena mainās, sistēma parāda, kuras tāmes to vēl nav pārņēmušas.',
      'One price template for every project. When a price changes, the system shows which estimates have not picked it up yet.'
    ),
    (
      'landing.features.catalog.title',
      'landing',
      'Landing feature card title: price catalogue',
      'Izcenojumu katalogs',
      'Price catalogue'
    ),
    (
      'landing.features.catalog.description',
      'landing',
      'Landing feature card text: price catalogue',
      'Darbu un materiālu izcenojumi ar mērvienībām, normām un cenām. Atrodi un pievieno pozīciju bez atkārtotas ievades.',
      'Labour and material prices with units, norms and rates. Find and add a position without typing it again.'
    ),
    (
      'landing.features.modules.title',
      'landing',
      'Landing feature card title: building modules',
      'Ēku moduļi',
      'Building modules'
    ),
    (
      'landing.features.modules.description',
      'landing',
      'Landing feature card text: building modules',
      'Atkārtojami mezgli ar saviem daudzumiem un datiem. Pievieno moduli tāmei, un pozīcijas ar apjomiem ienāk automātiski.',
      'Reusable assemblies with their own quantities and data. Add a module to an estimate and its positions arrive with volumes already filled in.'
    ),
    (
      'landing.features.exports.title',
      'landing',
      'Landing feature card title: PDF and Excel offers',
      'Piedāvājumi PDF un Excel',
      'Offers in PDF and Excel'
    ),
    (
      'landing.features.exports.description',
      'landing',
      'Landing feature card text: PDF and Excel offers',
      'Klienta piedāvājums vienā klikšķī. Rādi detalizētas rindas vai tikai kopsummu, ar uzņēmuma rekvizītiem.',
      'A client offer in one click. Show detailed rows or only the total, with your company details.'
    ),
    (
      'landing.features.materials.title',
      'landing',
      'Landing feature card title: material ordering',
      'Materiālu pasūtīšana',
      'Material ordering'
    ),
    (
      'landing.features.materials.description',
      'landing',
      'Landing feature card text: material ordering',
      'Pēc tāmes apstiprināšanas redzi materiālu sarakstu, atzīmē pasūtīto un deleģē katru pozīciju atbildīgajam.',
      'Once the estimate is approved you see the material list, mark what is ordered and delegate each item to the person responsible.'
    ),
    (
      'landing.workflow.title',
      'landing',
      'Landing workflow section heading',
      'Kā tas strādā',
      'How it works'
    ),
    (
      'landing.workflow.step1.title',
      'landing',
      'Landing workflow step 1 title',
      'Izveido projektu',
      'Create the project'
    ),
    (
      'landing.workflow.step1.description',
      'landing',
      'Landing workflow step 1 text',
      'Pievieno klientu, termiņus un pozīcijas no kataloga vai ēku moduļiem.',
      'Add the client, the deadlines and positions from the catalogue or building modules.'
    ),
    (
      'landing.workflow.step2.title',
      'landing',
      'Landing workflow step 2 title',
      'Sagatavo piedāvājumu',
      'Prepare the offer'
    ),
    (
      'landing.workflow.step2.description',
      'landing',
      'Landing workflow step 2 text',
      'Pārbaudi apjomus, pievieno plānoto peļņu un eksportē PDF vai Excel.',
      'Check the volumes, add the planned profit and export a PDF or Excel file.'
    ),
    (
      'landing.workflow.step3.title',
      'landing',
      'Landing workflow step 3 title',
      'Vadi izpildi',
      'Run the work'
    ),
    (
      'landing.workflow.step3.description',
      'landing',
      'Landing workflow step 3 text',
      'Apstiprini tāmi, pasūti materiālus un seko, kas kuram ir deleģēts.',
      'Approve the estimate, order materials and keep track of what is delegated to whom.'
    ),
    (
      'landing.cta.title',
      'landing',
      'Landing closing call to action heading',
      'Sāc pirmo tāmi jau šodien',
      'Start your first estimate today'
    ),
    (
      'landing.cta.description',
      'landing',
      'Landing closing call to action paragraph',
      'Izveido kontu, pievieno uzņēmuma datus un strādā ar reāliem projektiem.',
      'Create an account, add your company details and start working on real projects.'
    ),
    (
      'auth.back_home',
      'auth',
      'Link from the login and signup screens back to the landing page',
      'Atpakaļ uz sākumu',
      'Back to home'
    ),
    (
      'auth.login.subtitle',
      'auth',
      'Subtitle on the login screen',
      'Turpini darbu ar saviem projektiem un tāmēm.',
      'Continue working on your projects and estimates.'
    ),
    (
      'auth.login.no_account',
      'auth',
      'Prompt before the signup link on the login screen',
      'Nav konta?',
      'No account yet?'
    ),
    (
      'auth.signup.subtitle',
      'auth',
      'Subtitle on the signup screen',
      'Izveido kontu un sāc pirmo tāmi dažās minūtēs.',
      'Create an account and start your first estimate in minutes.'
    ),
    (
      'auth.signup.have_account',
      'auth',
      'Prompt before the login link on the signup screen',
      'Jau ir konts?',
      'Already have an account?'
    ),
    (
      'auth.signup.google_only',
      'auth',
      'Shown on the signup screen when email registration is unavailable',
      'E-pasta reģistrācija pašlaik nav pieejama. Izveido kontu ar Google.',
      'Email registration is currently unavailable. Create your account with Google.'
    ),
    (
      'auth.signup.check_email.title',
      'auth',
      'Heading of the confirmation panel after signup',
      'Pārbaudi e-pastu',
      'Check your email'
    ),
    (
      'auth.signup.check_email.description',
      'auth',
      'Text of the confirmation panel after signup, {email} is the address used',
      'Nosūtījām apstiprinājuma saiti uz {email}. Atver to, lai aktivizētu kontu.',
      'We sent a confirmation link to {email}. Open it to activate your account.'
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
