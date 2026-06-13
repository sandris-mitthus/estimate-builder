# Estimate Builder

Construction estimate editor for Latvian tenders — hierarchical categories, subcategories, and line items with unit prices (labor / materials / mechanisms), catalog hints, and drag-and-drop reordering. Next.js app with section-based navigation (projects, building modules, sagatave template, position catalog, users, settings).

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.2.7` (see [Changelog](#changelog))

---

## Features

### Authentication

- **Google OAuth** via Supabase — when not signed in, only a centered “Pierakstīties ar Google” button is shown (no nav or app content)
- Protected app routes under `app/(protected)/`; OAuth callback at `/auth/callback`
- Session refresh via `proxy.ts` on every request
- **Top nav (right):** signed-in user avatar, name, and sign-out button

### Navigation

English routes, Latvian labels:

| Label | Route |
|-------|-------|
| Projekti | `/` |
| Ēku moduļi | `/modules` |
| Sagatave | `/estimate` |
| Pozicijas | `/positions` |
| Lietotāji | `/users` |
| Uzstādījumi | `/settings` |

- **Projekti** — project cards (module name above client name, email, phone, address); galvenē **Jauns projekts** + **Arhīvs** (`fa-archive`, `/?archive=1`); **Jauns projekts** modal creates project + estimate **cloned from Sagatave** in Supabase; card actions **Moduļa dati** (individual projects only — amber highlight when viz/PDF missing), **Kopēt** (vienmēr redzama), **Labot**, **Dzēst** (tikai `active`), **Apstiprināts**, **Noraidīts** (tikai `active`), **Pabeigts** (`fa-check-double`, tikai `approved`; `ConfirmModal`); **sarkanā apmale** + teksts **Ir jauninājumi izcenojumos** tikai `active` projektiem ar novecojušām kataloga cenām; list loads **only real DB rows** when Supabase is configured (no demo fallback on empty/error); sarakstā tikai `active` un `approved`; **Arhīvs** rāda visus statusus ar radio filtru (**Visi**, **Aktīvie**, **Procesā**, **Pabeigtie**, **Noraidītie**); **noraidītie** un **pabeigtie** paslēpti no galvenā saraksta, bet netiek dzēsti no DB
- **Jauns projekts / Labot / Kopēt** — shared `ProjectFormModal` with **required Modulis** select (catalog modules + **Individuāls projekts** last); `building_module_id` on `projects`; client name, phone, email, address; phone country code from IP on create, parsed from stored number on edit; email/phone validation; **Google Places** autocomplete with map preview (including pre-filled address on edit); **Kopēt** (`fa-copy`) atver **Jauns projekts** modāli ar tukšiem kontaktu laukiem un avota moduli, bet izveides laikā tāme tiek klonēta no avota projekta (`copyEstimateFromProjectId`)
- **Ēku moduļi** (`/modules`, `/modules/[id]`) — module catalog in Supabase (`building_modules`); **Pievienot Moduli** (name only); cards with **Labot** / **Dzēst**; red **`fa-house-damage`** icon + tooltip **Nav ievadīti moduļu dati** when viz or project PDF missing; click name opens detail: left column **Vizualizācijas** (image upload grid, 2 per row, drag reorder) + **Projekts** (PDF only, same grid); right column **Projekta apraksts** (Pamats, L veida pamats, izgriezumi, Sienas ar **Frontoni** — augstums, skaits, pamata plakne; platums × augstums / 2 × skaits pieskaitīts ārsienu neto kvadratūrai; Logi, Durvis, Jumts — calculated fields, **Saglabāt** persists `project_description` JSON); **aptaksts** outline list below; empty states; toasts on file actions
- **Sagatave** (`/estimate`) — single company-wide estimate template in Supabase (`estimate_positions`); opens editor table directly (`ensureDefaultEstimatePosition()` creates row if missing); hierarchy like project estimates: **tāmes pozīcija** (category) with **+ Sub** / **+ Multi** / **+ Pozīcija**, optional **subkategorijas**, line items and **multi-pozīcijas** under either level; subkategorijā **acs** `fa-eye` / `fa-eye-slash` (tooltip piedāvājuma redzamas / paslēptas pozīcijas; `hiddenInOffer` JSON); **collapse** chevron on category and subcategory rows (state in cookie `eb_estimate_collapsed_{documentId}`); table columns **Nosaukums**, **Mērv.** (automātiski no `moduleSizeAttachment`), **Vienības cena** (6 kolonnas: **Laika norma** · **Darba samaksas likme** · Darbs · Materiāli · Mehānismi · Kopā); **kompozīts modelis** — pozīcija ar `laborTimeNorm`, `materials[]`, `mechanisms[]` (kataloga atsauces masīvi; vairāki materiāli summējas, vairāki mehānismi summējas × laika norma); Darbs = laika norma × stundas likme; **Laika norma** tieši rediģējama sarakstā (inline `LaborTimeNormInput` ar `−`/`+`, hover-only border/pogas); line-item name **catalog hints** from `/positions`; **darba pozīcijām** — treknraksts + `fa-clipboard-list` **Piesaisīt moduļa lielumu**: modālis ar ēku moduļu `project_description` lielumiem; strukturēts teksts zem nosaukuma (sadaļa · apzīmējums · vērtība); Materiāli/Mehānismi šūnās tooltip ar kataloga nosaukumu (ja vairāki — komatu atdalīti); rinda **sarkanā tonī** + `fa-exclamation-triangle` + teksts **Nav pievienots moduļa apjoms** pozīcijām bez `moduleSizeAttachment`, kad moduļu lielumi definēti; **multi-pozīcija** — modal editor, drag-reorder options, auto-adds next empty option, duplicate catalog positions blocked **within one multi** only; katras opcijas apakšā cenu kopsāvilkums (Darbs / Materiāli / Mehānismi / Vienības cena); **multi opciju saites** — `fa-link`, velc uz opciju citā multi; saglabā `multiOptionLinks` JSON; drag-and-drop reorder; **Saglabāt** persists structure + syncs catalog names/units; **unsaved-changes** guard on leave; no footer **Kopā** totals row
- **Pozicijas** (`/positions`) — **materiālu un mehānismu** unit-price katalogs Supabase (`position_prices`; **Darbs** — no **Uzstādījumi** stundas likmes, ne šeit); searchable sortable table; kompakts **Veids** filtrs zem meklēšanas (**Visi** / **Materiāls** / **Mehānismi**); columns **Nosaukums**, **Veids**, **Cena** (`2.91 EUR / gab.` + update date; bez cenas `- EUR / gab.`), **Darbības**; **Pievienot pozīciju** / **Labot** modals (tikai Materiāls / Mehānismi — cost-type radio above name + unit with hints, 80/20; optional **mainīgs apjoms** toggle — enables editable **Apj.** cell in project estimates for linked rows); **Atjaunot cenu** modal (direct unit price or volume × total calc, supplier store/contact/email/phone, company currency suffixes); **Vēsture** row action opens extra-wide modal with price log (date, amount, “No …” delta, supplier on two lines with phone/email icons); row zebra striping + muted green hover; supplier **tooltip** on price (`cursor: help`); **Atcelt** on all form modals via `ModalFormActions`; **nosaukums / mērvienība** atjaunināti arī no sagataves vai projekta tāmes, ja rinda saistīta ar katalogu (`positionPriceId` vai unikāla nosaukuma atbilstība)
- **Lietotāji** — Supabase Auth users (name, email, Google avatar); **Uzaicināt** modal sends email invite via admin API (client + server validation)
- **Uzstādījumi** — company profile (name, address, reg/VAT, bank, contacts, currency, logo)

### Company settings (`/settings`)

- Company name, address, registration number, optional VAT number (hidden in preview when empty)
- **Bank account first** — entering a Latvian IBAN auto-fills bank name and SWIFT on the next row (Swedbank, SEB, Citadele, Luminor, etc.)
- Info phone and email
- Currency select (EUR, USD, GBP, PLN, SEK, NOK, DKK)
- **Tāmes derīguma termiņš** — integer days (suffix **dienas**); default **30**; used for new projects and estimate **Tāmes termiņš** calculation
- **Darbinieka standarta stundas likme** — optional decimal; currency suffix from company settings (e.g. `EUR`)
- **Logo upload** — drag-and-drop or file picker → Supabase Storage (`company-assets` bucket)
- Live preview of company block on the right (wider sidebar column)
- Persisted in `public.company_settings` (singleton row)

### Estimate editor (`/[id]`)

- **Header above table** — **3 columns**: Google Maps embed (left, from **Objekts** address) · module **visualizations** (middle — from linked module or individual project uploads) · meta + actions (right)
- Meta layout: bold module name + action icons; **Tāmes piedāvājums** title + **Kopā** total; client, full-width object address; **Sagatavotājs**, **Datums**, **Tāmes termiņš** in one row
- **Datums** — defaults to project **created_at**; **Tāmes termiņš** — defaults to Datums + validity days from **Uzstādījumi**; both editable (changing Datums recalculates termiņš); **zem termiņa** — "X dienas līdz termiņam" / "Termiņš šodien" / "Termiņš beidzies" rādīts, kad tāme ir saglabāta
- **Individuāls projekts** — **Moduļa dati** icon opens `/[id]/module-data` (same upload UI as module detail: viz images, project PDFs, **Projekta apraksts** with save); incomplete viz/PDF → amber icon + optional full-page **spotlight** (blur overlay, ESC or **X** to dismiss)
- Excel-style table: categories, optional subcategories, line items, **multi-pozīcijas** (modal, DnD, **opciju saites**; piedāvājumā **viena rinda** ar opciju **select** + **Multi** badge zem nosaukuma)
- **Jauns projekts** — tāmes struktūra **klonēta no Sagataves** (`clone-sagatave-for-project.ts`); **Kopēt** no projekta kartes klonē esošas projekta tāmes pozīcijas un `multiOptionLinks` (jauni ID); tukšām esošām tāmēm fallback no sagataves; galvenē `{N} tāmes pozīcijas · {M} rindas` un **+ Tāmes pozīcija**
- **Saglabāt tāmi** — poga zem tabulas; nospiežot, tāme (title, meta, categories ar **iesaldētām cenām**) tiek saglabāta `estimates` tabulā; "Nesaglabātas izmaiņas" / "Saglabāts: DD.MM.YY" indikators; cenu iesaldēšana: `positionPriceId` atsauces tiek nomainītas uz faktiskajām cenām — kataloga izmaiņas neieetekmē saglabātās tāmes; pēc saglabāšanas **saglabātās cenas** salīdzināmas ar katalogu — atšķirības **sarkanās šūnās** (materiāli/mehanismi, arī apjoma kolonnās)
- **Jauni izcenojumi** — baneris **Pieejami jauni izcenojumi** un **Atjaunot cenas** tikai `active` projektiem (`shouldShowStaleCatalogPriceWarnings`); **Atjaunot cenas** atjaunina tabulas cenas no kataloga **tikai UI** (nesaglabā DB; **Saglabāt** paliek aktīvs)
- **Apstiprināta tāme** — **Apstiprināts** (`status = approved`) bloķē labošanu (read-only meta, bez drag/dzēšanas/pozīciju pievienošanas); zaļš baneris **Tāme apstiprināta — izmaiņas vairs nav iespējamas**; bez brīdinājumiem par jauniem izcenojumiem; PDF/Excel joprojām pieejami; **Kopēt** vienmēr pieejama; **Labot/Dzēst** paslēpti; **Pabeigts** pārvieto uz `completed` (pazūd no saraksta, saglabāts DB, atverams caur `/{id}`)
- **Eksports** (tikai kad saglabāts) — **PDF (piedāvājums)** via `@react-pdf/renderer` (A4, kategorijas, `hiddenInOffer` apakšsadaļas → vienā rindā, lapas numurs); **Excel (tāme)** via `xlsx` (pilna cenu detaļa: V.cena + Kopā pa Darbs/Materiāli/Mehānismi); lejupielāde no `/api/estimates/[id]/pdf` un `/api/estimates/[id]/excel`
- **Multi opciju saites** — sagatavē definētas pārus starp opcijām dažādos multi; projekta tāmē izvēle **divvirzienu** sinhronizē saistītās opcijas (session state; kopā ar pilnu tāmes persistenci roadmap)
- **Moduļa lieluma apjomi** — rindām ar `moduleSizeAttachment` **Apj.** kolonnā rāda piesaistīto lielumu (ne zem nosaukuma); sinhronizēts no sagataves / moduļa `project_description` (`sync-module-size-quantities.ts`); read-only, ja ir piesaiste
- **Multi piedāvājumā** — tikai opciju **select** (bez labošanas modāļa, dzēšanas, **+ Multi**); pilna multi rediģēšana tikai **Sagatave**
- **Collapse** category and subcategory rows (cookie per estimate id); **+ Sub** / **+ Pozīcija** auto-expands collapsed parent (**+ Multi** tikai sagatavē)
- Columns: **Nosaukums** (kataloga hinti; saistītām rindām **read-only**; materiālu / mehānismu nosaukumi labajā pusē), **Mērv.** (read-only, ja saistīts ar katalogu), **Apj.** (vienmēr redzama; rediģējama tikai **mainīgs apjoms** rindām bez moduļa piesaistes), **Vienības cena** (Darbs / Materiāls / Mehānismi / Kopā — **read-only** no kataloga / stundas likmes), **Apjoma cena** (Darbs / Materiāls / Mehānismi / Kopā — `apjoms × vienības cena` mainīga apjoma rindām; citām **—**), dzēšana; summu šūnās **0** rāda kā **—** (`formatAmountDisplay`); apjomi apaļoti līdz **2 cipariem**
- Kājene **Kopā** — komponentu kopsummas **Apjoma cena** kolonnās; kopējā summa **Apjoma cena → Kopā** (`formatAmountDisplay`, bez `€` prefiksa)
- **Piesaistītais moduļa lielums** — strukturēts teksts zem rindas nosaukuma (`EstimateLineItemNameField` `footer`)
- Drag-and-drop reorder for categories, subcategories, multi-pozīcijas, and items (cross-subcategory / cross-category item moves)
- Drop indicator: thick horizontal line on hover (no slide animation)
- Sticky table header, footer totals row
- Editable estimate number in meta when set

### Data

- **Supabase** (Postgres + Storage) when env is configured
- Falls back to in-memory sample data only when Supabase is **not** configured (configured DB with zero projects shows empty list, not seed cards)
- Estimate **full state** (title, meta, categories with baked-in prices) persisted via **Saglabāt tāmi** server action; dates also auto-saved on change
- `npm run db:migrate` applies only **pending** migrations (tracked in `public.schema_migrations`)
- App tables use **service-role server access** with RLS deny policies for browser clients

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase** — Postgres + Auth + Storage via `@supabase/ssr` + service role on server
- **Tailwind CSS 4**
- **@dnd-kit** — drag and drop
- **@react-pdf/renderer** — server-side PDF generation (estimate proposal); `serverExternalPackages` in `next.config.ts`
- **xlsx** — Excel workbook generation (estimate spreadsheet)
- **pdfjs-dist** — PDF first-page thumbnails in module detail (legacy build + `public/pdf.worker.min.mjs` via `postinstall`)
- **Font Awesome** — icons

---

## Getting started

### Requirements

- Node.js 20+
- npm

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) — project list at `/` (login gate if Supabase auth is configured).

**Local dev tip:** Multiple Supabase apps on `localhost` share cookies and can trigger HTTP **431** (headers too large). Use `127.0.0.1` for one app, or clear `sb-*` cookies; `dev`/`start` scripts raise the header limit and middleware prunes foreign Supabase cookies.

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run start` | Production server (port 3100) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply pending SQL migrations to Supabase Postgres |
| `npm run db:test` | Test Supabase connection and tables |
| `postinstall` | Copies `pdfjs-dist` legacy worker to `public/pdf.worker.min.mjs` |

### Environment

Copy `.env.example` → `.env.local` and fill in **real** values locally. Never commit `.env.local`. Keep `.env.example` as placeholders only.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | DB + Auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB + Auth | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | DB + users list + settings + logo upload | Server only |
| `NEXT_PUBLIC_SITE_URL` | Auth | `http://localhost:3100` locally; OAuth redirect base |
| `SUPABASE_DB_PASSWORD` or `DATABASE_URL` | Migrations | `npm run db:migrate` only |
| `SUPABASE_DB_REGION` | Migrations | Pooler region (default `eu-west-1`) if direct `db.*` host fails |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Address autocomplete | Places API (New) via `/api/places/autocomplete`; HTTP referrers must include site URL |
| `GOOGLE_MAPS_API_KEY` | Optional | Server-only key override (defaults to public key on server) |

Google Maps key referrers (when restricted): `http://localhost:3100/*`, `http://127.0.0.1:3100/*`. Enable **Places API (New)** and **Maps Embed API** in Cloud Console.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy API keys and database password into **`.env.local`** (not `.env.example`)
3. Run migrations:

```bash
npm run db:migrate
npm run db:test
```

4. Enable **Google** provider: Authentication → Providers → Google
5. Set redirect URLs: Authentication → URL Configuration  
   - Site URL: `http://localhost:3100`  
   - Redirect: `http://localhost:3100/auth/callback`
6. Start the app — sign in, then `/` loads projects from `public.projects`

**Schema:** `supabase/migrations/` — `projects` (phone, email, `building_module_id`, `visualization_blocks` / `project_blocks` / `project_description` for individual projects, `status` `active` | `approved` | `rejected` | `completed` in `026` + `027`, `007` + `015` + `017` + `025`), `estimates`, `estimate_positions` (`020`–`021`, JSON `sections` — masīvs vai `{ sections, multiOptionLinks }`), `position_prices` (`008`–`009`, `cost_type` in `019`, history in `022`, sample cost types in `023`, `variable_quantity` in `024`), `building_modules` (`010`–`014`, `project_description` in `025`), `company_settings` (incl. `estimate_validity_days` `016`, `default_hourly_rate` `018`), `schema_migrations`, Storage `company-assets`, `module-assets` (module + project asset paths)

---

## Project structure

```
app/
├── (protected)/      # Auth-gated routes (nav + pages)
│   ├── layout.tsx      # Login gate or AppNav + children
│   ├── page.tsx        # Project list (/) + archive (?archive=1)
│   ├── actions.ts      # create/update/delete project; save estimate; updateProjectStatusAction; updateProjectEstimateDatesAction
│   ├── project-module-actions.ts  # individual project viz/PDF blocks + project description
│   ├── [id]/           # Estimate editor + module-data/
│   │   ├── page.tsx
│   │   └── module-data/page.tsx   # Individual project module uploads
│   ├── modules/        # list + [id] detail; actions (CRUD, blocks, uploads, project description)
│   ├── estimate/            # Sagatave editor + saveEstimatePositionDocumentAction
│   ├── positions/      # page + CRUD / price-update / history / catalog sync actions
│   ├── users/          # page + inviteUserAction
│   └── settings/
├── api/
│   ├── estimates/[projectId]/pdf/    # Authenticated PDF download (Piedāvājums)
│   ├── estimates/[projectId]/excel/  # Authenticated Excel download (Tāme)
│   ├── geo/calling-code/   # IP → phone country code
│   ├── modules/asset/      # Authenticated PDF/image proxy (modules + projects paths)
│   └── places/autocomplete/ # Google Places (New) proxy
├── auth/
│   ├── callback/       # OAuth code exchange
│   └── auth-code-error/
├── components/         # UI (estimate-table, project-page-actions, project-archive-content, project-status-filter, estimate-position-table, …)
├── lib/
│   ├── auth/           # getCurrentUser, signInWithGoogle, signOut, mapUserDisplay
│   ├── client/         # cookie read/write helpers
│   ├── estimate-positions/  # repository, serialize, reorder, collapsed-sections-cookie, clone-sagatave-for-project, project-estimate-base, default sagatave
│   ├── estimates/      # calculate-totals, calculate-line (addThousandSeparators), format-money, multi-position, multi-position-links, composite-line-item, unit-price-columns, volume-price-columns, module-size-attachment, sync-module-size-quantities, resolve-estimate-meta, sample data, DnD reorder
│   ├── exports/        # estimate-pdf.tsx (React PDF document), estimate-excel.ts (xlsx workbook)
│   ├── hooks/          # use-unsaved-changes-guard, use-sync-catalog-position-from-line-item, use-collapsed-estimate-sections
│   ├── form/           # input invalid styles
│   ├── geo/            # country calling codes, IP detect
│   ├── google-maps/    # Places API, build-embed-url
│   ├── modules/        # repository, outline/blocks parse, building-module-data, project-description types/calc/parse, foundation-plane-options, format-module-size-summary, apply-module-size-adjustments, listBuildingModuleSizeOptions, file-storage (module-assets)
│   ├── positions/      # repository, apply-catalog-to-line-item, sync-from-estimate-line-items, has-defined-labor, variable-quantity, stale-catalog-price, filter-positions (catalog filter + search)
│   ├── projects/       # repository, project-status, filter-projects, project-module-data, sample fallback
│   ├── settings/       # company settings, logo storage, IBAN bank resolve, currencies
│   ├── users/          # Auth user list + invite (admin API)
│   ├── validation/     # email, phone, formatDisplayPhone
│   ├── security/       # safe redirect paths
│   └── supabase/       # clients, update-session, storage-key cookie cleanup
proxy.ts                # Supabase session refresh
scripts/                # db:migrate, db:test, copy-pdf-worker.mjs
public/                 # pdf.worker.min.mjs (postinstall from pdfjs-dist)
supabase/migrations/
.cursor/rules/          # README bump, commits, db:migrate, Supabase security
```

---

## Roadmap

- [x] Persist full estimate edits to `estimates` table — **Saglabāt tāmi** ar cenu iesaldēšanu
- [x] Individuāls projekts — per-project module data page, uploads, spotlight prompt
- [x] Estimate meta dates — auto defaults + manual override persisted
- [x] Ēku moduļi — catalog CRUD, detail page, image/PDF uploads, outline (DB), **Projekta apraksts** (persisted JSON), missing-data icon on list
- [x] Sagatave (`/estimate`) — template editor with subcategories, read-only catalog prices, DB persist, save + unsaved guard, catalog hints
- [x] Pozicijas catalog (`/positions`) — CRUD for **materials/mechanisms** + unit price updates with supplier info; **Darbs** from settings hourly rate
- [x] Sagatave ↔ Pozicijas sync — linked line items update catalog name/unit on edit or save
- [x] Multi-pozīcijas — modal editor, option DnD, table reorder, offer radio selection (sagatave + project estimates)
- [x] Estimate table collapse — categories and subcategories with per-document cookie
- [x] Pozicijas **mainīgs apjoms** — optional quantity column in project estimates (`024`)
- [x] Multi **opciju saites** — drag link starp opcijām dažādos multi, divvirzienu izvēle, saglabāšana sagatavē
- [x] Projekta tāme no sagataves — jauns projekts klonē sagataves struktūru; **Apj.** kolonna; **Apjoma cena**; read-only kataloga nosaukums/mērv./vienības cena; multi piedāvājumā viena rinda ar select
- [x] Sagatave — moduļa lieluma piesaiste darba pozīcijām (`moduleSizeAttachment`); subkategorijas piedāvājuma redzamība (`hiddenInOffer`)
- [x] Piedāvājumā (`/[id]`) — `moduleSizeAttachment` apjomi **Apj.** kolonnā; multi tikai select; materiālu/mehānismu nosaukumi labajā pusē
- [x] Projekta apraksts — **Frontoni** sadaļā Sienas (pamata plakne, skaits, formula; pieskaitīts ārsienu neto)
- [x] Pozicijas — **Veids** filtrs (Visi / Materiāls / Mehānismi); bez cenas `- VALŪTA / mērv.`
- [x] Kompozīts pozīciju modelis — laika norma, Darbs = norma × likme, Materiāli/Mehānismi no kataloga (masīvi, cenas summējas); inline rediģēšana; multi-pozīcijām arī; moduļa apjoma brīdinājums; opciju kopsāvilkums multi modālī
- [x] Piedāvājumā `hiddenInOffer` — PDF eksportā apakšsadaļas ar `hiddenInOffer: true` rāda kā vienu kopsummas rindu
- [x] Export estimate — **PDF (piedāvājums)** un **Excel (tāme)**
- [x] Saglabātas tāmes — novecojušu kataloga cenu indikators (saraksts + projekta lapa + sarkanās šūnas); **Atjaunot cenas** (UI)
- [x] Projekta statuss — **Apstiprināts** / **Noraidīts** / **Pabeigts** + **Arhīvs** ar statusa filtru
- [ ] User management beyond read-only list and email invite
- [ ] Use company settings + logo on estimate PDF/header

---

## Versioning & commits

Semantic versioning in `package.json`. Each **release** commit:

1. Bump `package.json` `"version"`
2. Add `### vX.Y.Z` under **Changelog** (newest first)
3. End the commit message with `. vX.Y.Z`

**Commit message format:**

```
Short description of what shipped. v1.1.14
```

### README update (Cursor)

Say **`README update`** (or `@README.md update`) to refresh changelog and docs. Default version step is **patch** (`1.1.3` → `1.1.4`). Ask explicitly for a **minor** step (`1.1.4` → `1.2.0`) only when you need a larger release.

Cursor rules:

- `.cursor/rules/readme-version-update.mdc` — README update + version bump
- `.cursor/rules/github-version-commit.mdc` — commit message format; run `typecheck` + `build` before commit/push
- `.cursor/rules/db-migrate-after-sql.mdc` — run `npm run db:migrate` after new SQL; fix and retry on failure
- `.cursor/rules/supabase-migration-security.mdc` — RLS deny policies, no `using (true)`, `search_path`, storage rules
- `.cursor/rules/modal-confirm-exit.mdc` — `AppModal` backdrop confirm only when `dirty={true}`; Enter submit; fixed overlay (not `showModal`) for Places dropdown z-index
- `.cursor/rules/tooltip-buttons.mdc` — icon buttons use `Tooltip`, not `title`
- `.cursor/rules/button-cursor-pointer.mdc` — all buttons use `cursor: pointer` (base styles in `globals.css`)
- `.cursor/rules/feedback-toast.mdc` — save feedback via toast provider (`app/layout.tsx` + `app/(protected)/layout.tsx`)

Skip version bump only for typo/docs-only changes when you explicitly say no release.

---

## Changelog

### v1.2.7

**Laika norma — vienmēr 2 cipari aiz komata**

- **`formatTimeNormDisplay`** (`variable-quantity.ts`) — noņemts `value === 0` agrais atgriešanās; tagad 0 formatējas kā `"0,00"` nevis `""` (tukšums); ne-nulle vērtības jau izmantoja `.toFixed(2)`, tāpēc tās nav mainītas
- **`LaborTimeNormInput`** — `placeholder` mainīts no `"0"` uz `"0,00"`; blur notikums normalizē jebkuru nepilnu ievadi (piem. `"0,0"`) uz `"0,00"` caur `formatTimeNormDisplay(parseTimeNormInput(draft))`

### v1.2.6

**Valūtas simbols no uzstādījumiem — tāmes kolonnu virsraksti un naudas formatēšana**

- **`getCurrencySymbol()`** — jauna funkcija `currencies.ts`; katrai valūtai pievienots `symbol` lauks (EUR → €, USD → $, GBP → £, PLN → zł, SEK/NOK/DKK → kr)
- **`formatMoney` / `formatMoneyDisplay`** — tagad pieņem `currency?: string | null` parametru un izmanto `getCurrencySymbol()` simbolu; iepriekš bija hardkodēts `€`
- **`estimate-table.tsx`** — `currency` prop propagēts caur visu komponentu ķēdi: `EstimateTable` → `EstimateDndTable` → `EstimateDndTableInner` → `CategoryBlock` → `SubcategoryBlock` → `SortableLineItemRow` → `LineItemRow`; **KOPĀ** žetons tagad rāda pareizo valūtas simbolu; kataloga hintu cenas `EstimateLineItemNameField` arī iegūst `currency`
- **`estimate-position-table.tsx`** — `currency` prop pievienots `EstimatePositionDndTable` sub-komponentam un propagēts no `EstimatePositionTable` caur `EstimatePositionDndTable`
- **Kolonu virsraksti** — `getUnitPriceSubheaderLabels(currency)` jau bija ieviests v1.2.5; šajā versijā salabota prop propagācija, kas iepriekš nenonāca līdz renderēšanas slānim

### v1.2.5

**Individuāls apjoms katram projektam — mērvienība, ikona, korekciju inputs**

- **`variableQuantity` uz `EstimateLineItem`** — karodziņš pārvietots no kataloga pozīcijas uz tāmes rindu (`item.variableQuantity`); `isVariableQuantityLineItem` pārbauda vispirms rindu, tad katalogu; klonējot no sagataves (`clone-sagatave-for-project.ts`) `variableQuantity` rindām `quantity = 0`; sinhronizācija no sagataves uz projektu pie lapas ielādes (`sync-variable-quantity.ts`)
- **Mērvienība no materiāla** — kad `variableQuantity = true`, saglabājot pozīciju modalī mērvienību ņem no pirmā piesaistītā materiāla (piem. "Kanalizācija d.110" → "m"); ja materiāla nav — `draft.unit` vai "gab."
- **Sagatave (`/estimate`)** — slēdzis **Individuāls apjoms katram projektam** katrā pozīciju modalī (`PositionVariableQuantityField`); ieslēdzot: notīra `moduleSizeAttachment`; `fa-random` ikona rindā pie nosaukuma (`estimate-position-table`); moduļa apjoma brīdinājums slēpts, ja `variableQuantity`; mērvienība tabulā — `item.unit` nevis moduļa atvasinājums
- **Projekta tāme (`/[id]`)** — `fa-random` ikona (sarkanā) redzama **tikai** rindām ar `variableQuantity = true`; klikšķis uz ikonas noņem `variableQuantity`; ikona nobīdīta 5 px uz leju; `variableQuantity` rindām `EstimateQuantityInput` ar `emptyValue={0}`; sarkana rinda (`bg-red-50/60`) ja apjoms ≤ 0; **Saglabāt** bloķēts, ja kāda `variableQuantity` rinda bez apjoma; `displayUnit` ignorē `moduleSizeUnit` šādām rindām
- **Moduļa korekciju inputs** (`module-size-attach-item-row.tsx`) — lokāls `useState` (`inputValue`) nodrošina tūlītēju ievades atjauninājumu neatkarīgi no vecāka re-render; `useEffect` sinhronizē no `state.adjustment` tikai ārēju izmaiņu gadījumā
- **Modālis** — `app-modal.tsx` pievienots `overflow-x-hidden` panelim, lai novērstu horizontālo ritināšanu
- **Katalogs (`/positions`)** — `variableQuantity` toggle noņemts no pozīciju kataloga UI (pārvietots uz sagataves tāmes rindu līmeni)

### v1.2.4

**Moduļa lieluma picker — akordeons un auto-atvēršana**

- **Akordeons** — katras `ModuleCard` sadaļas galvene (`PAMATS`, `PAMATA IZGRIEZUMI` u.c.) ir klikšķināma: atvērt vienu sadaļu aizver pārējās; chevron ikona rāda stāvokli
- **Auto-atvēršana pie labošanas** — ja pozīcijai jau ir saglabāts `moduleSizeAttachment`, modāli atverot automātiski atveras tā sadaļa, kurā atrodas piesaistītais `itemKey` (`findSectionForItemKey`); sākotnēji visas sadaļas aizvērtas
- **Sync ar `useEffect`** — `isAttachedModule` vai `attachment.itemKey` mainoties (piemēram, atverot modāli ar saglabātu piesaisti), atveras pareizā sadaļa bez manuālas iejaukšanās
- **`key={draft.id}`** uz `ModuleSizeAttachPicker` `position-modal.tsx` — garantē pilnu remount un `useState` inicializāciju, kad modālī tiek atvērts cits elements

### v1.2.3

**Vairāki materiāli un mehānismi, multi kopsāvilkums, moduļa apjoma brīdinājums**

- **Vairāki materiāli un mehānismi** — `EstimateLineItem` tagad satur `materials: LineItemCatalogRef[]` un `mechanisms: LineItemCatalogRef[]` masīvus; vecais `material`/`mechanism` (singular) saglabāts backward compat kā deprecated; `hydrateCompositeLineItem` automātiski migrē vecos datus uz masīviem
- **Cenu summēšana** — `deriveCompositeUnitPrice` summē visu materiālu cenas un `Σ (kataloga likme × laika norma)` katram mehānismam
- **Position modālis** — katrai pozīcijai var pievienot neierobežotu skaitu materiālu un mehānismu; esošie rāda kā kartītes ar nosaukumu, mērvienību un × noņemšanas pogu; meklēšanas lauks apakšā pievieno nākamo (atiestatās ar `key` triku pēc izvēles)
- **Multi-pozīciju modālis** — tas pats multi-materiālu/mehānismu atjauninājums katrai opcijai (per-opcija `materialAddKey`/`mechanismAddKey`)
- **Multi opciju kopsāvilkums** — katras opcijas kartiņas apakšā `dl` ar Darbs / Materiāli / Mehānismi / Vienības cena (dinamiski atjauninās)
- **Moduļa apjoma brīdinājums** — pozīcijas rinda sarkanā tonī (`bg-red-50/60`) + `fa-exclamation-triangle` aiz nosaukuma + teksts **Nav pievienots moduļa apjoms** zem nosaukuma, ja `moduleSizeOptions.length > 0` un `!item.moduleSizeAttachment`
- **Tooltip** — Materiāli/Mehānismi šūnās tooltip rāda viena nosaukumu vai vairāku nosaukumus komatu atdalītus
- **Stale cenu indikators** — pārbaudīts pret masīvu (`resolveEffectiveMaterials`/`resolveEffectiveMechanisms`), nevis singular lauku

### v1.2.2

**Projektu arhīvs un stale brīdinājumu precizēšana**

- **Arhīvs** — poga `fa-archive` blakus **Jauns projekts** (`project-page-actions.tsx`); skats `/?archive=1` ar visiem projektiem
- **Statusa filtrs** — radio rinda pirms saraksta: **Visi**, **Aktīvie**, **Procesā** (`approved`), **Pabeigtie**, **Noraidītie** (`project-status-filter.tsx`, `filter-projects.ts`)
- **Repository** — `listAllProjects()` visiem statusiem; galvenais saraksts joprojām filtrē `active` + `approved`
- **Stale brīdinājumi** — `shouldShowStaleCatalogPriceWarnings()` tikai `active`; noraidītiem (un apstiprinātiem/pabeigtiem) bez sarkanās apmales, banera un **Atjaunot cenas**
- **Noņemts** — `add-project-button.tsx` (aizstāts ar `project-page-actions.tsx`)

### v1.2.1

**Kopēt vienmēr un pabeigts projekts**

- **Kopēt** — `fa-copy` redzama **vienmēr** (arī apstiprinātiem projektiem), lai var klonēt tāmi kā tā bija
- **Pabeigts** — jauna poga `fa-check-double` apstiprinātiem projektiem (`approved` → `completed`); pēc apstiprināšanas modālā projekts pazūd no `/` saraksta, bet paliek DB; atverams caur tiešu saiti `/{id}`
- **Kartes darbības** — Labot/Dzēst un Noraidīts tikai `active`; Apstiprināts tikai `active`; Pabeigts tikai `approved`
- **Statusa loģika** — `isProjectVisibleInList`: `active` + `approved`; `isProjectEstimateLocked`: `approved` + `completed`
- **Supabase** — `027_project_completed_status.sql` (paplašina `projects_status_check` ar `completed`)
- **UI** — `IconActionButton` variants `complete` (teal hover)

### v1.2.0

**Novecojušas cenas, tāmes apstiprināšana un projekta statuss**

- **Novecojušas kataloga cenas** — saglabātām projekta tāmēm (`meta.savedAt` vai legacy heuristika) salīdzina iesaldētās cenas ar katalogu; **sarkanās šūnas** materiālu/mehanismu vienības un apjoma kolonnās (`stale-catalog-price.ts`, `resolveStaleCatalogPriceHints`)
- **Projektu saraksts** — sarkanā kartes apmale + **Ir jauninājumi izcenojumos** (`listProjectIdsWithStaleCatalogPrices`); apstiprinātie projekti izlaisti
- **Projekta lapa** — baneris **Pieejami jauni izcenojumi**; **Atjaunot cenas** atjaunina cenas tabulā no kataloga bez DB saglabāšanas (**Saglabāt** paliek dirty, ja ir izmaiņas)
- **Apstiprināts** — `updateProjectStatusAction` → `approved`; tāme read-only (`estimateLocked`); zaļš statusa baneris; bez stale brīdinājumiem un **Atjaunot cenas**; backend bloķē `saveProjectEstimate` / datumu labošanu; kartē paslēpti Kopēt/Labot/Dzēst
- **Noraidīts** — `rejected`; pazūd no `/` saraksta (`isProjectVisibleInList`), ieraksts DB paliek; pēc apstiprināšanas `router.push("/")`
- **Supabase** — `026_project_status.sql` (`projects.status`, check constraint, index); `npm run db:migrate` obligāts pirms statusa pogām
- **Repository** — progresīvs `SELECT` fallback, ja trūkst `status` vai `project_description` kolonnas (līdz migrācijai / PostgREST schema reload)
- **UI** — `ConfirmModal` apstiprināšanai/noraidīšanai; piesaistītais moduļa lielums zem nosaukuma (`footer`); kājene **Kopā** ar `formatAmountDisplay` (bez `€`)

### v1.1.32

**Projekta kopēšana ar tāmi**

- **Kopēt** — jauna ikonu poga (`fa-copy`) projekta kartē (`project-card-actions.tsx`); atver **Jauns projekts** modāli ar tukšiem kontaktu laukiem un avota moduli iepriekš aizpildītu
- **Tāmes klons** — izveides laikā jaunā tāme tiek klonēta no avota projekta (`createProject` + `copyEstimateFromProjectId`), nevis no Sagataves; izmanto `cloneSagataveDocumentForProject` ar jauniem ID un `multiOptionLinks`
- **UI / API** — `ProjectFormModal` `copyFromProject`; `CreateProjectInput.copyEstimateFromProjectId`; `IconActionButton` variants `copy`

### v1.1.31

**Tāmes saglabāšana, eksports un ciparu formatēšana**

- **Saglabāt tāmi** — jauna poga zem tāmes tabulas projekta skatā (`/[id]`); saglabā `title`, `meta` un `categories` uz `estimates` tabulā; pirms saglabāšanas cenas tiek **iesaldētas** (`positionPriceId` nomainīts pret faktisko `unitPrice`) — kataloga izmaiņas neieetekmē jau saglabātās tāmes; dirty tracking ar `savedSnapshot` (serialized compare)
- **Saglabāts indikators** — blakus pogai rāda "Nesaglabātas izmaiņas" vai "Saglabāts: DD.MM.YY" (no `estimates.updated_at`); datums tiek ielādēts no DB pie lapas atvēršanas
- **Termiņa atpakaļskaitīšana** — zem "Tāmes termiņš" lauka rāda "X dienas līdz termiņam" / "Termiņš šodien" / "Termiņš beidzies pirms X d." (sarkans), tikai kad tāme saglabāta
- **PDF (piedāvājums)** un **Excel (tāme)** — pogas parādās kad tāme saglabāta un nav izmaiņu; PDF ģenerē `@react-pdf/renderer` (`/api/estimates/[id]/pdf`): A4, kategoriju sekcijas, `hiddenInOffer` apakšsadaļas kā viena kopsummas rinda, lapas numurs; Excel ģenerē `xlsx` (`/api/estimates/[id]/excel`): pilna cenu detaļa (V.cena + Kopā × Darbs/Materiāli/Mehānismi); abi maršruti autorizēti (`getCurrentUser`)
- **Ciparu formatēšana** — `addThousandSeparators()` helper `calculate-line.ts`; visi `formatAmount`, `formatAmountDisplay`, `formatMoney`, `formatMoneyDisplay`, `formatQuantityDisplay` tagad rāda atstarpi ik pēc 3 cipariem (piem. `1 234 567.89`); Cursor rule `number-formatting.mdc`
- **Bug fix** — `calculateEstimateTotals` tagad pareizi reizina ar daudzumu arī pozīcijām ar `moduleSizeAttachment` (iepriekš ignorēja `item.quantity`, ja `position.variableQuantity` nebija `true`)
- **Sagatavotājs** — lauks noņemts no tāmes galvenes
- **Jauni faili** — `app/lib/exports/estimate-pdf.tsx`, `app/lib/exports/estimate-excel.ts`, `app/api/estimates/[projectId]/pdf/route.ts`, `app/api/estimates/[projectId]/excel/route.ts`
- **Jaunas atkarības** — `@react-pdf/renderer`, `xlsx`; `next.config.ts` → `serverExternalPackages`

### v1.1.30

**Kompozīts pozīciju modelis — laika norma, Darbs, multi-pozīciju aprēķini**

- **Jaunais kompozīts modelis** — `composite-line-item.ts`: `isCompositeLineItem`, `deriveCompositeUnitPrice`, `hydrateCompositeLineItem`, `createCompositePosition`; pozīcijas var saturēt `laborTimeNorm`, `material` (kataloga atsauce), `mechanism` (kataloga atsauce)
- **Vienības cena — 6 kolonnas** — Laika norma · Darba samaksas likme · Darbs · Materiāls · Mehānismi · Kopā; `unit-price-columns.ts`, `EstimateUnitPriceCells` (`estimate-unit-price-cells.tsx`)
- **Apjoma cena — Darbietilpība (c/h)** — jaunā pirmā kolonna `= apjoms × laika norma` (`volume-price-columns.ts`, `estimate-volume-sum-cells.tsx`)
- **Laika norma — tiešā rediģēšana tabulā** — `LaborTimeNormInput` ar `−`/`+` pogām (0,01 solis); border un pogas redzamas tikai uz hover/fokusa; sagatavē gan parastajai, gan multi-pozīciju opcijām
- **Mērvienība no moduļa** — kompozītajām rindām mērvienību iegūst automātiski no `moduleSizeAttachment`; lauks noņemts no modāļiem
- **Multi-pozīcijas darba šūna** — labots: kompozītajām multi-opcijām `Darbs` vienmēr aprēķināts ar `deriveCompositeUnitPrice` (nevis no kataloga nosaukuma sakritības); tāpat labots `estimate-position-table` un `estimate-table`
- **Multi-pozīcijas nosaukums** — ja nav ievadīts, automātiski ņem no materiāla vai mehānisma nosaukuma
- **Tooltip uz šūnām** — Materiāls un Mehānismi šūnās tooltip parāda kataloga pozīcijas nosaukumu
- **Piesaistītā moduļa lieluma etiķete** — strukturēts inline teksts (sadaļa · apzīmējums · vērtība) zem pozīcijas nosaukuma
- **Nosaukuma austiski** — visas nosaukuma šūnas vienmēr kreisajā pusē (noņemta nosacītā labā izlīdzināšana)
- **Jaunie faili** — `composite-line-item.ts`, `unit-price-columns.ts`, `volume-price-columns.ts`, `estimate-unit-price-cells.tsx`, `labor-time-norm-input.tsx`, `position-modal.tsx`, `position-modal-context.tsx`, `catalog-hint-field.tsx`, `module-size-attach-picker.tsx`

### v1.1.29

**Pozicijas — materiāli/mehānismi, filtrs un cenas attēlojums**

- **`/positions`** — katalogā tikai **Materiāls** un **Mehānismi** (darba rindas slēptas; pievienot/labot tikai šos veidus); **Darbs** joprojām no **Uzstādījumi** stundas likmes tāmēs
- **Veida filtrs** — kompakts radio zem meklēšanas: **Visi** / **Materiāls** / **Mehānismi** (kopā ar meklēšanu)
- **Cena** — ja nav iedota, rāda `- EUR / gab.` (nevis `—`)
- **Lib / UI** — `CATALOG_POSITION_COST_TYPES`, `filterCatalogPositions`, `PositionCostTypeFilter`; `PositionCostTypeField` ar `catalogOnly`; `position-cost-type-filter.tsx`

### v1.1.28

**Frontoni, moduļa apjomi piedāvājumā un tāmes UX**

- **Frontoni** (`Projekta apraksts` → Sienas) — vairāki frontoni ar augstumu, **Skaits** un **Pamata plakne** (pamata platums/dziļums; L formā **L Pamata platums** / **L Pamata dziļums**); laukums `platums × augstums / 2 × skaits`; pieskaitīts **Ārsienu kvadratūra (neto)**; moduļa lielumu kopsavilkumā (`gablePediments` JSON)
- **Piedāvājums** (`/[id]`) — `moduleSizeAttachment` apjoms **Apj.** kolonnā (read-only); sinhronizācija no sagataves/moduļa (`sync-module-size-quantities.ts`); multi tikai opciju select (bez modāļa/dzēšanas/**+ Multi**)
- **Apjomi** — apaļošana līdz 2 cipariem (`roundToTwoDecimals`, `variable-quantity.ts`, moduļa lielumu kopsavilkums)
- **Tabula** — materiālu un mehānismu nosaukumi labajā pusē (sagatave + projekts)
- **UI** — visur **Gabali** → **Skaits** (frontoni, logi, durvis, jumts)
- **Lib** — `foundation-plane-options.ts`; `project-description-calculations.ts` frontonu formula un ārsienu neto

### v1.1.27

**Sagatave — moduļa lieluma piesaiste un piedāvājuma redzamība**

- **Piesaisīt moduļa lielumu** — darba pozīcijām `fa-clipboard-list`; modālis ar moduļu `project_description` lielumiem (Pamats, izgriezumi, Sienas, Logi, Durvis, Jumts); viens piesaistes slēdzis; **+** korekcijas (`adjustments`) tikai tāmes rindai, modulis nemainās; atvasināto lielumu pārrēķins; auto-saglabāšana ar toast; apjoms zem nosaukuma (`moduleSizeAttachment` JSON)
- **Subkategorija** — `fa-eye` / `fa-eye-slash` nosaukuma šūnā; `hiddenInOffer` sagataves JSON (piedāvājuma lietošana vēlāk)
- **Toast** — `FeedbackToastProvider` `app/layout.tsx` un `(protected)/layout.tsx`
- **Lib / UI** — `format-module-size-summary.ts`, `apply-module-size-adjustments.ts`, `module-size-attachment.ts`, `has-defined-labor.ts`, `attach-module-size-*`, `attached-module-size-label.tsx`, `subcategory-offer-visibility-toggle.tsx`; `listBuildingModuleSizeOptions()`; `EstimateLineItemNameField` `footer` slot

### v1.1.26

**Projekta apraksts un moduļu datu indikators**

- **Projekta apraksts** — pilna forma moduļa detaļā (`/modules/[id]`) un individuālajam projektam (`/[id]/module-data`): Pamats (perimetrs, tilpums, L veida paplašinājums, izgriezumi), Sienas, Logi, Durvis, Jumts (plaknes, tekne, notekas, kopsummas); **Saglabāt** ar dirty stāvokli; JSON `project_description` uz `building_modules` un `projects`
- **`/modules` saraksts** — sarkana **`fa-house-damage`** ikona, ja trūkst vizualizāciju vai projekta PDF; tooltip **Nav ievadīti moduļu dati** (`module-missing-data-icon.tsx`, `isBuildingModuleDataComplete`)
- **Supabase** — `025_project_description.sql`; `missing-column` fallback, ja migrācija vēl nav palaista
- **Lib / UI** — `project-description-types.ts`, `project-description-calculations.ts`, `parse-project-description.ts`, `module-project-description-form.tsx`, `building-module-data.ts`; `Tooltip` `labelClassName` platākiem tooltipiem

### v1.1.25

**Projekta tāme — sagatave, Apjoma cena un read-only kataloga rindas**

- **Jauns projekts** — tāme klonēta no **Sagatave** (`clone-sagatave-for-project.ts`, `project-estimate-base.ts`); `multiOptionLinks` nodoti uz `EstimateTable`; tukšām tāmēm fallback no sagataves
- **Tabula** (`/[id]`) — **Apj.** kolonna vienmēr redzama; **Apjoma cena** (Darbs / Materiāls / Mehānismi / Kopā) = `apjoms × vienības cena` tikai **mainīgs apjoms** rindām; kājene summē komponentus apjoma kolonnās, **Kopā** apjoma sadaļā
- **Read-only** — kataloga saistītām rindām nosaukums, mērvienība un **vienības cena**; cenas no kataloga / stundas likmes (`calculate-totals` saskaņots ar attēlojumu)
- **Multi piedāvājums** — viena rinda ar opciju **select**, **Multi** badge + nosaukums zem select (ne visas opcijas + radio)
- **Attēlojums** — `formatAmountDisplay` / `formatMoneyDisplay`: **0** → **—** visās tāmes summu šūnās
- **UI** — `estimate-volume-sum-cells.tsx`, `estimate-quantity-input.tsx`; galvenē pozīciju/rindu skaits un **+ Tāmes pozīcija**

### v1.1.24

**Multi opciju saites (nevis visu multi bloku)**

- **Opciju līmeņa saite** — `fa-link` uz katras aizpildītas multi opcijas rindas; velc uz opciju **citā** multi (ne uz vienu un to pašu multi); var apvienot 2+ opcijas vienā grupā
- **UI** — zem opcijas nosaukuma pelēks saraksts ar saistītajām (`multi nosaukums · opcija`); `fa-times` atvieno abos virzienos
- **Piedāvājums** (`/[id]`) — radio izvēle vienā multi **divvirzienu** ieslēdz atbilstošās saistītās opcijas citos multi; **Neviena opcija** notīra saistīto grupu
- **Persist** — sagatavē `multiOptionLinks` JSON (`estimate_positions.sections` kā `{ sections, multiOptionLinks }` vai tikai masīvs bez saitēm); atpakaļsaderība ar veco masīva formātu
- **Lib / UI** — `multi-position-links.ts`, `multi-position-link-handle.tsx`; `serialize-document.ts` parse/build wrapper

### v1.1.23

**Multi-pozīcijas, sekciju sakļaušana un mainīgs apjoms**

- **Multi-pozīcija** — **+ Multi** pie tāmes pozīcijas vai subkategorijas (sagatave + projekta tāme); modālis ar nosaukumu, kataloga opcijām (OPCIJA 1, 2, …), drag-reorder opcijām, automātiska tukša nākamā rinda; klikšķis uz nosaukuma vai poga **Labot**; visa multi bloka pārvietošana tabulā ar grip; piedāvājumā radio izvēle — no citām multi **paslēptas tikai izvēlētās** opcijas; vienā multi aizliegti dublikāti, bet tā pati kataloga pozīcija atļauta dažādās multi
- **Sakļaušana** — chevron uz tāmes pozīcijas un subkategorijas rindām; stāvoklis cookie `eb_estimate_collapsed_{documentId}`; **+ Sub** / **+ Multi** / **+ Pozīcija** atver sakļauto vecāku
- **Mainīgs apjoms** — `/positions` pievienošanas/labošanas modāļos; `position_prices.variable_quantity` (`024`); projekta tāmē **Daudz.** kolonna tikai saistītām pozīcijām ar šo karodziņu; kopsummā `quantity × unit price`
- **Tabula / DnD** — katra sortējama vienība savā `<tbody>` (derīgs HTML5, bez hydration kļūdām); `AppModal` renderē caur `createPortal` uz `document.body`
- **Lib / UI** — `multi-position.ts`, `multi-position-modal.tsx`, `estimate-multi-position-row.tsx`, `collapsed-sections-cookie.ts`, `use-collapsed-estimate-sections.ts`, `variable-quantity.ts`, `PositionVariableQuantityField`

### v1.1.22

**Sagatave — subkategorijas un tikai lasāmas cenas**

- **Sagatave** (`/estimate`) — **+ Sub** un subkategoriju rindas kā projekta tāmē (`/[id]`); pozīcijas zem tāmes pozīcijas vai subkategorijas; DnD (sekcijas, subkategorijas, rindas) caur `reorderEstimate`
- **Vienības cena** sagatavē — **read-only**; darbs no **Uzstādījumi** stundas likmes, materiāli/mehānismi no **Pozicijas**; `forceCatalogPrices` ielādē un saglabā
- **Struktūra** — `EstimatePositionSection` = `EstimateCategory` (`subcategories` + `items`); `normalizeEstimatePositionSection` migrē vecos JSON ierakstus; `hydrateSectionsWithCatalogLinks` apstrādā arī subkategoriju rindas

### v1.1.21

**Noņemts legacy maršruts `/estimate-positions`**

- Dzēsts `app/(protected)/estimate-positions/` (redirect uz `/estimate` vairs nav); sagatave tikai **`/estimate`**
- `app/lib/estimate-positions/` — bez izmaiņām (DB un tabulas loģika)

### v1.1.20

**Sagatave — cenas pēc veida, bez kopsummas rindas**

- **Kataloga cenas** — Materiāls / Mehānismi / Darbs iet attiecīgajā **Vienības cena** kolonnā (ielāde, hint izvēle, blur, saglabāšana); `buildUnitPriceForCatalogPosition`, `hydrateLineItemWithCatalog`
- **Sagatave** (`/estimate`) — noņemta apakšējā **Kopā** kopsummu rinda (`estimate-position-table`); projekta tāmē (`/[id]`) kopsumma paliek
- **Dokumentācija** — `app/(protected)/estimate-positions/` tikai legacy redirect; `app/lib/estimate-positions/` sagataves loģika

### v1.1.19

**Sagatave table, catalog hints & Pozicijas sync**

- **Tāmes tabula** (sagatave + projekts) — noņemtas **Daudz.** un **Apjoma summa** kolonnas; paliek **Vienības cena**; projekta tāmē kopsummas rindā summētas vienības cenas
- **Kataloga hinti** — rindas nosaukuma laukā autocomplete no `/positions`; izvēle aizpilda mērvienību un cenas (darbs no stundas likmes, materiāli/mehānismi no kataloga)
- **Sagatave** — **Saglabāt**, dirty stāvoklis, modālis pie navigācijas prom; `estimate_positions` (`020`–`021`)
- **Sinhronizācija** — sagatavē vai projekta tāmē mainīts nosaukums/mērvienība atjaunina saistīto ierakstu `/positions` (`positionPriceId`, automātiska saite ielādē, sync pie blur/saglabāšanas)

### v1.1.18

**Route — Sagatave `/estimate`**

- **Sagatave** maršruts: `/estimate-positions` → **`/estimate`**; vecie URL pārvirza uz jauno

### v1.1.17

**Sagatave — viena sagatave, tieša tabula**

- **`/estimate-positions`** — atver tāmes tabulu uzreiz (nav kartīšu saraksta); `ensureDefaultEstimatePosition()` izmanto vienu DB ierakstu vai izveido **Sagatave**
- **`/estimate-positions/[id]`** — pārvirza uz `/estimate-positions`
- **Noņemts** — vairāku sagatavju CRUD UI (kartītes, pievienošanas modālis, dzēšana)

### v1.1.16

**Nav — Sagatave**

- **Nav** label **Tāmes pozicijas** → **Sagatave** (`/estimate-positions` route unchanged); list page title and back link updated

### v1.1.15

**Nav — noņemta Sagatave**

- **Nav** — no top menu: **Sagatave** (`/blanks`)
- **Removed** — `app/(protected)/blanks/page.tsx`, `app/lib/blanks/sample-blocks.ts`

### v1.1.14

**Pozicijas — cenu vēsture**

- **`/positions`** — row action **Vēsture** (`fa-history`, sky hover); extra-wide read-only modal lists each saved unit price (newest first) with `dd.mm.yy` date, amount + optional **No …** delta vs previous entry
- **Veikals** column in history — line 1: store · contact; line 2: phone + email with Font Awesome icons
- **Atjaunot cenu** — every save appends a row to `position_price_history` (price, date, supplier snapshot)
- **Supabase** — `022_position_price_history.sql` (table + backfill from existing `position_prices`); RLS deny for clients
- **Lib / UI** — `listPositionPriceHistory`, `getPositionPriceHistoryAction`, `PositionPriceHistoryModal`; `IconActionButton` variant `history`

### v1.1.13

**Nav split, position cost types & settings hourly rate**

- **Nav** — **Pozicijas** (`/positions`, was **Tāmes Pozīcijas**); new **Tāmes pozicijas** (`/estimate-positions`, placeholder); order: Ēku moduļi → Sagatave → Tāmes pozicijas → Pozicijas
- **Pozicijas** — **Izmaksu veids** per row: Darbs / Materiāls / Mehānismi (`cost_type`); table column **Veids**; add/edit modals use horizontal radio-style row above name + unit
- **Uzstādījumi** — **Darbinieka standarta stundas likme** with currency suffix in input; preview sidebar shows saved rate
- **Supabase** — `018_company_settings_default_hourly_rate.sql`; `019_position_prices_cost_type.sql`
- **Lib** — `position-cost-type.ts`, `default-hourly-rate.ts`, `PositionCostTypeField`

### v1.1.12

**Individual project module data, estimate dates & project UX**

- **`/[id]/module-data`** — individual projects (`building_module_id` null): viz image + project PDF uploads (same UI as `/modules/[id]`); header shows client name + address; shared `ModuleDataEditor` / `ModuleDataEditorPanel`
- **Estimate header** — 3-column layout: map · module visualizations (catalog or project uploads) · meta + actions
- **Moduļa dati** — icon on project cards / estimate header; amber highlight when viz or PDF missing; optional spotlight overlay (blur, tooltip above overlay, **ESC** / top-right **X** to dismiss)
- **Datums / Tāmes termiņš** — default from `created_at` + **Uzstādījumi** validity days; manually editable; saved to `estimates.meta`; changing Datums recalculates termiņš
- **Uzstādījumi** — **Tāmes derīguma termiņš** (days); migration `016_company_settings_estimate_validity.sql`
- **Nav** — **Sagatave** (was Sagataves), moved after **Tāmes Pozīcijas**
- **Projects list** — when Supabase configured, no longer falls back to demo `SAMPLE_PROJECTS` on empty DB or query error
- **Supabase** — `017_project_module_blocks.sql` (`projects.visualization_blocks`, `projects.project_blocks`); `/api/modules/asset` accepts `projects/{id}/…` paths
- **Server actions** — `project-module-actions.ts`, `updateProjectEstimateDatesAction`

### v1.1.11

**Projects — building module link & smarter modal exit**

- **Jauns projekts / Labot** — required **Modulis** select (catalog modules + **Individuāls projekts**); persisted as `projects.building_module_id` (nullable FK); server validation on create/update
- **Project cards** — module name shown above client name on `/`
- **`AppModal`** — optional `dirty` prop; backdrop click closes **without** confirm when form unchanged; all form modals pass `dirty` (project, module, position, invite, price update)
- **Supabase** — migration `015_project_building_module.sql`
- **Cursor** — `modal-confirm-exit.mdc` documents `dirty` behaviour

### v1.1.10

**Ēku moduļi — catalog, detail, files & outline**

- **`/modules`** — Supabase-backed list; **Pievienot Moduli** (name); cards with link to detail, **Labot**, **Dzēst**; empty state text
- **`/modules/[id]`** — two-column layout: left **Vizualizācijas** (images only, 2-column thumbnail grid, drag reorder) stacked above **Projekts** (PDF only, same grid); right **Projekta apraksts** placeholder inputs (not saved yet); outline categories below (no “Aptaksts” header)
- **File uploads** — `module-assets` Storage bucket; `visualization_blocks` / `project_blocks` JSON on `building_modules`; server actions; delete removes storage files
- **PDF previews** — `pdfjs-dist` legacy canvas render via `/api/modules/asset` proxy; `<embed>` fallback; `postinstall` copies worker to `public/`; `proxy.ts` excludes worker from session middleware
- **Modals** — `AppModal` Enter submits forms; `ConfirmModal` Enter confirms (focus-safe); `ConfirmModal` uses refs for stable `useEffect` deps
- **Supabase** — migrations `010`–`014` (`building_modules`, outline, blocks, `module-assets` bucket)

### v1.1.9

**Tāmes pozicijas — catalog, prices & supplier tooltips**

- **`/positions`** — renamed nav label **Tāmes pozicijas**; searchable table (name, price as `amount EUR / unit` + `dd.mm.yy` date, actions); zebra rows + muted dark-green hover
- **Pievienot / Labot** — wider modals; name + unit (80/20, unit hints via portal dropdown, auto-focus on add)
- **Atjaunot cenu** — extra-wide modal; unit price or volume × total calc; currency/unit input suffixes from company settings; supplier store, contact, email, phone; section cards; **Atcelt** before save
- **Supplier tooltip** on price hover (`cursor: help` on price, `default` elsewhere); white card with icons; phone shown as `+371 29123456` via `formatDisplayPhone`
- **Supabase** — `position_prices` table + seed (`008_position_prices.sql`); supplier columns (`009_position_price_supplier.sql`); server actions + `app/lib/positions/repository.ts`
- **`ModalFormActions`** — shared **Atcelt** + primary button row on all form modals (`AppModal` optional `panelMaxWidthClassName`)
- **`AppModal`** — backdrop click confirm (“Izbeigt darbību?”); configurable panel width presets

### v1.1.8

**Estimate editor — map + meta header layout**

- Project page (`/[id]`): document meta moved **above** the table block; **Google Maps** (left) and meta fields (right) in a **50/50** grid; map height matches meta column
- Meta fields: **Objekts** full-width textarea; **Sagatavotājs**, **Datums**, **Tāmes termiņš** below in one row
- Shared `AddressMapEmbed` + `buildGoogleMapsEmbedUrl` (used in estimate header and address autocomplete)
- Cursor rule: `typecheck` + `build` required before GitHub commit/push

### v1.1.7

**Users invite, estimate termiņš & local auth fixes**

- **Lietotāji** — **Uzaicināt** button + modal; `inviteUserAction` / `inviteUserByEmail`; `validateRequiredEmail` on client and server
- Estimate meta: editable **Tāmes termiņš** (`meta.deadline`); default +30 days on new project; header total label **Kopā**
- **Labot projektu** — Google Maps embed for pre-filled address (debounced preview)
- Settings preview sidebar widened (+15%)
- Fix missing `calculate-totals.ts` module (build error)
- Mitigate localhost **431** cookie bloat: larger HTTP header limit in `dev`/`start`; middleware purges foreign `sb-*` cookies (`storage-key.ts`)

### v1.1.6

**Projects — edit, delete & card actions**

- **Labot** on project card opens `ProjectFormModal` pre-filled with client contact data; **Saglabāt** updates `projects` and syncs estimate title/meta
- **Dzēst** opens `ConfirmModal`; confirm removes project from DB (estimate cascades)
- Shared `ProjectFormModal` for create and edit; `parseStoredPhone` splits stored number for edit form; `PhoneField` skips geo lookup when editing
- `IconActionButton` variants (edit/delete/approve/reject) — colored background and icon on hover only
- Global `cursor: pointer` on buttons in `globals.css`; Cursor rule `button-cursor-pointer.mdc`

### v1.1.5

**Projects — create flow, cards & address autocomplete**

- **Jauns projekts** on `/` — modal (`AppModal`) with client name, phone, email, address; creates `projects` row + empty `estimates` document
- Phone: country code from IP (`/api/geo/calling-code`), selectable prefix; email/phone validation; invalid fields highlighted
- Address: Google **Places API (New)** via server `/api/places/autocomplete` (Referer header for restricted keys); dropdown above modal
- Project cards: name, email + phone (one line), address; action icons (Edit, Delete, X) with black tooltips
- Migration `007_project_client_contact` — `phone`, `email` on `projects`
- `IconActionButton`, `ProjectCard`, `FeedbackToast`; CSP updates for Google; Cursor rules for modals, tooltips, toasts

### v1.1.4

**Bank IBAN auto-fill & RLS hardening**

- Settings: Latvian IBAN auto-fills bank name and SWIFT (`resolve-bank-from-account.ts`); account field first, bank row appears below
- Migration `006_rls_deny_client_access` — replace `using (true)` policies with client deny (fixes Supabase “RLS Policy Always True”)
- `supabase-migration-security.mdc` — document lint traps; forbid blanket `true` policies

### v1.1.3

**Settings, nav refresh & DB security**

- English routes: `/`, `/modules`, `/blanks`, `/positions`, `/users`, `/settings`; labels Sagataves, Cenu pozicijas, Ēku moduļi
- Top nav: user avatar, name, sign-out; minimal underline active state
- **Lietotāji** — real Supabase Auth users with Google avatars (`app/lib/users/repository.ts`)
- **Uzstādījumi** — company form (name, address, reg/VAT, bank, contacts, currency) + drag-and-drop logo upload to Storage
- Migrations: `003_company_settings`, `004_company_logo`, `005_security_hardening` (RLS policies, `set_updated_at` search_path, storage listing fix)
- `db:migrate` tracks applied files in `schema_migrations`; bootstraps existing DBs; applies pending only
- Cursor rules: auto-migrate after SQL, Supabase security checklist for new migrations

### v1.1.2

**Google login & DB migrations**

- Full-page login gate: centered “Pierakstīties ar Google” when not authenticated; app hidden until sign-in
- Google OAuth via Supabase (`signInWithGoogle`, `/auth/callback`, `LoginGate`)
- Protected routes moved to `app/(protected)/` with server-side session check
- `db:migrate` tries Supabase pooler (session + transaction) before direct host; `SUPABASE_DB_REGION` in `.env.example`

### v1.1.1

**README & release workflow**

- README: env security note (secrets in `.env.local` only), roadmap, corrected project structure tree
- Cursor rule: `README update` trigger with default **patch** (+0.0.1) bump; minor/major only when explicitly requested

### v1.1.0

**Supabase integration**

- `@supabase/ssr` clients (browser, server, admin) and session refresh via `proxy.ts`
- Migrations: `projects` + `estimates` tables with seed data
- Project list and detail load from Supabase when configured; sample fallback otherwise
- `npm run db:migrate` and `npm run db:test` scripts

### v1.0.0

**Initial release**

- Next.js estimate editor with categories, subcategories, and line items
- Unit price and volume breakdown (labor, materials, mechanisms)
- Drag-and-drop reorder with cross-container item moves and drop line indicator
- Top navigation: Projekti, Eku moduļi, Definētie bloki, Poziciju Cenas, Lietotāji
- Project list with name/address cards; estimate opens at `/projekti/[id]`
- Shared list-page layout (`SectionPage`, `ListEntryCard`) across sections
- Sample data for projects, modules, blocks, prices, and users
