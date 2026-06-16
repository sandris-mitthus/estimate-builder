# Security Audit - estimate-builder

**Sākotnējā atzīme:** 4 / 10  
**Atzīme pēc labojumiem:** 8 / 10  
**Pēdējā pilnā pārbaude:** 2026-06-17 (**v1.3.25**) — **9.5 / 10**  
**Iepriekšējā pilnā pārbaude:** 2026-06-13 (v1.3.14) — 9.5 / 10

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
| L22 | ✅ LABOTS | `.github/workflows/security-smoke.yml` | Smoke meklēja tikai `requireAuth` | Pārbauda `requireAuth` vai `requireAction` |
| L23 | ✅ LABOTS | Frontend komponentes | Pogas redzamas bez tiesībām | `useActionPermission()` + layout provider |
| L24 | ✅ LABOTS | `positions/actions.ts` | Cenu vēsture tikai ar `requireAuth()` | `requireAction("positions.manage")` |
| L25 | ℹ️ DEPLOY | Supabase Auth / ENV | OAuth nav ierobežots bez ENV | `ALLOWED_EMAIL_DOMAIN` + atspējot publisko signup |
| L26 | ℹ️ SCALE | `rate-limit.ts` | In-process limiter | Pietiek 1 instance; Upstash tikai multi-instance |
| L27 | ℹ️ ARHITEKTŪRA | `labor-time-norm-sync.ts` | Saglabāšana sinhronizē Sagatavi + citus `active` projektus | Pieņemams single-tenant; aiz `estimate.save` |

---

## Ko tika izveidots / mainīts (kopsavilkums)

### v1.3.25 drošības pārbaude (šī sesija)
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
| `app/lib/security/rate-limit.ts` | In-process rate limiter |
| `app/lib/security/magic-bytes.ts` | Failu magic-byte validācija |
| `app/api/company/logo/route.ts` | Autenticēts logotipa proxy |
| `supabase/migrations/028_private_storage_buckets.sql` | Privatizē storage bucketus |

---

## Vēl darāmais

### Obligāti pirms production (ieteicams)

- [x] **`028`–`033` migrācijas** — palaist `npm run db:migrate`
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
- [ ] **Distributed rate limiting** — Redis/Upstash **tikai** ja deploy uz vairākām instance
- [ ] **Invite-only plūsma** — OAuth tikai uzaicinātajiem (Supabase dashboard + ENV)

---

## Atzīme: 9.5 / 10 (v1.3.25)

### Pamatojums

**Stipri (+):**
- Visas mutācijas aizsargātas ar `requireAction()` pēc konkrētām tiesībām
- Lomu sistēma ar navigācijas un darbību eforcēšanu (M14) + UI saskaņa (L23)
- Admin grupa bez koda apiešanas — vienots avots `getUserAccess()` (M23)
- Privāti storage bucketi + auth proxy
- Rate limiting PDF/Excel eksportiem (pietiek vienai instance)
- `npm audit` 0 moderate+; typecheck + build OK
- Magic-byte validācija, sanitizētas kļūdas, drošības galvenes, CI smoke

**Vājāk (-0.5 kopā):**
- **-0.5** — production OAuth vēl nav stingri ierobežots (ENV + Supabase signup atkarībā no deploy)

**Pieņemams single-tenant iekšējam rīkam:** service role repository slānī, visi auth lietotāji redz vienus projektus (nav row-level tenancy), `resolve-related-user-ids` banerim, asset proxy bez per-projekta ownership, laika normu sinhronizācija starp projektiem saglabāšanas laikā.

### Kad atzīme būtu 10/10

1. Production: `ALLOWED_EMAIL_DOMAIN` + invite-only Supabase Auth
2. (Ja vajag) Upstash rate limit multi-instance deploy
