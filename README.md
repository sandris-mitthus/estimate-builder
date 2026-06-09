# Estimate Builder

Construction estimate editor for Latvian tenders — hierarchical categories, subcategories, and line items with unit prices, volume totals, and drag-and-drop reordering. Next.js app with section-based navigation (projects, building modules, defined blocks, position prices, users).

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.1.0` (see [Changelog](#changelog))

---

## Features

### Navigation

- **Projekti** — project list (name + address); click opens the estimate editor
- **Eku moduļi** — building module catalog (placeholder list UI)
- **Definētie bloki** — reusable estimate blocks library (placeholder)
- **Poziciju Cenas** — position price catalog (placeholder)
- **Lietotāji** — user management (placeholder)

### Estimate editor (`/projekti/[id]`)

- Excel-style table: categories, optional subcategories, line items
- Columns: name, unit, quantity, unit price (labor / materials / mechanisms / total), volume totals, delete
- Drag-and-drop reorder for categories, subcategories, and items (cross-subcategory / cross-category item moves)
- Drop indicator: thick horizontal line on hover (no slide animation)
- Sticky table header, footer totals row
- Editable document meta: client, object, author, date, estimate number

### Data

- **Supabase** (Postgres) for projects when env is configured
- Falls back to in-memory sample data when Supabase is not set up
- Estimate edits still live in React state (save to DB — next step)

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase** — Postgres via `@supabase/ssr` + service role on server
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

Open [http://localhost:3100](http://localhost:3100) — redirects to `/projekti`.

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run start` | Production server (port 3100) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply SQL migrations to Supabase Postgres |
| `npm run db:test` | Test Supabase connection and tables |

### Environment

Copy `.env.example` → `.env.local` and fill in Supabase keys. Dev port is `3100`.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | For DB | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For DB | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | For DB | Server only — project list reads |
| `SUPABASE_DB_PASSWORD` or `DATABASE_URL` | Migrations | `npm run db:migrate` only |
| `NEXT_PUBLIC_SITE_URL` | Auth (later) | `http://localhost:3100` locally |

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy API keys into `.env.local`
3. Run migrations:

```bash
npm run db:migrate
npm run db:test
```

4. Start the app — `/projekti` loads projects from `public.projects`

**Schema:** `supabase/migrations/` — `projects`, `estimates` (JSONB meta + categories)

---

## Project structure

```
app/
├── components/     # UI (estimate table, nav, list cards, DnD)
├── lib/
│   ├── estimates/  # Types, calculations, reorder, sample estimate data
│   ├── projects/   # Repository, types, sample fallback
│   └── supabase/   # Browser, server, admin clients
├── supabase/migrations/
├── scripts/        # db:migrate, db:test
├── projekti/       # Project list + [id] estimate editor
├── eku-moduli/
├── definetie-bloki/
├── poziciju-cenas/
└── lietotaji/
```

---

## Versioning & commits

Semantic versioning in `package.json`. Each **release** commit:

1. Bump `package.json` `"version"`
2. Add `### vX.Y.Z` under **Changelog** (newest first)
3. End the commit message with `. vX.Y.Z`

**Commit message format:**

```
Short description of what shipped. v1.0.1
```

Cursor rules enforce this when you ask to commit or push:

- `.cursor/rules/readme-version-update.mdc` — README + version bump pass
- `.cursor/rules/github-version-commit.mdc` — commit message format

Skip version bump only for typo/docs-only changes when you explicitly say no release.

---

## Changelog

### Unreleased

- (none)

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
