# Estimate Builder

Estimate Builder is a web app for construction companies that prepare tender estimates and client offers. You keep one reusable estimate template and a shared price catalog, and every new project starts from them — so a full estimate with categories, positions, quantities and prices is ready in minutes instead of hours. Prices stay linked to the catalog, the app warns you when they get out of date, and the finished estimate exports as a client-ready PDF offer or a detailed Excel spreadsheet. Approved projects continue in the app: the material list shows what still needs to be ordered, work can be handed to a specific team member, and workers, tools and project schedules are tracked in one place.

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.4.3`

---

## Key features

- **Projects and offers** — create a project, fill in the client and object details, and get an estimate cloned from your template; copy an existing project when the next job is similar; optional **additional work** estimates for work outside the main contract (date only, manual quantities per position; delete with confirmation; loading overlay when opening)
- **Estimate editor** — Excel-style table with categories, subcategories, positions and multi-choice positions; drag-and-drop reordering, collapsible sections, and totals that recalculate as you type
- **Price catalog** — one company-wide list of materials and mechanisms with unit prices, supplier details and full price history; estimates warn you when catalog prices have changed
- **Reusable template (Sagatave)** — build the structure once; new positions added in a project flow back to the template, and template changes can be pulled into existing projects
- **Building modules** — reusable building types with drawings, PDFs, optional short notes and measurements (including sanitary rooms); copy a module with its files and description; project cards and the project create/edit module select show the note after the module name; estimate quantities can be linked to those sizes, combined with +/- or ×2, and update automatically
- **Offer control** — hide positions or prices from the client offer, show only a total for selected rows, and keep a list of works explicitly not included in the offer
- **PDF and Excel export** — branded PDF offer with your company details, logo and visualizations; Excel spreadsheet with the full price breakdown and VAT; approximate-budget rows use that amount as the line total (same as on-screen totals)
- **Approved projects** — material list with budget prices and an ordered/not-ordered status, plus assignment of materials to specific people with a reminder banner until everything is ordered
- **Tasks, workers, tools and schedule** — personal task boards, an employee directory with photos, a tool inventory with assignment history, and a labor workload schedule (Laika grafiks) with project priority, people count per job, and parallel pairing within a project
- **Teams and permissions** — several companies in one system; a signed-in user without a company must register one (same form as **Uzstādījumi**) before using the app, except system admins; user groups control what each person sees and may do, with invitations and access blocking
- **Multi-language interface** — Latvian and English out of the box, with all interface texts editable by an administrator
- **Documentation portal** — public `/docs` section with categories and articles, managed inside the app
- **Public landing and auth** — anonymous visitors see a marketing landing page at `/` (toggleable under **Integrācijas**); dedicated `/login` and `/signup` screens; **Forgot password?** sends a Resend reset link when email auth is on; when payment plans are on, the landing page shows each plan with month/quarter/year prices (and Early Bird prices while slots remain) and which modules it includes
- **GDPR legal pages and cookie consent** — public privacy policy, terms of service and cookie policy (`/privacy`, `/terms`, `/cookies`) reachable from a site footer whether signed in or not; consent banner with per-category switches where optional cookies stay off until accepted and stored ones are deleted when consent is withdrawn; the data controller details shown in the privacy policy are filled in under **Sistēmas uzstādījumi**; system logo and favicon are uploaded there too (sidebar, login, signup)

---

## Getting started

### Requirements

- Node.js 22.x
- npm
- A [Supabase](https://supabase.com) project (database, auth and file storage)

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3100](http://localhost:3100).

**Local dev tip:** Multiple Supabase apps on `localhost` share cookies and can trigger HTTP **431** (headers too large). Use `127.0.0.1` for one app, or clear `sb-*` cookies; `dev`/`start` scripts raise the header limit and middleware prunes foreign Supabase cookies.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3100) |
| `npm run build` | Production build |
| `npm run start` | Production server (port 3100) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run audit:check` | Fail on unaccepted HIGH/CRITICAL dependency advisories |
| `npm run db:migrate` | Apply pending SQL migrations to Supabase Postgres |
| `npm run db:test` | Test Supabase connection and tables |

### Environment

Copy `.env.example` → `.env.local` and fill in **real** values locally. Never commit `.env.local`. Keep `.env.example` as placeholders only.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | DB + Auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB + Auth | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | DB + users list + settings + logo upload | Server only |
| `NEXT_PUBLIC_SITE_URL` | Auth | `http://localhost:3100` locally; on Vercel set to the public domain (e.g. `https://uupis.com`) — used for Resend auth email links (`/auth/confirm?token_hash=…`), CSP/HSTS; browser OAuth uses `window.location.origin` |
| `SUPABASE_DB_PASSWORD` or `DATABASE_URL` | Migrations | `npm run db:migrate` only |
| `SUPABASE_DB_REGION` | Migrations | Pooler region (default `eu-west-1`) if direct `db.*` host fails |
| `ALLOWED_EMAIL_DOMAIN` | Optional | If set, only this domain may sign in via Google OAuth (e.g. `mycompany.com`) |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Optional for multi-instance production | Enables distributed PDF/Excel export rate limiting; without these, local/single-instance deploys use in-process limits |
| `RESEND_API_KEY` + `EMAIL_FROM` | Optional fallback for transactional email | Prefer configuring Resend under system admin **Integrācijas** (`/site_integrations`); env vars work as fallback when the toggle is on. Email copy stays under **E-pasta šabloni**. Domain must be verified in [Resend](https://resend.com) |

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy API keys and database password into **`.env.local`** (not `.env.example`)
3. Run migrations:

```bash
npm run db:migrate
npm run db:test
```

4. Enable **Google** provider: Authentication → Providers → Google  
   - **Callback URL (for OAuth)** in the Google provider screen is the Supabase URL (`https://<project-ref>.supabase.co/auth/v1/callback`) — register the same URI in Google Cloud → Authorized redirect URIs
5. **Authentication → URL Configuration** (separate from the Google provider screen):  
   - **Site URL:** production app URL (e.g. `https://your-app.vercel.app`)  
   - **Redirect URLs:** add every app callback you use, e.g.  
     - `http://localhost:3100/auth/callback` (local OAuth)  
     - `http://localhost:3100/auth/confirm` (local invites / email links)  
     - `https://your-app.vercel.app/auth/callback`  
     - `https://your-app.vercel.app/auth/confirm`
6. *(Optional)* Disable public sign-ups in Authentication → Settings → User Signups (use invites only)
7. Start the app — sign in, then `/` loads projects from `public.projects`

### Vercel deployment

1. Import the repo in [Vercel](https://vercel.com) (Framework Preset: **Next.js**)
2. Add environment variables (same as `.env.example`; DB password only for local `npm run db:migrate`):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional, recommended when Vercel scales to multiple instances |

3. **Redeploy** after changing any `NEXT_PUBLIC_*` variable (values are embedded at build time)
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** and add **Redirect URLs** for the Vercel domain (see step 5 above)
5. Run `npm run db:migrate` locally against the production Supabase DB when you add new migrations

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase** — Postgres + Auth + Storage
- **Tailwind CSS 4**, **Font Awesome**
- **@dnd-kit** — drag and drop
- **@react-pdf/renderer** — PDF offer generation
- **exceljs** — Excel estimate generation
- **pdfjs-dist** — PDF thumbnails

---

## Documentation

- **[DEVELOPER.md](DEVELOPER.md)** — full technical documentation: feature behaviour, project structure, database schema, CI and security checks, release process, roadmap
- **[CHANGELOG.md](CHANGELOG.md)** — complete version history
- **`security-check.md`** — security audit and open items

## Versioning

Semantic versioning in `package.json`. Every release adds a `## vX.Y.Z` section to **[CHANGELOG.md](CHANGELOG.md)** (newest first) and ends the commit message with `. vX.Y.Z`. Details in [DEVELOPER.md](DEVELOPER.md#versioning--commits).
