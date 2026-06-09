# Estimate Builder

Construction estimate editor for Latvian tenders — hierarchical categories, subcategories, and line items with unit prices, volume totals, and drag-and-drop reordering. Next.js app with section-based navigation (projects, building modules, defined blocks, position prices, users).

**Current version:** `1.0.0` (see [Changelog](#changelog))

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

- In-memory React state with sample data (no database or API yet)

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
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

### Environment

Copy `.env.example` if needed. Dev port is set in `package.json` (`3100`).

---

## Project structure

```
app/
├── components/     # UI (estimate table, nav, list cards, DnD)
├── lib/
│   ├── estimates/  # Types, calculations, reorder, sample estimate data
│   └── projects/   # Project list types & sample data
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

### v1.0.0

**Initial release**

- Next.js estimate editor with categories, subcategories, and line items
- Unit price and volume breakdown (labor, materials, mechanisms)
- Drag-and-drop reorder with cross-container item moves and drop line indicator
- Top navigation: Projekti, Eku moduļi, Definētie bloki, Poziciju Cenas, Lietotāji
- Project list with name/address cards; estimate opens at `/projekti/[id]`
- Shared list-page layout (`SectionPage`, `ListEntryCard`) across sections
- Sample data for projects, modules, blocks, prices, and users
