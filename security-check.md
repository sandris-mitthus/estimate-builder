# Security Audit - estimate-builder

**Sākotnējā atzīme:** 4 / 10  
**Atzīme pēc labojumiem:** 8 / 10  
**Pēdējā pilnā pārbaude:** 2026-08-11 (**v1.4.8**) — **9.7 / 10**  
**Iepriekšējā pilnā pārbaude:** 2026-08-11 (v1.4.7) — 9.6 / 10

---

## Ātrā pārbaude v1.4.8 (2026-08-11)

Follow-up uz Medium/Low punktiem no padziļinātā audita (SVG serve, auth lookup DoS, geo, Resend, Upstash, CLI, worker photo, enumeration).

| Kontrole | Rezultāts |
|----------|-----------|
| SVG branding XSS | ✅ Raster-only upload + UI; magic-bytes noraida SVG; serve `nosniff` + CSP sandbox; bucket mime bez SVG (`202`) |
| Auth email lookup | ✅ `find_auth_user_by_email` RPC (bez `listUsers` pagination); rate limit saglabāts |
| Signup / resend enumeration | ✅ Confirmed/missing → silent `{ ok: true }` |
| Geo / ipapi | ✅ Prod+Vercel: tikai `x-vercel-ip-country`; timeout; IP validācija; in-memory cache; calling-code rate limit |
| Resend API key | ✅ Preferē `RESEND_API_KEY` env; DB glabāšana AES-GCM ar `SECRETS_ENCRYPTION_KEY` |
| Upstash multi-instance | ✅ Kļūmes gadījumā fallback uz in-process (nevis hard lock) |
| `copy-company-data.mjs` | ✅ Prasa `--confirm` / `CONFIRM_COPY=1` (vai `--dry-run`) |
| Worker photo | ✅ Ownership check pirms upload/delete |
| `assertSystemAdminAccess` | ✅ Non-prod bez Supabase tikai ar `ALLOW_OPEN_SITE_ADMIN=1` |

### Labojumi šajā ciklā

| # | Severity | Apraksts | Statuss |
|---|----------|----------|---------|
| M5 | 🟠 MED | SVG serve / weak magic-bytes | ✅ LABOTS |
| M6 | 🟠 MED | Auth listUsers DoS + enumeration | ✅ LABOTS |
| M7 | 🟠 MED | Geo hang / spoof / abuse | ✅ LABOTS |
| M8 | 🟠 MED | Resend key plaintext in DB | ✅ LABOTS (env prefer + encrypt) |
| M9 | 🟠 MED | Upstash fail-closed locks exports | ✅ LABOTS (fail → in-process) |
| L10 | 🟡 LOW | copy-company-data without confirm | ✅ LABOTS |
| L11 | 🟡 LOW | Worker photo without ownership check | ✅ LABOTS |
| L13 | 🟡 LOW | Signup email enumeration | ✅ LABOTS |
| L14 | 🟡 LOW | Open site-admin without Supabase in non-prod | ✅ LABOTS |

### Atlikušās piezīmes / ieteikumi (nebloķējoši)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | Production: `ALLOWED_EMAIL_DOMAIN` + Supabase Auth invite-only, ja publiskais signup nav vajadzīgs |
| L27 | ℹ️ ARHITEKTŪRA | Service role repository apzināti apiet RLS; klienti deny — company scope serverī |
| L29 | ℹ️ DEPLOY | Multi-instance: iestatīt `UPSTASH_REDIS_REST_*` |
| L30 | ℹ️ AUTH | Login rate limit ir soft-gate; Supabase Auth limitē tiešo `signInWithPassword` |
| L31 | ℹ️ DEPLOY | Iestatīt `SECRETS_ENCRYPTION_KEY` ja Resend atslēga glabājas DB; preferē `RESEND_API_KEY` env |

**Atzīme:** **9.7 / 10** — Medium follow-up punkti aizvērti; atlikušais galvenokārt deploy konfigurācija.

---

## Ātrā pārbaude v1.4.7 (2026-08-11)

Padziļināta pārbaude pret šo failu + fokusēti labojumi multi-tenant storage, auth un branding.

| Kontrole | Rezultāts |
|----------|-----------|
| Module / project `storagePath` | ✅ `assertModuleBlocksForCompany` / `isModuleStoragePathForCompany` — rakstīšanā un PDF vizualizāciju lejupielādē tikai `companies/{companyId}/…` (bez `..`) |
| Module asset proxy | ✅ Joprojām company path regex + companyId salīdzinājums |
| `assignUserToGroup` | ✅ Prasa esošu `company_users` (`active`/`invited`); vairs neizveido membership caur grupas upsert |
| OAuth `/auth/callback` | ✅ Production bez `NEXT_PUBLIC_SITE_URL` **neuzticas** `X-Forwarded-Host` vienam |
| Signup password takeover | ✅ Unconfirmed kontiem parole netiek pārrakstīta pirms apstiprinājuma |
| SVG XSS (logo / branding) | ✅ Uzņēmuma un sistēmas logo/favicon — tikai raster (PNG/JPG/WEBP) |
| Auth rate limit | ✅ Signup, resend, password reset, login soft-gate (`auth-rate-limit.ts` + Upstash/in-process) |
| Geo / IP lookup | ✅ 1.5s timeout; plašāki private IP; cookie short-circuit (nav ipapi, ja valoda jau zināma) |
| XSS / `eval()` | ✅ Nav `dangerouslySetInnerHTML` / `eval()` / `new Function()` `app/` |
| npm audit | ✅ `npm run audit:check` — no unaccepted HIGH/CRITICAL |
| DB migrācijas | ✅ `199_seed_security_auth_error_translations.sql` |

### Labojumi šajā ciklā (bija atrasti)

| # | Severity | Apraksts | Statuss |
|---|----------|----------|---------|
| H1 | 🔴 HIGH | Poisoned `storagePath` cross-tenant module/PDF | ✅ LABOTS |
| H2 | 🔴 HIGH | `assignUserToGroup` silent `company_users` upsert | ✅ LABOTS |
| M1 | 🟠 MED | OAuth redirect via forged `X-Forwarded-Host` | ✅ LABOTS |
| M2 | 🟠 MED | Signup overwrite password on unconfirmed user | ✅ LABOTS |
| M3 | 🟠 MED | SVG upload XSS surface (branding) | ✅ LABOTS |
| M4 | 🟠 MED | Auth email / login bez app rate limit | ✅ LABOTS |
| L1 | 🟡 LOW | ipapi hang / private IP gaps | ✅ LABOTS |

### Atlikušās piezīmes / ieteikumi (nebloķējoši)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | Production: `ALLOWED_EMAIL_DOMAIN` + Supabase Auth invite-only, ja publiskais signup nav vajadzīgs |
| L27 | ℹ️ ARHITEKTŪRA | Service role repository apzināti apiet RLS; klienti deny — company scope serverī |
| L29 | ℹ️ DEPLOY | Multi-instance: `UPSTASH_REDIS_REST_*` rate limitam |
| L30 | ℹ️ AUTH | Login rate limit ir soft-gate pirms klienta `signInWithPassword`; noteiktais uzbrukums joprojām iet caur Supabase Auth limitiem |

**Atzīme:** **9.6 / 10** — atrastie HIGH/MED laboti; atlikušais galvenokārt deploy konfigurācija un apzināta service-role arhitektūra.

---

## Ātrā pārbaude v1.3.110 (2026-08-04)

| Kontrole | Rezultāts |
|----------|-----------|
| Server actions — `requireAction()` / `requireAuth()` / `assertSystemAdminAccess()` / `assertNavAccess()` / `getCurrentUser()` | ✅ 20 action faili; **92** exportētas actions; mutācijas aiz `requireAction()`, `assertSystemAdminAccess()`, `assertNavAccess()` (+ helper `tasks`) vai `getCurrentUser()` (valoda); jaunā `reorderTimelineGraphProjectsAction` — auth + `assertNavAccess("timeline_graph")` |
| Protected lapas | ✅ 26 `page.tsx`; uzņēmuma sadaļas aiz `assertNavAccess()` / `assertUserGroupsPageAccess()`; system admin (`site_*` + `/todo`) aiz `assertSystemAdminAccess()`; `/timeline-graph` aiz `timeline_graph` |
| System admin sadaļas | ✅ 9 system admin lapas joprojām aiz `public.users.is_admin = true` |
| API maršruti (`app/api/**`) | ✅ 9 maršruti; visi sāk ar `getCurrentUser()` vai `getCurrentUserAccess()`; PDF/Excel + `estimate.export` + rate limit; module asset proxy — company path |
| Jaunā `company_timeline_graph_order` | ✅ Migrācija `142`; RLS enabled + restrictive deny anon/authenticated; reorder filtrē `company_id` + esošos projektu ID (nav svešu ID rakstīšanas) |
| Frontend modulis `module_timeline_graph` | ✅ Seed `141` (`is_enabled` default `false`); nav/gating caur `FRONTEND_MODULE_KEYS` + `assertNavAccess` |
| Storage / proxy | ✅ Privātie bucketi; `logo`, `asset`, `workers/photo` proxy prasa auth |
| PDF/Excel eksports | ✅ Auth + `estimate.export`; rate limit; filename sanitizēts; additional work caur `estimateId` joprojām aiz tām pašām kontrolēm |
| XSS / `eval()` | ✅ Nav `dangerouslySetInnerHTML`; nav `eval()` / `new Function()` aplikācijas kodā |
| Hardcoded secrets | ✅ Nav `sk_live_` / `sk_test_` / hardcoded service-role JWT / `password="..."` patternu `app/` |
| npm audit (moderate+) | ✅ **0 vulnerabilities**; `npm run audit:check` — no unaccepted HIGH/CRITICAL; `ACCEPTED_ADVISORIES` tukšs (brace-expansion overrides no v1.3.109) |
| HTTP galvenes | ✅ CSP, HSTS (HTTPS), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| typecheck + lint + build | ✅ `typecheck` OK; `lint` 0 errors (9 warnings); `build` OK (iepriekšējā release gaitā) |
| DB migrācijas | ✅ `npm run db:migrate` — `No pending migrations.` |

### Izmaiņas kopš v1.3.63 → v1.3.110 (pārskatīts, bez regresijas)

| Apgabals | Drošības secinājums |
|----------|---------------------|
| Laika grafiks (`/timeline-graph`) | ✅ Lapa + reorder aiz nav + frontend moduļa; DB order tabula ar RLS deny; company-scoped ownership filtrs reorderā |
| Termiņu grafiks (`module_timeline`) noņemts | ✅ Migrācija `154` — tabula, modulis, permissions un unikālie tulkojumi dzēsti; `/timeline` koda nav |
| Papildu darbu tāmes + dzēšana | ✅ Mutācijas aiz `estimate.save`; PDF/Excel ar `estimateId` joprojām aiz `estimate.export` |
| Atkarību pin (`next` 16.2.12, postcss/sharp/js-yaml/brace-expansion) | ✅ HIGH advisories novērsti vai pinned; `audit:check` tīrs bez ACCEPTED ierakstiem |
| `project_material_assignments` / materiāli | ✅ Modelis saglabāts (RLS deny + service-role repository) |

### Atlikušās piezīmes / ieteikumi (nebloķējoši)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | Production: iestatīt `ALLOWED_EMAIL_DOMAIN` + Supabase Auth invite-only (publiskais signup atspējots) |
| L27 | ℹ️ ARHITEKTŪRA | Service role repository apzināti apiet RLS serverī; klientiem tabulas deny — pieņemams iekšējam multi-company rīkam ar server-side company scope |
| L28 | ✅ LABOTS (v1.3.110+) | `timeline_graph.manage` — prioritātes DnD un `reorderTimelineGraphProjectsAction` aiz šīs tiesības; skatītājam false, admin true (`149`) |
| L29 | ℹ️ DEPLOY | Multi-instance: iestatīt `UPSTASH_REDIS_REST_*` PDF/Excel rate limitam (bez tā — in-process uz vienas instances) |

**Atzīme:** **9.5 / 10** — pilna pārbaude pēc Laika grafika un atkarību pin neatrada jaunu auth/API/RLS regresiju; `npm audit` tīrāks nekā v1.3.97 fokusa audita laikā; atlikušais ir production konfigurācija un apzināta service-role arhitektūra.

---

## Atkarību audits v1.3.97 (2026-07-27)

Fokusēta atkarību pārbaude pēc CI `security-audit` kritiena (5 HIGH). Aplikācijas koda drošības kontroles netika mainītas.

| Advisory | Pakete | Rezultāts |
|----------|--------|-----------|
| GHSA-6gpp-xcg3-4w24 u.c. (9 advisories) | `next` 16.2.7 | ✅ LABOTS — `next` un `eslint-config-next` → **16.2.12** |
| GHSA-r28c-9q8g-f849 | `postcss` 8.5.15 | ✅ LABOTS — `overrides.postcss` → `^8.5.18` |
| GHSA-f88m-g3jw-g9cj | `sharp` 0.34.5 | ✅ LABOTS — `overrides.sharp` → `^0.35.0` (libvips CVE) |
| GHSA-52cp-r559-cp3m | `js-yaml` 4.2.0 | ✅ LABOTS — `overrides.js-yaml` → `^4.3.0` |
| GHSA-mh99-v99m-4gvg | `brace-expansion` | ⚠️ PIEŅEMTS — sk. zemāk |

### `brace-expansion` — kāpēc pieņemts

Advisory atzīmē **visas** versijas `<= 5.0.7` par ievainojamām, un pirmā labotā ir `5.0.8`. Tas nozīmē, ka `minimatch` 3.x un 5.x patērētājiem (`eslint-config-next` plugini, `exceljs` → `archiver`) **nav** nebreaking upgrade ceļa:

- `brace-expansion@5` CommonJS eksportē objektu, nevis funkciju, tāpēc globāls override salauž `minimatch@3` (`expand is not a function`).
- `eslint@10` noņemtu eslint core ķēdi, bet `eslint-config-next` bundlētais `eslint-plugin-react` ar to nestrādā (`contextOrFilename.getFilename is not a function`).
- `exceljs@4.4.0` ir jaunākā versija un piesaista `archiver@^5`; arī `archiver@7` ir ievainojamajā diapazonā.

Ietekme praksē: DoS caur speciāli veidotu glob brace patternu. Aplikācija nekad nepadod lietotāja ievadi kā glob patternu — `exceljs` tiek lietots tikai workbook rakstīšanai buferī, pārējais ir dev tooling.

Advisory ir reģistrēts `scripts/audit-check.mjs` → `ACCEPTED_ADVISORIES` ar iemeslu un noņemšanas nosacījumu. CI (`npm run audit:check`) joprojām krīt pie **jebkura cita** HIGH/CRITICAL.

---

## Ātrā pārbaude v1.3.63 (2026-06-30)

| Kontrole | Rezultāts |
|----------|-----------|
| Server actions — `requireAction()` / `requireAuth()` / `assertSystemAdminAccess()` / `getCurrentUser()` | ✅ 19 action faili; 84 exportētas actions; mutācijas aiz `requireAction()` vai `assertSystemAdminAccess()`, valodas/pašapkalpošanās darbības aiz `getCurrentUser()` |
| Protected lapas | ✅ 24 `page.tsx` faili; uzņēmuma sadaļas aiz `assertNavAccess()`, system admin sadaļas aiz `assertSystemAdminAccess()` |
| System admin sadaļas | ✅ 9 system admin lapas (`site_*` + `/todo`) paliek aiz `public.users.is_admin = true` pārbaudes |
| API maršruti (`app/api/**`) | ✅ 7 maršruti; visi sāk ar `getCurrentUser()`; PDF/Excel un module asset proxy papildus izmanto rate limit |
| Jaunā `project_material_assignments` tabula | ✅ Migrācija `103_project_material_assignments.sql`; RLS enabled + restrictive deny policy anon/authenticated klientiem; backfill no esošā `estimates.meta` |
| Storage / proxy | ✅ Privātie bucketi; `logo`, `asset`, `workers/photo` proxy prasa auth; module asset proxy pārbauda company path prefix un tagad ir rate limit |
| PDF/Excel eksports | ✅ Auth + `estimate.export`; rate limit; `Content-Disposition` filename sanitizēts; PDF attēlu ielādei ir skaita/izmēra/kopējā apjoma/concurrency limiti |
| Materiālu performance izmaiņas | ✅ Materiālu piešķīrumi paliek service-role repository slānī ar RLS deny tabulu |
| XSS / `eval()` | ✅ Nav `dangerouslySetInnerHTML`; nav `eval()` aplikācijas kodā |
| Hardcoded secrets | ✅ Nav atrasti `sk_live_`, `sk_test_`, service-role JWT, `password="..."` vai `secret="..."` patterni `app/` kodā |
| npm audit (moderate+) | ✅ **0 vulnerabilities** (`npm audit --audit-level=moderate`) |
| HTTP galvenes | ✅ CSP, HSTS (HTTPS), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| typecheck + lint + build | ✅ `npm run typecheck`, `npm run lint`, `npm run build` OK |
| DB migrācijas | ✅ `npm run db:migrate` OK — `No pending migrations.` |

### Izmaiņas kopš v1.3.44 → v1.3.63 (pārskatīts, bez regresijas)

| Apgabals | Drošības secinājums |
|----------|---------------------|
| Ātrdarbības optimizācijas | ✅ Samazina SSR/JSON slodzi, nepaplašinot klienta DB piekļuvi; service-role repository modelis saglabāts |
| `project_material_assignments` | ✅ Jauna normalizēta tabula ar RLS deny; dati tiek rakstīti tikai server-side action/repository ceļos |
| Module asset proxy | ✅ Saglabāta auth + company path validācija; pievienots rate limit un `Content-Length` |
| PDF/Excel eksporti | ✅ Saglabāta `estimate.export` tiesība un rate limit; failu nosaukumi sanitizēti; PDF attēlu resursu limiti mazina DoS risku |
| Timeline sync pārvietošana | ✅ Mutācija pārvietota no lapas lasīšanas uz projekta statusa maiņas ceļu, kas jau ir aiz `statusActionPermission(status)` |

### Atlikušās piezīmes (nebloķējošas)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | `ALLOWED_EMAIL_DOMAIN`, Supabase invite-only un Upstash Redis multi-instance rate limit — atkarīgs no production ENV |
| L27 | ℹ️ ARHITEKTŪRA | Service role repository slānis apzināti apiet RLS serverī; klientiem tabulas paliek deny |

**Atzīme:** **9.5 / 10** — recheck pēc ātrdarbības izmaiņām neatrada jaunu auth/API/RLS regresiju; atlikušais ir production konfigurācija un apzināta server-side service-role arhitektūra.

---

## Ātrā pārbaude v1.3.44 (2026-06-23)

| Kontrole | Rezultāts |
|----------|-----------|
| Server actions — `requireAction()` / `requireAuth()` / `assertSystemAdminAccess()` / `getCurrentUser()` | ✅ 13 action faili; 56 exportētas actions; mutācijas aiz `requireAction()` vai `assertSystemAdminAccess()`, valodas maiņa aiz `getCurrentUser()` |
| Protected lapas | ✅ 17 `page.tsx` faili; uzņēmuma sadaļas aiz `assertNavAccess()`, system admin sadaļas aiz `assertSystemAdminAccess()` |
| System admin sadaļas | ✅ `site_settings`, `site_languages`, `site_translations`, `site_user_groups`, `site_companies`, `site_companies_users` lapas joprojām aiz `public.users.is_admin = true` pārbaudes |
| API maršruti (`app/api/**`) | ✅ 6 maršruti; visi sāk ar `getCurrentUser()`; klāt `assigned-materials`, kas arī prasa auth |
| Tulkojumu/i18n izmaiņas | ✅ `site_translations` paliek RLS deny; rediģēšana tikai system admin; vārdnīcas cache versējas pēc `site_translations.updated_at`, lai seed tulkojumi neiestrēgst vecā cache |
| Settings / logo plūsma | ✅ `settings.save` guards visām saglabāšanas/logo darbībām; logo upload/remove joprojām caur server action un storage helperiem |
| XSS / `eval()` | ✅ Nav `dangerouslySetInnerHTML`; nav `eval()` aplikācijas kodā |
| npm audit (moderate+) | ✅ **0 vulnerabilities** (`npm audit --audit-level=moderate`) |
| Storage / proxy | ✅ Privātie bucketi (`028`); auth proxy `logo`, `asset`; path regex un company prefix paliek spēkā |
| RLS deny (DB tabulas) | ✅ RLS deny kontroles saglabātas; jaunākās `062`–`067` SQL migrācijas ir translation seed, bez jaunu klientam atvērtu tabulu |
| HTTP galvenes | ✅ CSP, HSTS (HTTPS), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Magic-byte upload validācija | ✅ `file-storage.ts`, `logo-storage.ts` |
| OAuth / redirect | ✅ `ALLOWED_EMAIL_DOMAIN` opcija; `getSafeRedirectPath()`; X-Forwarded-Host validācija |
| Estimate lock (M13) | ✅ `assertProjectEstimateEditable()` repository slānī |
| typecheck + lint + build | ✅ `npm run typecheck`, `npm run lint`, `npm run build` OK; lint: 0 errors, ~75 warnings |
| DB migrācijas | ✅ `npm run db:migrate` OK — `No pending migrations.` |

### Izmaiņas kopš v1.3.32 → v1.3.44 (pārskatīts, bez regresijas)

| Apgabals | Drošības secinājums |
|----------|---------------------|
| Company logo / site company UI | ✅ Auth proxy un server-side logo storage saglabāts; API route prasa `getCurrentUser()` |
| Assigned materials banner/API | ✅ Jauns `app/api/assigned-materials` route prasa `getCurrentUser()`; nav publiska datu noplūdes endpointa |
| Settings forma un nesaglabātu izmaiņu guard | ✅ Klienta UI izmaiņas; saglabāšana joprojām tikai caur `settings.save` server actions |
| I18n seed migrācijas (`062`–`067`) | ✅ Tikai idempotenti `site_translations` seed ieraksti; `site_translations` tabulai RLS deny un mutācijas tikai system admin |
| Translation cache versēšana | ✅ Cache invalidācija drošāka pēc DB `updated_at`; nepaplašina klienta DB piekļuvi |
| System admin konteksts/navigācija | ✅ Navigācija balstīta uz `isSystemAdmin`; system admin lapas paliek ar server-side guardu |

### Atlikušās piezīmes (nebloķējošas)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | `ALLOWED_EMAIL_DOMAIN` un Supabase invite-only — atkarīgs no production ENV |
| L27 | ℹ️ ARHITEKTŪRA | Single-tenant loģika izmanto service role repository slānī; pieņemams šim iekšējam rīkam |

**Atzīme:** **9.5 / 10** — recheck neatrada jaunu auth/API/RLS regresiju; vienīgās atlikušās drošības piezīmes joprojām ir production konfigurācija un apzināta single-tenant arhitektūra.

---

## Ātrā pārbaude v1.3.32 (2026-06-21)

| Kontrole | Rezultāts |
|----------|-----------|
| Server actions — `requireAction()` / `requireAuth()` / `assertSystemAdminAccess()` / `getCurrentUser()` | ✅ 11 `actions.ts` faili + `language-actions.ts` + `project-module-actions.ts`; 47 exportētas actions; `security-smoke.yml` validē arī system admin un tiešo auth guardu |
| System admin sadaļas | ✅ `site_settings`, `site_languages`, `site_translations`, `site_user_groups`, `site_companies`, `site_companies_users` lapas aiz `assertSystemAdminAccess()` |
| System admin tiesību avots | ✅ Production režīmā prasa Supabase sesiju un `public.users.is_admin = true`; bez Supabase production rāda `LoginGate` / `notFound()` |
| Lomu sistēma (M14) | ✅ Uzņēmuma grupas + globālās `site_user_groups`; darbību/nav tiesības normalizē caur `PermissionSet` |
| UI ↔ tiesības (L23) | ✅ `ActionPermissionsProvider` + `useActionPermission()`; system admin navigācija atsevišķi balstās uz `isSystemAdmin` |
| PDF/Excel eksports | ✅ Auth + `estimate.export` + distributed rate limit 20/min, ja iestatīts Upstash; in-process fallback lokāli/single-instance |
| API maršruti (`app/api/**`) | ✅ 5 maršruti; visi ar `getCurrentUser()`; asset proxy papildus pārbauda uzņēmuma path prefix |
| XSS / `eval()` | ✅ Nav `dangerouslySetInnerHTML`; nav `eval()` aplikācijas kodā |
| npm audit (moderate+) | ✅ **0 vulnerabilities** (`npm audit --audit-level=moderate`) |
| Storage / proxy | ✅ Privātie bucketi (`028`); auth proxy `logo`, `asset`; path regex un company prefix |
| RLS deny (DB tabulas) | ✅ `006` + jaunās tabulas (`020`, `022`, `031`, `032`, `038`, `040`, `041`, `042`); anon/authenticated klientiem deny policy |
| HTTP galvenes | ✅ CSP, HSTS (HTTPS), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Magic-byte upload validācija | ✅ `file-storage.ts`, `logo-storage.ts` |
| OAuth / redirect | ✅ `ALLOWED_EMAIL_DOMAIN` opcija; `getSafeRedirectPath()`; X-Forwarded-Host validācija |
| Estimate lock (M13) | ✅ `assertProjectEstimateEditable()` repository slānī |
| typecheck + lint + build | ✅ `npm run typecheck`, `npm run lint`, `npm run build` OK; lint: 0 errors, 72 warnings |
| DB migrācijas | ✅ `npm run db:migrate` OK — `No pending migrations.` |

### Izmaiņas kopš v1.3.25 → v1.3.32 (pārskatīts, bez regresijas)

| Apgabals | Drošības secinājums |
|----------|---------------------|
| System admin iestatījumi | ✅ `site_settings` tabula ar RLS deny; saglabāšana tikai caur `saveSiteSettingsAction` + `assertSystemAdminAccess()` |
| Globālās default grupas | ✅ `site_user_groups` ar RLS deny; tiesības glabājas strukturēti kā `PermissionSet`; mutācijas tikai system admin |
| Sistēmas valodas | ✅ `site_languages` ar RLS deny; aktīvā lietotāja valoda maināma tikai pašam autorizētam lietotājam un tikai uz aktīvu valodu |
| Sistēmas tulkojumi | ✅ `site_translations` ar RLS deny; key validācija ar whitelist regex; rediģēšana tikai system admin |
| Company/site admin pārskati | ✅ Lapas aiz `assertSystemAdminAccess()`; repository piekļuve caur server-side service role |
| CI smoke | ✅ Auth guard pārbaude papildināta ar `assertSystemAdminAccess()` un `getCurrentUser()`, lai system admin un valodas actions nekļūdaini nefailotu CI |

### Atlikušās piezīmes (nebloķējošas)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | `ALLOWED_EMAIL_DOMAIN` un Supabase invite-only — atkarīgs no production ENV |
| L27 | ℹ️ ARHITEKTŪRA | Single-tenant loģika izmanto service role repository slānī; pieņemams šim iekšējam rīkam |

**Atzīme:** **9.5 / 10** — jaunā system admin / i18n virsma ir aizsargāta ar `is_admin`, RLS deny un server-side repository pieeju; atlikušais ir production konfigurācija, nevis koda caurums.

---

## Ātrā pārbaude v1.3.25 (2026-06-17)

| Kontrole | Rezultāts |
|----------|-----------|
| Server actions — `requireAction()` / `requireAuth()` | ✅ 9 faili (`actions.ts` × 8 + `project-module-actions.ts`); 38 exportētas actions; `security-smoke.yml` validē |
| Lomu sistēma (M14) | ✅ `032`–`033`; `assertNavAccess()` 11 lapās + `assertUserGroupsPageAccess()` |
| UI ↔ tiesības (L23) | ✅ `ActionPermissionsProvider` + `useActionPermission()` 17 komponentēs |
| Admin grupa (M23) | ✅ Nav `slug` apiešanas `require-permission` / `assert-nav-access`; admin tikai `getUserAccess()` |
| PDF/Excel eksports | ✅ Auth + `estimate.export` + rate limit 20/min |
| API maršruti (`app/api/**`) | ✅ 5 maršruti; visi ar `getCurrentUser()` |
| XSS / `eval()` | ✅ Nav `dangerouslySetInnerHTML`; nav `eval()` aplikācijas kodā |
| npm audit (moderate+) | ✅ **0 vulnerabilities** (`uuid` override `^11.1.1`) |
| Storage / proxy | ✅ Privātie bucketi (`028`); auth proxy `logo`, `asset`; path regex |
| RLS deny (DB tabulas) | ✅ `006` + jaunās tabulas (`020`, `022`, `031`, `032`); jaunu migrāciju pēc `033` nav |
| HTTP galvenes | ✅ CSP, HSTS (HTTPS), X-Frame-Options, Referrer-Policy, Permissions-Policy |
| Magic-byte upload validācija | ✅ `file-storage.ts`, `logo-storage.ts` |
| OAuth / redirect | ✅ `ALLOWED_EMAIL_DOMAIN` opcija; `getSafeRedirectPath()`; X-Forwarded-Host validācija |
| Estimate lock (M13) | ✅ `assertProjectEstimateEditable()` repository slānī |
| typecheck + build | ✅ `npm run typecheck` un `npm run build` OK (v1.3.25) |

### Izmaiņas kopš v1.3.14 → v1.3.25 (pārskatīts, bez regresijas)

| Apgabals | Versijas | Drošības secinājums |
|----------|----------|---------------------|
| Laika normu sinhronizācija | v1.3.22 | ✅ Tikai `saveProjectEstimate` ar `estimate.save`; `approved`/`completed` izlaisti |
| PDF `hiddenPricesInOffer` / `hiddenPriceInOffer` | v1.3.22–v1.3.24 | ✅ Eksporta loģika; auth + `estimate.export` nemainīts |
| Materiālu delegācija / pasūtīšana | v1.3.23 | ✅ `materials.order`, `materials.assign`; UI loading stāvokļi bez jauniem API |
| Sagataves trūkstošās pozīcijas — modālis | v1.3.25 | ✅ Tikai klienta UI (`restore-sagatave-positions-modal.tsx`); persist caur `saveProjectEstimateAction`; poga bloķēta ar `editorLocked` |
| `listMissingSagatavePositions` / selektīva merge | v1.3.25 | ✅ Servera actions nav; nav jaunu maršrutu |
| OAuth redirect (Vercel) | v1.3.17 | ✅ Jau iekļauts iepriekšējā auditā |

### Atlikušās piezīmes (nebloķējošas)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | `ALLOWED_EMAIL_DOMAIN` un Supabase invite-only — atkarīgs no production ENV |
| L26 | ℹ️ SCALE | In-process rate limiter — pietiek **1 instance**; Upstash tikai multi-instance |
| L27 | ℹ️ ARHITEKTŪRA | `labor-time-norm-sync` saglabāšanas laikā maina arī Sagatavi un citus `active` projektus — apzināta single-tenant loģika aiz `estimate.save` |

**Atzīme:** **9.5 / 10** — koda un atkarību audits tīrs; jaunu drošības trūkumu nav; atlikušais galvenokārt production konfigurācija.

---

## Ātrā pārbaude v1.3.14 (atkārtota, 2026-06-13)

| Kontrole | Rezultāts |
|----------|-----------|
| Server actions — `requireAction()` / `requireAuth()` | ✅ 8 faili, 41+ action; `security-smoke.yml` validē |
| Lomu sistēma (M14) | ✅ `032`–`033`; `assertNavAccess()` 10 lapās + `assertUserGroupsPageAccess()` |
| UI ↔ tiesības (L23) | ✅ `ActionPermissionsProvider` + `useActionPermission()` 18 komponentēs |
| Admin grupa (M23) | ✅ Nav `slug` apiešanas; `getUserAccess()` vienmēr `createFullPermissions(true)` admin |
| PDF/Excel eksports | ✅ Auth + `estimate.export` + rate limit 20/min |
| API maršruti (`app/api/**`) | ✅ 5 maršruti; visi ar `getCurrentUser()` |
| XSS / `eval()` | ✅ Nav `dangerouslySetInnerHTML`; nav `eval()` aplikācijas kodā |
| npm audit (moderate+) | ✅ **0 vulnerabilities** (`uuid` override `^11.1.1` caur `package.json`) |
| Storage / proxy | ✅ Privātie bucketi (`028`); auth proxy `logo`, `asset`; path regex |
| RLS deny (DB tabulas) | ✅ `006` + jaunās tabulas (`020`, `022`, `031`, `032`) |
| HTTP galvenes | ✅ CSP, HSTS (HTTPS), X-Frame-Options, Referrer-Policy, Permissions-Policy |
| Magic-byte upload validācija | ✅ `file-storage.ts`, `logo-storage.ts` |
| OAuth / redirect | ✅ `ALLOWED_EMAIL_DOMAIN` opcija; `getSafeRedirectPath()`; X-Forwarded-Host validācija |
| Estimate lock (M13) | ✅ `assertProjectEstimateEditable()` repository slānī |

### Izmaiņas kopš 9.0 → 9.5

| # | Statuss | Apraksts |
|---|---------|----------|
| L24 | ✅ LABOTS | `getPositionPriceHistoryAction` → `requireAction("positions.manage")` |
| M23 | ✅ LABOTS | Noņemta `slug === "admin"` apiešana `requireAction` / `assertNavAccess` / layout; admin tiesības tikai `getUserAccess()` + saglabāšanā |
| npm | ✅ LABOTS | `package.json` `overrides.uuid` → `^11.1.1`; `npm audit` 0 |

### Atlikušās piezīmes (nebloķējošas)

| # | Severity | Apraksts |
|---|----------|----------|
| L25 | ℹ️ DEPLOY | `ALLOWED_EMAIL_DOMAIN` un Supabase invite-only — atkarīgs no production ENV |
| L26 | ℹ️ SCALE | In-process rate limiter — pietiek **1 instance**; Upstash tikai multi-instance |

**Atzīme:** **9.5 / 10** — koda un atkarību audits tīrs; atlikušais galvenokārt production konfigurācija.

---

## Sākotnējā atzīme: 4/10

### Stiprās puses (pirms labojumiem)
- Nav hardkodētu akreditācijas datu
- RLS deny politikas DB tabūlām (klienta piekļuve bloķēta)
- Service role tikai servera pusē
- `getSafeRedirectPath()` bloķē atvērtus redirectus
- Nav XSS (`dangerouslySetInnerHTML` netiek lietots)
- Nav SQL injekciju (Supabase query builder)
- Kontaktu lauku validācija

### Kritiskās nepilnības (pirms labojumiem)
- Server actions bez autentifikācijas - jebkurš varēja izsaukt mutācijas
- Publiskas storage bucketi - konfidenciāli PDF un attēli publiski pieejami
- Middleware neaizsargāja maršrutus
- Nav rate limiting
- Kļūdu ziņojumi atklāja infrastruktūras datus

---

## Atrasto problēmu saraksts un status

### HIGH - Kritiski

| # | Statuss | Fails | Problēma | Labojums |
|---|---------|-------|----------|----------|
| H1 | ✅ LABOTS | `app/(protected)/**/actions.ts` (visi) | Server actions bez autentifikācijas | `requireAuth()` / `requireAction()` visiem actions |
| H2 | ✅ LABOTS | `app/(protected)/users/actions.ts` | `inviteUserAction` bez auth pārbaudes | `requireAction("users.invite")` |
| H3 | ✅ LABOTS | `app/lib/supabase/update-session.ts` | Middleware tikai atsvaidzināja sesiju, neredirect | Pievienots redirect uz `/` neautenticētiem |
| H4 | ✅ LABOTS | `app/auth/callback/route.ts` | Atvērta Google OAuth - jebkurš Google konts | `ALLOWED_EMAIL_DOMAIN` env var pārbaude |
| H5 | ✅ LABOTS | `app/api/estimates/[projectId]/pdf/route.ts` | IDOR - jebkurš auth lietotājs var eksportēt | Auth + `estimate.export` + rate limit |
| H6 | ✅ LABOTS | `app/api/modules/asset/route.ts` | IDOR - failu proxy bez ownership | Auth + path regex + privāts bucket |
| H7 | ✅ LABOTS | `supabase/migrations/028_*.sql` + kods | Publiski storage bucketi (PDF, logotipi) | Bucketi privatizēti; autenticēts proxy |

### MEDIUM - Nozīmīgi

| # | Statuss | Fails | Problēma | Labojums |
|---|---------|-------|----------|----------|
| M8 | ✅ NOŅEMTS | — | Google Places API | Integrācija noņemta (v1.3.13) |
| M9 | ✅ LABOTS | PDF, Excel API routes | Nav rate limiting | 20 req/min PDF/Excel |
| M10 | ✅ LABOTS | `app/auth/callback/route.ts` | `X-Forwarded-Host` nav validēts | Validācija pret `NEXT_PUBLIC_SITE_URL` |
| M11 | ℹ️ ARHITEKTŪRA | Visi `repository.ts` | Service role visur - RLS apzināti apiet | Pieņemams single-tenant rīkam |
| M12 | ✅ LABOTS | `file-storage.ts`, `logo-storage.ts` | File upload validē tikai `Content-Type` | Magic-byte validācija |
| M13 | ✅ LABOTS | `projects/repository.ts` | `updateProject` apiet estimate lock | `assertProjectEstimateEditable()` |
| M14 | ✅ LABOTS | `032`–`033`, permissions | Nav lomu sistēmas | Grupas, `requireAction()`, `assertNavAccess()`, filtrēta nav |
| M15 | ✅ LABOTS | `app/(protected)/layout.tsx` | Dev mode = atvērta app produktionā | Production guard bez Supabase |
| M16 | ✅ LABOTS | `next.config.ts` | CSP, HSTS, X-Frame-Options | Uzlabotas HTTP galvenes |
| M17 | ✅ NOŅEMTS | — | Google Maps client-side API atslēga | Integrācija noņemta |
| M22 | ✅ LABOTS | `groups-repository.ts` | Jauns OAuth/invite lietotājs → auto **Skatītājs** | `ensureUserDefaultMembership()`; admin tikai manuāli `/users` |
| M23 | ✅ LABOTS | `require-permission.ts`, `assert-nav-access.ts`, layout | Admin `slug` apiet pārbaudes | Admin tiesības `getUserAccess()`; pārbaudes vienmēr caur `canPerformAction` / `canAccessNav` |

### LOW - Nelieli

| # | Statuss | Fails | Problēma | Labojums |
|---|---------|-------|----------|----------|
| L18 | ✅ LABOTS | `app/api/geo/calling-code/route.ts` | Neautenticēts geo endpoint | `getCurrentUser()` |
| L19 | ✅ LABOTS | `app/lib/settings/repository.ts` | `logoUrl` akceptē jebkuru URL | Validācija - tikai `/api/company/logo` |
| L20 | ✅ LABOTS | GET API routes | Cross-site GET ar sesiju | Auth + `SameSite=Lax` + rate limit eksportam |
| L21 | ✅ LABOTS | `logo-storage.ts` | Kļūdu ziņojumi atklāj infrastruktūru | Vispārīgi kļūdu teksti |
| L22 | ✅ LABOTS | `.github/workflows/security-smoke.yml` | Smoke meklēja nepilnu server action guardu sarakstu | Pārbauda `requireAuth`, `requireAction`, `assertSystemAdminAccess` vai `getCurrentUser` |
| L23 | ✅ LABOTS | Frontend komponentes | Pogas redzamas bez tiesībām | `useActionPermission()` + layout provider |
| L24 | ✅ LABOTS | `positions/actions.ts` | Cenu vēsture tikai ar `requireAuth()` | `requireAction("positions.manage")` |
| L25 | ℹ️ DEPLOY | Supabase Auth / ENV | OAuth nav ierobežots bez ENV | `ALLOWED_EMAIL_DOMAIN` + atspējot publisko signup |
| L26 | ✅ LABOTS | `rate-limit.ts` | In-process limiter neder multi-instance deploy | Upstash Redis REST atbalsts ar `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; in-process fallback lokāli/single-instance |
| L27 | ℹ️ ARHITEKTŪRA | `labor-time-norm-sync.ts` | Saglabāšana sinhronizē Sagatavi + citus `active` projektus | Pieņemams single-tenant; aiz `estimate.save` |

---

## Ko tika izveidots / mainīts (kopsavilkums)

### v1.3.44 drošības pārbaude (recheck)
| Konteksts | Secinājums |
|-----------|------------|
| `app/api/assigned-materials` | Jauns API route prasa `getCurrentUser()`; nav publiska endpointa |
| `settings` / i18n / unsaved changes UI | Klienta UI izmaiņas bez jaunas mutāciju virsmas; saglabāšana joprojām aiz `settings.save` |
| `site_translations` cache | Cache versēts pēc `updated_at`; nemaina DB piekļuves modeli, tikai novērš vecu vārdnīcu |
| `062`–`067` migrācijas | Tulkojumu seed migrācijas; `site_translations` paliek aiz RLS deny un system admin actions |
| Lokālās pārbaudes | `npm audit --audit-level=moderate`, `db:migrate`, `typecheck`, `lint`, `build` OK |

### v1.3.32 drošības pārbaude
| Konteksts | Secinājums |
|-----------|------------|
| `site_*` system admin actions | Mutācijas aiz `assertSystemAdminAccess()`; production tikai `public.users.is_admin = true` |
| `038`–`042` migrācijas | Jaunām tabulām RLS deny anon/authenticated; `npm run db:migrate` → `No pending migrations.` |
| `security-smoke.yml` | Auth guard smoke papildināts ar `assertSystemAdminAccess()` un `getCurrentUser()` |
| `rate-limit.ts` | PDF/Excel eksportiem pievienots Upstash Redis REST distributed limiter ar in-process fallback |
| Lokālās pārbaudes | `npm audit --audit-level=moderate`, `typecheck`, `lint`, `build` OK |

### v1.3.25 drošības pārbaude
| Konteksts | Secinājums |
|-----------|------------|
| `restore-sagatave-positions-modal.tsx` | Klienta modālis; nav jaunu server actions / API |
| `sagatave-has-new-positions.ts` | `listMissingSagatavePositions`, selektīva merge — tikai UI līdz **Saglabāt** |
| v1.3.15–v1.3.24 funkcionalitāte | Nav jaunu migrāciju, API maršrutu vai auth regresijas |

### v1.3.14 drošības labojumi
| Fails | Mērķis |
|-------|--------|
| `package.json` | `overrides.uuid` → `^11.1.1` (exceljs transitīvais) |
| `app/(protected)/positions/actions.ts` | Cenu vēsture ar `positions.manage` |
| `app/lib/auth/require-permission.ts` | Noņemts admin `slug` bypass |
| `app/lib/auth/assert-nav-access.ts` | Noņemts admin `slug` bypass |
| `app/(protected)/layout.tsx` | Nav filtrēts tikai pēc `permissions.nav` (bez admin izņēmuma) |
| `app/lib/users/groups-repository.ts` | Admin `getUserAccess()` → vienmēr pilnas tiesības; saglabāšanā admin → `createFullPermissions(true)` |

### UI tiesības (L23)
| Fails | Mērķis |
|-------|--------|
| `app/components/action-permissions-context.tsx` | `ActionPermissionsProvider`, `useActionPermission()` |
| `app/(protected)/layout.tsx` | Nodod `permissions.actions` no sesijas |

### Autentifikācija un lomas (v1.3.12–v1.3.14)
| Fails | Mērķis |
|-------|--------|
| `app/lib/auth/permissions.ts` | Nav/darbību atslēgas, noklusējuma grupas |
| `app/lib/auth/require-permission.ts` | `requireAction()`, `getCurrentUserAccess()` |
| `app/lib/auth/assert-nav-access.ts` | Lapu piekļuves guards |
| `app/lib/users/groups-repository.ts` | Grupas, membership, `getUserAccess()` |
| `supabase/migrations/032_user_groups.sql` | Tabulas + RLS deny + sēkla |
| `supabase/migrations/033_repair_admin_group_memberships.sql` | Admin tiesību repair |

### Agrākie drošības labojumi
| Fails | Mērķis |
|-------|--------|
| `app/lib/auth/require-auth.ts` | Centralizēts auth guard |
| `app/lib/security/rate-limit.ts` | Distributed Upstash Redis REST rate limiter ar in-process fallback |
| `app/lib/security/magic-bytes.ts` | Failu magic-byte validācija |
| `app/api/company/logo/route.ts` | Autenticēts logotipa proxy |
| `supabase/migrations/028_private_storage_buckets.sql` | Privatizē storage bucketus |

---

## Vēl darāmais

### Obligāti pirms production (ieteicams)

- [x] **`028`–`042` migrācijas** — palaist `npm run db:migrate`
- [ ] **`ALLOWED_EMAIL_DOMAIN`** — iestatīt, ja vajag ierobežot OAuth pēc domēna
- [ ] **Supabase Auth** — atspējot publisko signup (invite-only)
- [x] **M22** — jaunie lietotāji → **Skatītājs**, ne Administrators

### CI/CD pārbaudes (automātiski uz katru push)

| Workflow | Fails | Ko pārbauda |
|----------|-------|-------------|
| Secret scan | `.github/workflows/secret-scan.yml` | gitleaks |
| Security audit | `.github/workflows/security-audit.yml` | npm audit |
| Security smoke | `.github/workflows/security-smoke.yml` | typecheck, lint, build, auth guards, eval(), headers |

### Ieteicams nākotnē

- [x] **UI atbilstība tiesībām** — slēpt pogas pēc `permissions` (L23)
- [x] **Distributed rate limiting** — Upstash Redis REST atbalsts multi-instance deploy
- [ ] **Invite-only plūsma** — OAuth tikai uzaicinātajiem (Supabase dashboard + ENV)

---

## Atzīme: 9.5 / 10 (v1.3.110)

### Pamatojums

**Stipri (+):**
- Visas mutācijas aizsargātas ar `requireAction()` / `assertNavAccess()` / `assertSystemAdminAccess()` / `getCurrentUser()`
- Lomu sistēma ar navigācijas un darbību eforcēšanu (M14) + UI saskaņa (L23)
- Admin grupa bez koda apiešanas — vienots avots `getUserAccess()` (M23)
- Jaunas tabulas (t.sk. `company_timeline_graph_order`) ar RLS deny; piekļuve caur server-side service role + `company_id`
- Privāti storage bucketi + auth proxy
- Rate limiting PDF/Excel: Upstash Redis REST multi-instance, in-process fallback
- `npm audit` 0 moderate+ (HIGH/CRITICAL bez ACCEPTED izņēmumiem); typecheck + lint + build OK
- Magic-byte validācija, drošības galvenes, CI smoke (gitleaks / audit / smoke)

**Vājāk (-0.5 kopā):**
- **-0.5** — production OAuth vēl nav stingri ierobežots (ENV + Supabase signup atkarībā no deploy)

**Pieņemams iekšējam rīkam:** service role repository slānī ar company scope; nav klientam atvērtu PostgREST tabulu.

### Kad atzīme būtu 10/10

1. Production: `ALLOWED_EMAIL_DOMAIN` + invite-only Supabase Auth
2. (Ieteicams) Multi-instance: Upstash Redis rate limit ENV
