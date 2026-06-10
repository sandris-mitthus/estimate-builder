# Estimate Builder

Construction estimate editor for Latvian tenders — hierarchical categories, subcategories, and line items with unit prices, volume totals, and drag-and-drop reordering. Next.js app with section-based navigation (projects, building modules, blanks, position prices, users, settings).

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.1.12` (see [Changelog](#changelog))

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
| Tāmes Pozīcijas | `/positions` |
| Sagatave | `/blanks` |
| Lietotāji | `/users` |
| Uzstādījumi | `/settings` |

- **Projekti** — project cards (module name above client name, email, phone, address); **Jauns projekts** modal creates project + empty estimate in Supabase; card actions **Moduļa dati** (individual projects only — amber highlight when viz/PDF missing), **Labot**, **Dzēst**, Apstiprināts / Noraidīts (placeholders) with colored hover icon tooltips; list loads **only real DB rows** when Supabase is configured (no demo fallback on empty/error)
- **Jauns projekts / Labot** — shared `ProjectFormModal` with **required Modulis** select (catalog modules + **Individuāls projekts** last); `building_module_id` on `projects`; client name, phone, email, address; phone country code from IP on create, parsed from stored number on edit; email/phone validation; **Google Places** autocomplete with map preview (including pre-filled address on edit)
- **Ēku moduļi** (`/modules`, `/modules/[id]`) — module catalog in Supabase (`building_modules`); **Pievienot Moduli** (name only); card **Labot** / **Dzēst**; click name opens detail: left column **Vizualizācijas** (image upload grid, 2 per row, drag reorder) + **Projekts** (PDF only, same grid); right column **Projekta apraksts** dummy form (not persisted yet); **aptaksts** outline list below; empty states; toasts on file actions
- **Sagatave** — placeholder catalog list
- **Tāmes pozicijas** (`/positions`) — searchable sortable table of unit-price catalog items in Supabase (`position_prices`); columns **Nosaukums**, **Cena** (`2.91 EUR / gab.` + update date), **Darbības**; **Pievienot pozīciju** / **Labot** modals (name + unit with hints, 80/20); **Atjaunot cenu** modal (direct unit price or volume × total calc, supplier store/contact/email/phone, company currency suffixes); row zebra striping + muted green hover; supplier **tooltip** on price (`cursor: help`); **Atcelt** on all form modals via `ModalFormActions`
- **Lietotāji** — Supabase Auth users (name, email, Google avatar); **Uzaicināt** modal sends email invite via admin API (client + server validation)
- **Uzstādījumi** — company profile (name, address, reg/VAT, bank, contacts, currency, logo)

### Company settings (`/settings`)

- Company name, address, registration number, optional VAT number (hidden in preview when empty)
- **Bank account first** — entering a Latvian IBAN auto-fills bank name and SWIFT on the next row (Swedbank, SEB, Citadele, Luminor, etc.)
- Info phone and email
- Currency select (EUR, USD, GBP, PLN, SEK, NOK, DKK)
- **Tāmes derīguma termiņš** — integer days (suffix **dienas**); default **30**; used for new projects and estimate **Tāmes termiņš** calculation
- **Logo upload** — drag-and-drop or file picker → Supabase Storage (`company-assets` bucket)
- Live preview of company block on the right (wider sidebar column)
- Persisted in `public.company_settings` (singleton row)

### Estimate editor (`/[id]`)

- **Header above table** — **3 columns**: Google Maps embed (left, from **Objekts** address) · module **visualizations** (middle — from linked module or individual project uploads) · meta + actions (right)
- Meta layout: bold module name + action icons; **Tāmes piedāvājums** title + **Kopā** total; client, full-width object address; **Sagatavotājs**, **Datums**, **Tāmes termiņš** in one row
- **Datums** — defaults to project **created_at**; **Tāmes termiņš** — defaults to Datums + validity days from **Uzstādījumi**; both editable and **persisted** in `estimates.meta` (changing Datums recalculates termiņš)
- **Individuāls projekts** — **Moduļa dati** icon opens `/[id]/module-data` (same upload UI as module detail: viz images, project PDFs, description form dummy); incomplete data → amber icon + optional full-page **spotlight** (blur overlay, ESC or **X** to dismiss)
- Excel-style table: categories, optional subcategories, line items
- Columns: name, unit, quantity, unit price (labor / materials / mechanisms / total), volume totals, delete
- Drag-and-drop reorder for categories, subcategories, and items (cross-subcategory / cross-category item moves)
- Drop indicator: thick horizontal line on hover (no slide animation)
- Sticky table header, footer totals row
- Editable estimate number in meta when set

### Data

- **Supabase** (Postgres + Storage) when env is configured
- Falls back to in-memory sample data only when Supabase is **not** configured (configured DB with zero projects shows empty list, not seed cards)
- Estimate **meta dates** persist via server action; categories/title and other meta fields still mostly in React state
- `npm run db:migrate` applies only **pending** migrations (tracked in `public.schema_migrations`)
- App tables use **service-role server access** with RLS deny policies for browser clients

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase** — Postgres + Auth + Storage via `@supabase/ssr` + service role on server
- **Tailwind CSS 4**
- **@dnd-kit** — drag and drop
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

**Schema:** `supabase/migrations/` — `projects` (phone, email, `building_module_id`, `visualization_blocks` / `project_blocks` for individual projects, `007` + `015` + `017`), `estimates`, `position_prices` (`008`–`009`), `building_modules` (`010`–`014`), `company_settings` (incl. `estimate_validity_days`, `016`), `schema_migrations`, Storage `company-assets`, `module-assets` (module + project asset paths)

---

## Project structure

```
app/
├── (protected)/      # Auth-gated routes (nav + pages)
│   ├── layout.tsx      # Login gate or AppNav + children
│   ├── page.tsx        # Project list (/) + create modal
│   ├── actions.ts      # create/update/delete project; updateProjectEstimateDatesAction
│   ├── project-module-actions.ts  # individual project viz/PDF blocks
│   ├── [id]/           # Estimate editor + module-data/
│   │   ├── page.tsx
│   │   └── module-data/page.tsx   # Individual project module uploads
│   ├── modules/        # list + [id] detail; actions (CRUD, blocks, uploads)
│   ├── blanks/
│   ├── positions/      # page + CRUD / price-update server actions
│   ├── users/          # page + inviteUserAction
│   └── settings/
├── api/
│   ├── geo/calling-code/   # IP → phone country code
│   ├── modules/asset/      # Authenticated PDF/image proxy (modules + projects paths)
│   └── places/autocomplete/ # Google Places (New) proxy
├── auth/
│   ├── callback/       # OAuth code exchange
│   └── auth-code-error/
├── components/         # UI (estimate table, positions table/modals, AddressMapEmbed, nav, ModalFormActions, tooltips, toasts)
├── lib/
│   ├── auth/           # getCurrentUser, signInWithGoogle, signOut, mapUserDisplay
│   ├── estimates/      # calculate-totals, resolve-estimate-meta, sample data, DnD reorder
│   ├── form/           # input invalid styles
│   ├── geo/            # country calling codes, IP detect
│   ├── google-maps/    # Places API, build-embed-url
│   ├── modules/        # repository, outline/blocks parse, file-storage (module-assets)
│   ├── positions/      # repository, filter, unit hints, sample fallback
│   ├── projects/       # repository, project-module-data, sample fallback
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

- [ ] Persist full estimate edits to `estimates` table (categories, title, remaining meta)
- [x] Individuāls projekts — per-project module data page, uploads, spotlight prompt
- [x] Estimate meta dates — auto defaults + manual override persisted
- [x] Ēku moduļi — catalog CRUD, detail page, image/PDF uploads, outline (DB); project description form still dummy
- [ ] Sagataves CRUD
- [x] Tāmes pozicijas catalog (`/positions`) — CRUD + unit price updates with supplier info
- [ ] User management beyond read-only list and email invite
- [ ] Use company settings + logo on estimate PDF/header
- [ ] Export estimate (PDF / Excel)

---

## Versioning & commits

Semantic versioning in `package.json`. Each **release** commit:

1. Bump `package.json` `"version"`
2. Add `### vX.Y.Z` under **Changelog** (newest first)
3. End the commit message with `. vX.Y.Z`

**Commit message format:**

```
Short description of what shipped. v1.1.12
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
- `.cursor/rules/feedback-toast.mdc` — save feedback via toast provider

Skip version bump only for typo/docs-only changes when you explicitly say no release.

---

## Changelog

### Unreleased

- (none)

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
