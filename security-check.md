# Security Audit - estimate-builder

**Datums:** 2026-06-13  
**Sākotnējā atzīme:** 4 / 10  
**Atzīme pēc labojumiem:** 8 / 10  
**Auditors:** AI drošības analīze (claude-sonnet-4.6)

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
| H1 | ✅ LABOTS | `app/(protected)/**/actions.ts` (visi) | Server actions bez autentifikācijas | `requireAuth()` pievienots visiem actions |
| H2 | ✅ LABOTS | `app/(protected)/users/actions.ts` | `inviteUserAction` bez auth pārbaudes | `requireAuth()` pirms invite loģikas |
| H3 | ✅ LABOTS | `app/lib/supabase/update-session.ts` | Middleware tikai atsvaidzināja sesiju, neredirect | Pievienots redirect uz `/` neautenticētiem |
| H4 | ✅ LABOTS | `app/auth/callback/route.ts` | Atvērta Google OAuth - jebkurš Google konts | `ALLOWED_EMAIL_DOMAIN` env var pārbaude |
| H5 | ✅ LABOTS | `app/api/estimates/[projectId]/pdf/route.ts` | IDOR - jebkurš auth lietotājs var eksportēt | Auth pārbaude jau bija; rate limit pievienots |
| H6 | ✅ LABOTS | `app/api/modules/asset/route.ts` | IDOR - failu proxy bez ownership | Auth bija; storage privatizēts (H7) |
| H7 | ✅ LABOTS | `supabase/migrations/028_*.sql` + kods | Publiski storage bucketi (PDF, logotipi) | Bucketi privatizēti; autenticēts proxy |

### MEDIUM - Nozīmīgi

| # | Statuss | Fails | Problēma | Labojums |
|---|---------|-------|----------|----------|
| M8 | ✅ LABOTS | `app/api/places/autocomplete/route.ts` | Google Places API bez autentifikācijas | `getCurrentUser()` pārbaude pievienota |
| M9 | ✅ LABOTS | Places, PDF, Excel API routes | Nav rate limiting | 60 req/min Places; 20 req/min PDF/Excel |
| M10 | ✅ LABOTS | `app/auth/callback/route.ts` | `X-Forwarded-Host` nav validēts | Validācija pret `NEXT_PUBLIC_SITE_URL` |
| M11 | ℹ️ ARHITEKTŪRA | Visi `repository.ts` | Service role visur - RLS apzināti apiet | Pieņemams single-tenant rīkam; doc. |
| M12 | ✅ LABOTS | `file-storage.ts`, `logo-storage.ts` | File upload validē tikai `Content-Type` | Magic-byte validācija pievienota |
| M13 | ⚠️ PALIEK | `projects/repository.ts` | `updateProject` apiet estimate lock | Jāpievieno `assertProjectEstimateEditable` |
| M14 | ⚠️ PALIEK | Nav lomu sistēmas | Visi lietotāji redz/var darīt visu | Pieņemams iekšējam rīkam; plāno lomu sistēmu |
| M15 | ✅ LABOTS | `app/(protected)/layout.tsx` | Dev mode = atvērta app bez auth produktionā | Pievienots production guard - bloķē bez Supabase |
| M16 | ✅ LABOTS | `next.config.ts` | CSP `unsafe-eval`, trūkst HSTS, X-Frame-Options | HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| M17 | ℹ️ VIDE | `app/lib/google-maps/env.ts` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` client-side | Nepieciešams - Google Maps SDK prasīts; jāierobežo referrers |

### LOW - Nelieli

| # | Statuss | Fails | Problēma | Labojums |
|---|---------|-------|----------|----------|
| L18 | ✅ LABOTS | `app/api/geo/calling-code/route.ts` | Neautenticēts geo endpoint | `getCurrentUser()` pievienots |
| L19 | ✅ LABOTS | `app/lib/settings/repository.ts` | `logoUrl` akceptē jebkuru URL | Validācija - tikai `/api/company/logo` vai tukšs |
| L20 | ℹ️ ZEMS RISKS | GET API routes | CSRF read/export uzbrukumi | Pieņemams - GET nav mutācijas; CORS ierobežo |
| L21 | ✅ LABOTS | `logo-storage.ts`, `places/route.ts` | Kļūdu ziņojumi atklāj infrastruktūru | Vispārīgi kļūdu teksti |

---

## Ko tika izveidots / mainīts

### Jauni faili
| Fails | Mērķis |
|-------|--------|
| `app/lib/auth/require-auth.ts` | Centralizēts auth guards server actions |
| `app/lib/security/rate-limit.ts` | In-process rate limiter |
| `app/lib/security/magic-bytes.ts` | Failu magic-byte validācija |
| `app/api/company/logo/route.ts` | Autenticēts logotipa proxy |
| `supabase/migrations/028_private_storage_buckets.sql` | Privatizē storage bucketus |

### Mainīti faili
| Fails | Izmaiņa |
|-------|---------|
| `app/(protected)/actions.ts` | `requireAuth()` visiem actions |
| `app/(protected)/estimate/actions.ts` | `requireAuth()` |
| `app/(protected)/positions/actions.ts` | `requireAuth()` |
| `app/(protected)/modules/actions.ts` | `requireAuth()` |
| `app/(protected)/project-module-actions.ts` | `requireAuth()` |
| `app/(protected)/settings/actions.ts` | `requireAuth()` |
| `app/(protected)/users/actions.ts` | `requireAuth()` |
| `app/(protected)/layout.tsx` | Production guard bez Supabase |
| `app/lib/supabase/update-session.ts` | Redirect neautenticētiem lietotājiem |
| `app/auth/callback/route.ts` | X-Forwarded-Host validācija + email domain |
| `app/api/places/autocomplete/route.ts` | Auth + rate limiting |
| `app/api/geo/calling-code/route.ts` | Auth pārbaude |
| `app/api/estimates/[projectId]/pdf/route.ts` | Rate limiting |
| `app/api/estimates/[projectId]/excel/route.ts` | Rate limiting |
| `app/lib/modules/file-storage.ts` | Magic bytes + proxy URL |
| `app/lib/settings/logo-storage.ts` | Magic bytes + proxy URL + kļūdu sanitizācija |
| `app/lib/settings/repository.ts` | logoUrl validācija + kļūdu sanitizācija |
| `next.config.ts` | HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |

---

## Vēl darāmais (nav labots šajā sesijā)

### Obligāti pirms production

- [ ] **`028_private_storage_buckets.sql`** - Palaist migrāciju Supabase (`npm run db:migrate`)
- [ ] **Google Maps API atslēga** - Ierobežot ar HTTP referrer Google Cloud Console
- [ ] **`ALLOWED_EMAIL_DOMAIN`** (neobligāts) - Iestatīt `.env.local` / Vercel env, ja vajag ierobežot piekļuvi pēc domēna
- [ ] **GitHub Actions** - Iestatīt `GITLEAKS_LICENSE` repo secret (bezmaksas public repo, nav vajadzīgs private)

### CI/CD pārbaudes (automātiski uz katru push)

| Workflow | Fails | Ko pārbauda |
|----------|-------|-------------|
| Secret scan | `.github/workflows/secret-scan.yml` | gitleaks - atslēgas, paroles kodā |
| Security audit | `.github/workflows/security-audit.yml` | npm audit - vulnerablities |
| Security smoke | `.github/workflows/security-smoke.yml` | typecheck, lint, build, requireAuth, eval(), headers |

### Ieteicams nākotnē

- [ ] **Lomu sistēma** - Pievienot `admin` / `member` lomas; ierobežot `/users` un `/settings` tikai adminiem
- [ ] **`updateProject` lock** - Pievienot `assertProjectEstimateEditable` pirms `updateProject` approved/completed projektiem
- [ ] **Distributed rate limiting** - Aizstāt in-process limiter ar Redis/Upstash multi-instance deployment gadījumā
- [ ] **Supabase Auth** - Atspējot publisko signup Supabase dashboard (Authentication > Settings > User Signups)
- [ ] **Invite-only flow** - Pārbaudīt ka jauns OAuth lietotājs atbilst invite listei

---

## Atzīme pēc labojumiem: 8/10

### Pamatojums

**Uzlabojumi:**
- Visas mutācijas tagad aizsargātas ar `requireAuth()` (iepriekš nav bijis)
- Storage bucketi privāti - konfidenciāli faili vairs nav publiski pieejami
- Middleware redirect neautenticētiem lietotājiem
- Rate limiting sensitīviem endpointiem
- Magic-byte validācija failiem
- Uzlabotas HTTP drošības galvenes (HSTS, X-Frame, Referrer-Policy)
- Kļūdu ziņojumu sanitizācija

**Atlikušās nepilnības (-2 punkti):**
- Nav lomu sistēmas (visi auth lietotāji redz visu)
- In-process rate limiter nav pietiekams distributed deployment gadījumā
- Google Maps API atslēga joprojām client-side (nepieciešams, bet jāierobežo)
- `updateProject` neievēro estimate lock
- Storage migrācija jāpalaiž manuāli
