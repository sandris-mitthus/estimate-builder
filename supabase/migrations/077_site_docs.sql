-- Editable public documentation managed by system administrators.

create table if not exists public.site_doc_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_doc_categories_title_check check (length(trim(title)) > 0)
);

create table if not exists public.site_docs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.site_doc_categories (id) on delete cascade,
  title text not null,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_docs_title_check check (length(trim(title)) > 0),
  constraint site_docs_description_check check (length(trim(description)) > 0)
);

create index if not exists site_doc_categories_sort_order_idx
on public.site_doc_categories (sort_order, title);

create index if not exists site_docs_category_sort_order_idx
on public.site_docs (category_id, sort_order, title);

drop trigger if exists site_doc_categories_set_updated_at on public.site_doc_categories;
create trigger site_doc_categories_set_updated_at
  before update on public.site_doc_categories
  for each row execute function public.set_updated_at();

drop trigger if exists site_docs_set_updated_at on public.site_docs;
create trigger site_docs_set_updated_at
  before update on public.site_docs
  for each row execute function public.set_updated_at();

alter table public.site_doc_categories enable row level security;
alter table public.site_docs enable row level security;

drop policy if exists "site_doc_categories deny client access" on public.site_doc_categories;
create policy "site_doc_categories deny client access"
on public.site_doc_categories
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "site_docs deny client access" on public.site_docs;
create policy "site_docs deny client access"
on public.site_docs
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.site_doc_categories (id, title, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Kopskats', 10),
  ('22222222-2222-4222-8222-222222222222', 'Projekti', 20),
  ('33333333-3333-4333-8333-333333333333', 'Tāmes sagatave', 30),
  ('44444444-4444-4444-8444-444444444444', 'Eksports un administrēšana', 40)
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
    'Ko sistēmā dara ikdienā?',
    'Estimate Builder ir darba vide, kur no sagatavēm un kataloga datiem tiek izveidots konkrēta projekta aprēķins.',
    10
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Projekta dzīves cikls',
    'Projektā glabā klienta kontaktus, projekta statusu, piesaistīto ēkas moduli un sagatavoto tāmi.',
    10
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '33333333-3333-4333-8333-333333333333',
    'Pozīciju struktūra',
    'Tāmes sagatave sastāv no kategorijām, apakškategorijām un pozīcijām, ko var pielāgot konkrētam projektam.',
    10
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '44444444-4444-4444-8444-444444444444',
    'PDF un Excel faili',
    'No projekta var sagatavot klienta PDF piedāvājumu un Excel tāmi iekšējai pārbaudei.',
    10
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
    ('nav.system_admin.site_docs', 'navigation', 'System admin docs management navigation label', 'Docs', 'Docs'),
    ('site_docs.page.subtitle', 'site_docs', 'Docs management page subtitle', 'Publiskās dokumentācijas kategoriju un docs ierakstu pārvaldība', 'Manage public documentation categories and docs entries'),
    ('site_docs.help', 'site_docs', 'Docs management help text', 'Veido docs kategorijas, pievieno aprakstus un pārvelc docs starp kategorijām vai augšup/leju, lai mainītu secību.', 'Create docs categories, add descriptions, and drag docs between categories or up/down to change order.'),
    ('site_docs.add_category', 'site_docs', 'Add docs category button', 'Pievienot kategoriju', 'Add category'),
    ('site_docs.edit_category', 'site_docs', 'Edit docs category action', 'Labot kategoriju', 'Edit category'),
    ('site_docs.delete_category.action', 'site_docs', 'Delete docs category action', 'Dzēst kategoriju', 'Delete category'),
    ('site_docs.add_doc', 'site_docs', 'Add doc button', 'Pievienot docs', 'Add docs'),
    ('site_docs.empty_category', 'site_docs', 'Empty docs category message', 'Šajā kategorijā vēl nav docs. Ievelc docs šeit vai pievieno jaunu.', 'There are no docs in this category yet. Drag docs here or add a new one.'),
    ('site_docs.empty_page', 'site_docs', 'Empty docs management page message', 'Pievieno pirmo kategoriju, lai sāktu veidot docs sadaļu.', 'Add the first category to start building the docs section.'),
    ('site_docs.drag_doc', 'site_docs', 'Doc drag handle aria label', 'Pārvietot docs: {name}', 'Move docs: {name}'),
    ('site_docs.validation.category_title_required', 'site_docs', 'Category title validation error', 'Ievadi kategorijas nosaukumu.', 'Enter a category name.'),
    ('site_docs.validation.category_required', 'site_docs', 'Doc category validation error', 'Izvēlies kategoriju.', 'Choose a category.'),
    ('site_docs.validation.doc_title_required', 'site_docs', 'Doc title validation error', 'Ievadi docs nosaukumu.', 'Enter a docs title.'),
    ('site_docs.validation.doc_description_required', 'site_docs', 'Doc description validation error', 'Ievadi docs aprakstu.', 'Enter a docs description.'),
    ('site_docs.feedback.category_saved', 'site_docs', 'Category saved feedback', 'Kategorija saglabāta.', 'Category saved.'),
    ('site_docs.feedback.category_created', 'site_docs', 'Category created feedback', 'Kategorija pievienota.', 'Category added.'),
    ('site_docs.feedback.category_deleted', 'site_docs', 'Category deleted feedback', 'Kategorija dzēsta.', 'Category deleted.'),
    ('site_docs.feedback.doc_saved', 'site_docs', 'Doc saved feedback', 'Docs saglabāts.', 'Docs saved.'),
    ('site_docs.feedback.doc_created', 'site_docs', 'Doc created feedback', 'Docs pievienots.', 'Docs added.'),
    ('site_docs.feedback.doc_deleted', 'site_docs', 'Doc deleted feedback', 'Docs dzēsts.', 'Docs deleted.'),
    ('site_docs.feedback.order_saved', 'site_docs', 'Doc order saved feedback', 'Docs secība saglabāta.', 'Docs order saved.'),
    ('site_docs.category_modal.edit_title', 'site_docs', 'Edit category modal title', 'Labot kategoriju', 'Edit category'),
    ('site_docs.category_modal.create_title', 'site_docs', 'Create category modal title', 'Jauna kategorija', 'New category'),
    ('site_docs.category_modal.title_label', 'site_docs', 'Category title field label', 'Kategorijas nosaukums', 'Category name'),
    ('site_docs.category_modal.title_placeholder', 'site_docs', 'Category title placeholder', 'Piemēram, Projekti', 'For example, Projects'),
    ('site_docs.doc_modal.edit_title', 'site_docs', 'Edit doc modal title', 'Labot docs', 'Edit docs'),
    ('site_docs.doc_modal.create_title', 'site_docs', 'Create doc modal title', 'Jauns docs', 'New docs'),
    ('site_docs.doc_modal.category_label', 'site_docs', 'Doc category field label', 'Kategorija', 'Category'),
    ('site_docs.doc_modal.title_label', 'site_docs', 'Doc title field label', 'Docs nosaukums', 'Docs title'),
    ('site_docs.doc_modal.title_placeholder', 'site_docs', 'Doc title placeholder', 'Piemēram, Projekta izveide', 'For example, Creating a project'),
    ('site_docs.doc_modal.description_label', 'site_docs', 'Doc description field label', 'Apraksts', 'Description'),
    ('site_docs.doc_modal.description_placeholder', 'site_docs', 'Doc description placeholder', 'Īss paskaidrojums, ko lietotājs šajā docs sadaļā uzzina.', 'A short explanation of what the user learns in this docs section.'),
    ('site_docs.delete_category.title', 'site_docs', 'Delete category confirmation title', 'Dzēst kategoriju?', 'Delete category?'),
    ('site_docs.delete_category.description', 'site_docs', 'Delete category confirmation description', 'Kategorija un visi tajā esošie docs tiks dzēsti.', 'The category and all docs inside it will be deleted.'),
    ('site_docs.delete_doc.title', 'site_docs', 'Delete doc confirmation title', 'Dzēst docs?', 'Delete docs?'),
    ('site_docs.delete_doc.description', 'site_docs', 'Delete doc confirmation description', 'Docs ieraksts tiks dzēsts no dokumentācijas sadaļas.', 'The docs entry will be deleted from the documentation section.'),
    ('wiki.docs.category.eyebrow', 'wiki', 'Public docs category eyebrow', 'Docs kategorija', 'Docs category'),
    ('wiki.docs.category.empty', 'wiki', 'Empty public docs category message', 'Šajā kategorijā vēl nav docs ierakstu.', 'There are no docs entries in this category yet.'),
    ('wiki.docs.empty.title', 'wiki', 'Empty public docs title', 'Dokumentācija vēl tiek gatavota', 'Documentation is being prepared'),
    ('wiki.docs.empty.description', 'wiki', 'Empty public docs description', 'Sistēmas administrators vēl nav pievienojis publiskās dokumentācijas saturu.', 'The system administrator has not added public documentation content yet.')
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
