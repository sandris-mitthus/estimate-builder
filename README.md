# Estimate Builder

Construction estimate editor for Latvian tenders — hierarchical categories, subcategories, and line items with unit prices (labor / materials / mechanisms), catalog hints, and drag-and-drop reordering. Next.js app with section-based navigation (projects, building modules, sagatave template, position catalog, users, settings).

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.1.28` (see [Changelog](#changelog))

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

- **Projekti** — project cards (module name above client name, email, phone, address); **Jauns projekts** modal creates project + estimate **cloned from Sagatave** in Supabase; card actions **Moduļa dati** (individual projects only — amber highlight when viz/PDF missing), **Labot**, **Dzēst**, Apstiprināts / Noraidīts (placeholders) with colored hover icon tooltips; list loads **only real DB rows** when Supabase is configured (no demo fallback on empty/error)
- **Jauns projekts / Labot** — shared `ProjectFormModal` with **required Modulis** select (catalog modules + **Individuāls projekts** last); `building_module_id` on `projects`; client name, phone, email, address; phone country code from IP on create, parsed from stored number on edit; email/phone validation; **Google Places** autocomplete with map preview (including pre-filled address on edit)
- **Ēku moduļi** (`/modules`, `/modules/[id]`) — module catalog in Supabase (`building_modules`); **Pievienot Moduli** (name only); cards with **Labot** / **Dzēst**; red **`fa-house-damage`** icon + tooltip **Nav ievadīti moduļu dati** when viz or project PDF missing; click name opens detail: left column **Vizualizācijas** (image upload grid, 2 per row, drag reorder) + **Projekts** (PDF only, same grid); right column **Projekta apraksts** (Pamats, L veida pamats, izgriezumi, Sienas ar **Frontoni** — augstums, skaits, pamata plakne; platums × augstums / 2 × skaits pieskaitīts ārsienu neto kvadratūrai; Logi, Durvis, Jumts — calculated fields, **Saglabāt** persists `project_description` JSON); **aptaksts** outline list below; empty states; toasts on file actions
- **Sagatave** (`/estimate`) — single company-wide estimate template in Supabase (`estimate_positions`); opens editor table directly (`ensureDefaultEstimatePosition()` creates row if missing); hierarchy like project estimates: **tāmes pozīcija** (category) with **+ Sub** / **+ Multi** / **+ Pozīcija**, optional **subkategorijas**, line items and **multi-pozīcijas** under either level; subkategorijā **acs** `fa-eye` / `fa-eye-slash` (tooltip piedāvājuma redzamas / paslēptas pozīcijas; `hiddenInOffer` JSON); **collapse** chevron on category and subcategory rows (state in cookie `eb_estimate_collapsed_{documentId}`); table columns **Nosaukums**, **Mērv.**, **Vienības cena** (Darbs / Materiāls / Mehānismi / Kopā, **read-only** — edit prices in **Uzstādījumi** or **Pozicijas**); line-item name **catalog hints** from `/positions`; hint or linked row fills unit + price from catalog (Darbs → stundas likme, Materiāls / Mehānismi → kataloga cena); **darba pozīcijām** (katalogā definēts darbs) — treknraksts + `fa-clipboard-list` **Piesaisīt moduļa lielumu**: modālis ar ēku moduļu `project_description` lielumiem (Pamats, izgriezumi, Sienas, Logi, Durvis, Jumts), viens piesaistes slēdzis, **+** korekcijas tikai šai rindai (ne modulim); pārrēķina atvasinātos lielumus; automātiska saglabāšana ar toast; piesaistītais apjoms pelēks teksts zem nosaukuma (`moduleSizeAttachment` JSON rindā); **multi-pozīcija** — modal editor (click name or pen icon), drag-reorder options in modal, auto-adds next empty option, duplicate catalog positions blocked **within one multi** only; **multi opciju saites** — `fa-link` uz katras aizpildītas opcijas rindas, velc uz opciju **citā** multi (piem. siltinājums 145 mm ↔ konstrukcija 45×145 mm); zem opcijas rāda saistītās ar `×` atvienošanai; saglabā `multiOptionLinks` JSON (`sections` kolonnā, atpakaļsaderīgi ar masīvu); drag-and-drop reorder (categories, subcategories, multis, items); **Saglabāt** persists structure + syncs linked catalog names/units; **unsaved-changes** guard on leave; no footer **Kopā** totals row
- **Pozicijas** (`/positions`) — searchable sortable table of unit-price catalog items in Supabase (`position_prices`); columns **Nosaukums**, **Veids** (Darbs / Materiāls / Mehānismi), **Cena** (`2.91 EUR / gab.` + update date), **Darbības**; **Pievienot pozīciju** / **Labot** modals (cost-type radio row above name + unit with hints, 80/20; optional **mainīgs apjoms** toggle — enables editable **Apj.** cell in project estimates for linked rows); **Atjaunot cenu** modal (direct unit price or volume × total calc, supplier store/contact/email/phone, company currency suffixes); **Vēsture** row action opens extra-wide modal with price log (date, amount, “No …” delta, supplier on two lines with phone/email icons); row zebra striping + muted green hover; supplier **tooltip** on price (`cursor: help`); **Atcelt** on all form modals via `ModalFormActions`; **nosaukums / mērvienība** atjaunināti arī no sagataves vai projekta tāmes, ja rinda saistīta ar katalogu (`positionPriceId` vai unikāla nosaukuma atbilstība)
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
- **Datums** — defaults to project **created_at**; **Tāmes termiņš** — defaults to Datums + validity days from **Uzstādījumi**; both editable and **persisted** in `estimates.meta` (changing Datums recalculates termiņš)
- **Individuāls projekts** — **Moduļa dati** icon opens `/[id]/module-data` (same upload UI as module detail: viz images, project PDFs, **Projekta apraksts** with save); incomplete viz/PDF → amber icon + optional full-page **spotlight** (blur overlay, ESC or **X** to dismiss)
- Excel-style table: categories, optional subcategories, line items, **multi-pozīcijas** (modal, DnD, **opciju saites**; piedāvājumā **viena rinda** ar opciju **select** + **Multi** badge zem nosaukuma)
- **Jauns projekts** — tāmes struktūra **klonēta no Sagataves** (`clone-sagatave-for-project.ts`); tukšām esošām tāmēm fallback no sagataves; galvenē `{N} tāmes pozīcijas · {M} rindas` un **+ Tāmes pozīcija**
- **Multi opciju saites** — sagatavē definētas pārus starp opcijām dažādos multi; projekta tāmē izvēle **divvirzienu** sinhronizē saistītās opcijas (session state; kopā ar pilnu tāmes persistenci roadmap)
- **Moduļa lieluma apjomi** — rindām ar `moduleSizeAttachment` **Apj.** kolonnā rāda piesaistīto lielumu (ne zem nosaukuma); sinhronizēts no sagataves / moduļa `project_description` (`sync-module-size-quantities.ts`); read-only, ja ir piesaiste
- **Multi piedāvājumā** — tikai opciju **select** (bez labošanas modāļa, dzēšanas, **+ Multi**); pilna multi rediģēšana tikai **Sagatave**
- **Collapse** category and subcategory rows (cookie per estimate id); **+ Sub** / **+ Pozīcija** auto-expands collapsed parent (**+ Multi** tikai sagatavē)
- Columns: **Nosaukums** (kataloga hinti; saistītām rindām **read-only**; materiālu / mehānismu nosaukumi labajā pusē), **Mērv.** (read-only, ja saistīts ar katalogu), **Apj.** (vienmēr redzama; rediģējama tikai **mainīgs apjoms** rindām bez moduļa piesaistes), **Vienības cena** (Darbs / Materiāls / Mehānismi / Kopā — **read-only** no kataloga / stundas likmes), **Apjoma cena** (Darbs / Materiāls / Mehānismi / Kopā — `apjoms × vienības cena` mainīga apjoma rindām; citām **—**), dzēšana; summu šūnās **0** rāda kā **—** (`formatAmountDisplay`); apjomi apaļoti līdz **2 cipariem**
- Kājene **Kopā** — komponentu kopsummas **Apjoma cena** kolonnās; kopējā summa **Apjoma cena → Kopā**
- Drag-and-drop reorder for categories, subcategories, multi-pozīcijas, and items (cross-subcategory / cross-category item moves)
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

**Schema:** `supabase/migrations/` — `projects` (phone, email, `building_module_id`, `visualization_blocks` / `project_blocks` / `project_description` for individual projects, `007` + `015` + `017` + `025`), `estimates`, `estimate_positions` (`020`–`021`, JSON `sections` — masīvs vai `{ sections, multiOptionLinks }`), `position_prices` (`008`–`009`, `cost_type` in `019`, history in `022`, sample cost types in `023`, `variable_quantity` in `024`), `building_modules` (`010`–`014`, `project_description` in `025`), `company_settings` (incl. `estimate_validity_days` `016`, `default_hourly_rate` `018`), `schema_migrations`, Storage `company-assets`, `module-assets` (module + project asset paths)

---

## Project structure

```
app/
├── (protected)/      # Auth-gated routes (nav + pages)
│   ├── layout.tsx      # Login gate or AppNav + children
│   ├── page.tsx        # Project list (/) + create modal
│   ├── actions.ts      # create/update/delete project; updateProjectEstimateDatesAction
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
│   ├── geo/calling-code/   # IP → phone country code
│   ├── modules/asset/      # Authenticated PDF/image proxy (modules + projects paths)
│   └── places/autocomplete/ # Google Places (New) proxy
├── auth/
│   ├── callback/       # OAuth code exchange
│   └── auth-code-error/
├── components/         # UI (estimate-table, estimate-position-table, attach-module-size-*, attached-module-size-label, subcategory-offer-visibility-toggle, estimate-multi-position-row, estimate-volume-sum-cells, estimate-quantity-input, multi-position-modal, multi-position-link-handle, estimate-line-item-name-field, positions modals, unsaved-changes modal, nav, feedback-toast-provider)
├── lib/
│   ├── auth/           # getCurrentUser, signInWithGoogle, signOut, mapUserDisplay
│   ├── client/         # cookie read/write helpers
│   ├── estimate-positions/  # repository, serialize, reorder, collapsed-sections-cookie, clone-sagatave-for-project, project-estimate-base, default sagatave
│   ├── estimates/      # calculate-totals, calculate-line (formatAmountDisplay, roundToTwoDecimals), format-money, multi-position, multi-position-links, module-size-attachment, sync-module-size-quantities, resolve-estimate-meta, sample data, DnD reorder
│   ├── hooks/          # use-unsaved-changes-guard, use-sync-catalog-position-from-line-item, use-collapsed-estimate-sections
│   ├── form/           # input invalid styles
│   ├── geo/            # country calling codes, IP detect
│   ├── google-maps/    # Places API, build-embed-url
│   ├── modules/        # repository, outline/blocks parse, building-module-data, project-description types/calc/parse, foundation-plane-options, format-module-size-summary, apply-module-size-adjustments, listBuildingModuleSizeOptions, file-storage (module-assets)
│   ├── positions/      # repository, apply-catalog-to-line-item, sync-from-estimate-line-items, has-defined-labor, variable-quantity, filter
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
- [x] Ēku moduļi — catalog CRUD, detail page, image/PDF uploads, outline (DB), **Projekta apraksts** (persisted JSON), missing-data icon on list
- [x] Sagatave (`/estimate`) — template editor with subcategories, read-only catalog prices, DB persist, save + unsaved guard, catalog hints
- [x] Pozicijas catalog (`/positions`) — CRUD + cost type (labor/materials/mechanisms) + unit price updates with supplier info
- [x] Sagatave ↔ Pozicijas sync — linked line items update catalog name/unit on edit or save
- [x] Multi-pozīcijas — modal editor, option DnD, table reorder, offer radio selection (sagatave + project estimates)
- [x] Estimate table collapse — categories and subcategories with per-document cookie
- [x] Pozicijas **mainīgs apjoms** — optional quantity column in project estimates (`024`)
- [x] Multi **opciju saites** — drag link starp opcijām dažādos multi, divvirzienu izvēle, saglabāšana sagatavē
- [x] Projekta tāme no sagataves — jauns projekts klonē sagataves struktūru; **Apj.** kolonna; **Apjoma cena**; read-only kataloga nosaukums/mērv./vienības cena; multi piedāvājumā viena rinda ar select
- [x] Sagatave — moduļa lieluma piesaiste darba pozīcijām (`moduleSizeAttachment`); subkategorijas piedāvājuma redzamība (`hiddenInOffer`)
- [x] Piedāvājumā (`/[id]`) — `moduleSizeAttachment` apjomi **Apj.** kolonnā; multi tikai select; materiālu/mehānismu nosaukumi labajā pusē
- [x] Projekta apraksts — **Frontoni** sadaļā Sienas (pamata plakne, skaits, formula; pieskaitīts ārsienu neto)
- [ ] Piedāvājumā `hiddenInOffer` saglabāšanā / eksportā
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

### Unreleased

- (none)

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
