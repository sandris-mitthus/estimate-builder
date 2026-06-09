# Estimate Builder

Construction estimate editor for Latvian tenders — hierarchical categories, subcategories, and line items with unit prices, volume totals, and drag-and-drop reordering. Next.js app with section-based navigation (projects, building modules, blanks, position prices, users, settings).

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.1.6` (see [Changelog](#changelog))

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
| Sagataves | `/blanks` |
| Cenu pozicijas | `/positions` |
| Lietotāji | `/users` |
| Uzstādījumi | `/settings` |

- **Projekti** — project cards (client name, email, phone, address); **Jauns projekts** modal creates project + empty estimate in Supabase; card actions **Labot** (edit contact modal), **Dzēst** (confirm + delete from DB), Apstiprināts / Noraidīts (placeholders) with colored hover icon tooltips
- **Jauns projekts / Labot** — shared `ProjectFormModal` with client name, phone, email, address; phone country code from IP on create, parsed from stored number on edit; email/phone validation; optional **Google Places** address autocomplete (server proxy, map preview when embed key allows)
- **Ēku moduļi**, **Sagataves**, **Cenu pozicijas** — placeholder catalog lists
- **Lietotāji** — real users from Supabase Auth (name, email, Google avatar)
- **Uzstādījumi** — company profile (name, address, reg/VAT, bank, contacts, currency, logo)

### Company settings (`/settings`)

- Company name, address, registration number, optional VAT number (hidden in preview when empty)
- **Bank account first** — entering a Latvian IBAN auto-fills bank name and SWIFT on the next row (Swedbank, SEB, Citadele, Luminor, etc.)
- Info phone and email
- Currency select (EUR, USD, GBP, PLN, SEK, NOK, DKK)
- **Logo upload** — drag-and-drop or file picker → Supabase Storage (`company-assets` bucket)
- Live preview of company block on the right
- Persisted in `public.company_settings` (singleton row)

### Estimate editor (`/[id]`)

- Excel-style table: categories, optional subcategories, line items
- Columns: name, unit, quantity, unit price (labor / materials / mechanisms / total), volume totals, delete
- Drag-and-drop reorder for categories, subcategories, and items (cross-subcategory / cross-category item moves)
- Drop indicator: thick horizontal line on hover (no slide animation)
- Sticky table header, footer totals row
- Editable document meta: client, object, author, date, estimate number

### Data

- **Supabase** (Postgres + Storage) when env is configured
- Falls back to in-memory sample data when Supabase is not set up
- Estimate edits still live in React state (persist to `estimates` table — next step)
- `npm run db:migrate` applies only **pending** migrations (tracked in `public.schema_migrations`)
- App tables use **service-role server access** with RLS deny policies for browser clients

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase** — Postgres + Auth + Storage via `@supabase/ssr` + service role on server
- **Tailwind CSS 4**
- **@dnd-kit** — drag and drop
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

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run start` | Production server (port 3100) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply pending SQL migrations to Supabase Postgres |
| `npm run db:test` | Test Supabase connection and tables |

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

**Schema:** `supabase/migrations/` — `projects` (incl. phone, email), `estimates`, `company_settings`, `schema_migrations`, Storage bucket `company-assets`

---

## Project structure

```
app/
├── (protected)/      # Auth-gated routes (nav + pages)
│   ├── layout.tsx      # Login gate or AppNav + children
│   ├── page.tsx        # Project list (/) + create modal
│   ├── actions.ts      # createProjectAction, updateProjectAction, deleteProjectAction
│   ├── [id]/           # Estimate editor
│   ├── modules/
│   ├── blanks/
│   ├── positions/
│   ├── users/
│   └── settings/
├── api/
│   ├── geo/calling-code/   # IP → phone country code
│   └── places/autocomplete/ # Google Places (New) proxy
├── auth/
│   ├── callback/       # OAuth code exchange
│   └── auth-code-error/
├── components/         # UI (estimate table, nav, AppModal, ConfirmModal, ProjectFormModal, project cards, settings, tooltips, toasts)
├── lib/
│   ├── auth/           # getCurrentUser, signInWithGoogle, signOut, mapUserDisplay
│   ├── estimates/
│   ├── form/           # input invalid styles
│   ├── geo/            # country calling codes, IP detect
│   ├── google-maps/    # Places API server client
│   ├── projects/
│   ├── settings/       # company settings, logo storage, IBAN bank resolve, currencies
│   ├── users/          # Auth user list (admin API)
│   ├── validation/     # email, phone
│   ├── security/       # safe redirect paths
│   └── supabase/
proxy.ts                # Supabase session refresh
scripts/                # db:migrate (pending-only), db:test
supabase/migrations/
.cursor/rules/          # README bump, commits, db:migrate, Supabase security
```

---

## Roadmap

- [ ] Persist estimate edits to `estimates` table (save API / server action)
- [ ] CRUD for Ēku moduļi, Sagataves, Cenu pozicijas
- [ ] User management beyond read-only list
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
Short description of what shipped. v1.1.6
```

### README update (Cursor)

Say **`README update`** (or `@README.md update`) to refresh changelog and docs. Default version step is **patch** (`1.1.3` → `1.1.4`). Ask explicitly for a **minor** step (`1.1.4` → `1.2.0`) only when you need a larger release.

Cursor rules:

- `.cursor/rules/readme-version-update.mdc` — README update + version bump
- `.cursor/rules/github-version-commit.mdc` — commit message format on commit/push
- `.cursor/rules/db-migrate-after-sql.mdc` — run `npm run db:migrate` after new SQL; fix and retry on failure
- `.cursor/rules/supabase-migration-security.mdc` — RLS deny policies, no `using (true)`, `search_path`, storage rules
- `.cursor/rules/modal-confirm-exit.mdc` — `AppModal` backdrop confirm; fixed overlay (not `showModal`) for Places dropdown z-index
- `.cursor/rules/tooltip-buttons.mdc` — icon buttons use `Tooltip`, not `title`
- `.cursor/rules/button-cursor-pointer.mdc` — all buttons use `cursor: pointer` (base styles in `globals.css`)
- `.cursor/rules/feedback-toast.mdc` — save feedback via toast provider

Skip version bump only for typo/docs-only changes when you explicitly say no release.

---

## Changelog

### Unreleased

- (none)

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
