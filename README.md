# Estimate Builder

Estimate Builder is a web app for construction companies that prepare tender estimates and client offers. You keep one reusable estimate template and a shared price catalog, and every new project starts from them — so a full estimate with categories, positions, quantities and prices is ready in minutes instead of hours. Prices stay linked to the catalog, the app warns you when they get out of date, and the finished estimate exports as a client-ready PDF offer or a detailed Excel spreadsheet. Approved projects continue in the app: the material list shows what still needs to be ordered, work can be handed to a specific team member, and workers, tools and project schedules are tracked in one place.

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.4.17`

---

## Key features

- **Projects and offers** — create a project, fill in the client and object details, and get an estimate cloned from your template; copy an existing project when the next job is similar; optional **additional work** estimates for work outside the main contract (date only, manual quantities per position; delete with confirmation; loading overlay when opening)
- **Estimate editor** — Excel-style table with categories, subcategories, positions and multi-choice positions; drag-and-drop reordering, collapsible sections, and totals that recalculate as you type
- **Price catalog** — one company-wide list of materials and mechanisms with unit prices, supplier details and full price history; estimates warn you when catalog prices have changed
- **Reusable template (Sagatave)** — build the structure once; new positions added in a project flow back to the template, and template changes can be pulled into existing projects
- **Building modules** — reusable building types with drawings, PDFs, optional short notes and measurements (including sanitary rooms); copy a module with its files and description; project cards and the project create/edit module select show the note after the module name; estimate quantities can be linked to those sizes, combined with +/- or ×2, and update automatically
- **Offer control** — hide positions or prices from the client offer, show only a total for selected rows, and keep a list of works explicitly not included in the offer
- **PDF and Excel export** — branded PDF offer with your company details, logo and visualizations; each PDF page has a small generated-by footer with the system name as a link; Excel spreadsheet with the full price breakdown and VAT; approximate-budget rows use that amount as the line total (same as on-screen totals)
- **Approved projects** — material list with budget prices and an ordered/not-ordered status on every plan; optional **material delegation** assigns items to people with a reminder banner until everything is ordered
- **Tasks, workers, tools and schedule** — personal task boards, an employee directory with photos, a tool inventory with assignment history, and a labor workload schedule (Laika grafiks) with project priority, people count copied from the last project on create, approved end date under the address, overlapping projects, and same-named categories that never overlap
- **Teams and permissions** — several companies in one system; a signed-in user without a company must register one (same form as **Uzstādījumi**) before using the app, except system admins; user groups control what each person sees and may do, with invitations and access blocking
- **Multi-language interface** — Latvian, English and Russian out of the box, with all interface texts editable by an administrator; anonymous visitors without a language cookie get a language matching their country when that language is active (for example RU→Russian, FI→Finnish), otherwise English when active, then the system default
- **Documentation portal** — public `/docs` with a Get started overview of what the system can do, plus categories and articles managed inside the app
- **Public landing and auth** — anonymous visitors see a marketing landing page at `/` (toggleable under **Integrācijas**); dedicated `/login` and `/signup` screens with optional Google sign-in (also under **Integrācijas**); **Forgot password?** sends a Resend reset link when email auth is on; when payment plans are on, the landing page shows each plan with only the billing periods that have a price (month / quarter / year — empty periods stay hidden) and Early Bird prices while slots remain, plus which modules each plan includes; system slogan is editable per language under **Sistēmas uzstādījumi**
- **SEO** — `robots.txt` and `sitemap.xml` for search engines, `/llms.txt` for AI agents, and a human-readable site map at `/sitemap` (linked from every footer); public pages use `canonical` and Open Graph URLs via `NEXT_PUBLIC_SITE_URL`
- **System admin integrations** — landing page, Resend email, and Google Auth checklist (current `*.supabase.co` on Free; later `api.uupis.com` after Supabase Pro Custom Domain)
- **GDPR legal pages and cookie consent** — public privacy policy, terms of service and cookie policy (`/privacy`, `/terms`, `/cookies`) reachable from a site footer whether signed in or not; consent banner with per-category switches where optional cookies stay off until accepted and stored ones are deleted when consent is withdrawn; **Umami** tracker is in the page `<head>`, but pageviews are sent only after statistics cookies are accepted; the data controller details shown in the privacy policy are filled in under **Sistēmas uzstādījumi**; system logo and favicon are uploaded there too (sidebar, login, signup)

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
| `NEXT_PUBLIC_SUPABASE_URL` | DB + Auth | Free: `https://<project-ref>.supabase.co`. After Pro Custom Domain: `https://api.uupis.com` (same keys) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB + Auth | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | DB + users list + settings + logo upload | Server only |
| `NEXT_PUBLIC_SITE_URL` | Auth / SEO | `http://localhost:3100` locally; on Vercel the public **app** domain (e.g. `https://uupis.com`) — Resend auth links, CSP/HSTS, `robots.txt` / `sitemap.xml` / `llms.txt` / `metadataBase`; browser OAuth uses `window.location.origin` |
| `SUPABASE_DB_PASSWORD` or `DATABASE_URL` | Migrations | `npm run db:migrate` only |
| `SUPABASE_DB_REGION` | Migrations | Pooler region (default `eu-west-1`) if direct `db.*` host fails |
| `ALLOWED_EMAIL_DOMAIN` | Optional | Fallback Google email domain lock. Prefer **Integrācijas → Google** (`google_allowed_email_domain`); DB wins when set |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Optional for multi-instance production | Distributed rate limiting; if Redis is down, falls back to in-process limits |
| `RESEND_API_KEY` + `EMAIL_FROM` | Optional preferred for transactional email | Preferred over DB-stored key when Resend is enabled under **Integrācijas**. Domain must be verified in [Resend](https://resend.com) |
| `SECRETS_ENCRYPTION_KEY` | Optional | Required to store a Resend API key in the database (AES-GCM); prefer env key when possible |
| `ALLOW_OPEN_SITE_ADMIN` | Local only | Set to `1` only if you need site-admin routes without Supabase configured |

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy API keys and database password into **`.env.local`** (not `.env.example`)
3. Run migrations:

```bash
npm run db:migrate
npm run db:test
```

4. Enable **Google** provider: Authentication → Providers → Google  
   - **Callback URL (for OAuth)** is the Supabase Auth host:  
     - Free: `https://<project-ref>.supabase.co/auth/v1/callback`  
     - After Custom Domain: also `https://api.uupis.com/auth/v1/callback`  
   - Register the same URI(s) in Google Cloud → Authorized redirect URIs  
   - Google’s “Continue to …” screen shows that Auth host (Free = `*.supabase.co`; branded = `api.uupis.com` only with [Custom Domains](https://supabase.com/docs/guides/platform/custom-domains) on a paid plan)
5. **Authentication → URL Configuration** (separate from the Google provider screen):  
   - **Site URL:** production **app** URL (e.g. `https://uupis.com`)  
   - **Redirect URLs:** add every app callback you use, e.g.  
     - `http://localhost:3100/auth/callback` (local OAuth)  
     - `http://localhost:3100/auth/confirm` (local invites / email links)  
     - `https://uupis.com/auth/callback`  
     - `https://uupis.com/auth/confirm`
6. *(Optional)* Disable public sign-ups in Authentication → Settings → User Signups (use invites only)
7. System admin → **Integrācijas → Google** — enable the button, optional email domain, follow the Free vs Pro checklist
8. Start the app — sign in, then `/` loads projects from `public.projects`

### Custom domain later (`api.uupis.com`)

On **Free** Supabase, leave `NEXT_PUBLIC_SUPABASE_URL` as `https://<project-ref>.supabase.co`. When you upgrade to **Pro** and enable Custom Domain:

1. DNS `CNAME` `api` → `<project-ref>.supabase.co`
2. Activate `api.uupis.com` in Supabase Custom Domain
3. Add `https://api.uupis.com/auth/v1/callback` in Google Cloud OAuth client
4. Vercel: `NEXT_PUBLIC_SUPABASE_URL=https://api.uupis.com`, keep `NEXT_PUBLIC_SITE_URL=https://uupis.com`, Redeploy

Full step list is also on `/site_integrations` (Google card).

### Vercel deployment

1. Import the repo in [Vercel](https://vercel.com) (Framework Preset: **Next.js**)
2. Add environment variables (same as `.env.example`; DB password only for local `npm run db:migrate`):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` (later `https://api.uupis.com`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://uupis.com` (app domain on Vercel) |
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
