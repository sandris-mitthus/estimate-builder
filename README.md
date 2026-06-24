# Estimate Builder

Construction estimate editor for Latvian tenders — hierarchical categories, subcategories, and line items with unit prices (labor / materials / mechanisms), catalog hints, drag-and-drop reordering, and configurable excluded-offer positions. Next.js app with section-based navigation (projects, building modules, sagatave template, position catalog, excluded positions, users, settings).

**Repository:** [github.com/sandris-mitthus/estimate-builder](https://github.com/sandris-mitthus/estimate-builder)  
**Current version:** `1.3.49` (see [Changelog](#changelog))

---

## Features

### Authentication

- **Google OAuth** via Supabase — unauthenticated users see a dedicated `/login` screen with the configured `site_settings` system name/slogan, a Google sign-in button, a documentation link to `/docs`, and a language dropdown when more than one UI language is active (anonymous choice stored in `eb_language` cookie)
- OAuth `redirectTo` uses the **browser origin** in the client (`sign-in-with-google.ts`), so production login works even when `NEXT_PUBLIC_SITE_URL` was baked for localhost at build time
- Root login redirects to `/auth/callback` without `?next=/`, so Supabase Redirect URLs can match the exact callback URL in both localhost and Vercel
- OAuth fallback in `proxy.ts` / `update-session.ts` redirects provider returns from `/?code=...` to `/auth/callback?code=...`, so Supabase Site URL fallback still completes the session
- Protected app routes under `app/(protected)/`; OAuth callback at `/auth/callback`
- Session refresh via `proxy.ts` on every request
- **Sidebar navigation:** fixed left menu with the configured system name in the header, icon-only collapsed mode persisted in cookie `eb_sidebar_collapsed`, expandable text labels, tooltips while collapsed, count badges on key nav links, bottom-pinned settings/user-management links above the language selector, signed-in user avatar/name, **Sistēmas administrators** label for system admins, active company name for non-system-admin users, and a user dropdown with settings placeholder + sign-out
- **Globālais materiālu baneris** — zem izvēlnes, ja ielogotajam lietotājam ir nepasūtīti **viņam piešķirti** materiāli (`assigned-materials-banner.tsx`); ielādējas pēc lapas parādīšanas caur `/api/assigned-materials`, lai sākotnējā SSR navigācija negaida smagos materiālu vaicājumus; saistītie konti ar vienādu normalizētu vārdu (`resolveRelatedUserIds` + `listUsers`); projekta tabula ar pasūtīšanas darbībām; vairāki projekti — pārslēgšana ar bultām; **sakļaujams** (virsraksts **Jums piešķirti materiāli pasūtīšanai** paliek redzams); gluda animācija; stāvoklis cookie `eb_assigned_materials_banner_collapsed_{userId}`

### Multi-company users, groups and permissions

- **Sistēmas administrators** — globāls profils `public.users.is_admin`; sidebar pārslēdzas uz system admin sadaļām (**Uzņēmumi**, **Lietotāji**, **Grupas**, **Docs**, **Todo**, **Valodas**, **Tulkojumi**, apakšā **Sistēmas uzstādījumi**) un slēpj uzņēmuma izvēlni
- **System admin pārvaldība** — `/site_companies`, `/site_companies_users`, `/site_user_groups`, `/site_docs`, `/todo`, `/site_languages`, `/site_translations`, `/site_settings`; globālie nosaukuma/slogana metadati, default grupas, valodas, seedoti UI tulkojumi un lietotāja aktīvās valodas dropdown sidebar apakšā; `/site_docs` pārvalda publiskās docs kategorijas un rakstus ar drag-and-drop pārvietošanu starp kategorijām un secības maiņu; `/todo` ir lokāli saglabāts divu kolonnu darba dēlis ar drag-and-drop pārvietošanu un prioritizētu dzēšanas drop zonu; `/site_companies` rāda uzņēmuma logo un kompaktu rekvizītu bloku, `/site_companies_users` rāda arī sistēmas administratorus bez uzņēmuma piesaistes, lietotāju avatarus, uzņēmumu logo un konkrētā uzņēmuma grupu/lomu; lietotāji bez `public.users.is_admin = true` no šīm lapām tiek novirzīti uz `/`
- **Uzņēmuma konteksts** — `companies`, `company_users`, `company_user_groups`, `company_group_members`; aktīvais uzņēmums tiek noteikts serverī un visi galvenie repozitoriji lasa/raksta ar `company_id`
- **2 sistēmas default profili** (`company_user_groups`): **Administrators** un **Skatītājs**; tos uzņēmuma lietotāji var apskatīt, bet pieejas maina tikai `public.users.is_admin = true`
- **Uzņēmuma profili** — uzņēmuma administratori var veidot, pārsaukt, dzēst tukšus profilus un mainīt pieejas tikai sava uzņēmuma izveidotajiem profiliem (`037_company_custom_user_groups.sql`)
- **`/users`** — uzņēmuma lietotāju saraksts ar grupas izvēli, uzaicināšanu, pieejas liegšanu/atjaunošanu (`fa-lock-open` / `fa-lock`) un noņemšanu/pamešanu (`fa-times`) ar `ConfirmModal`
- **Bloķēta pieeja** — `company_users.status = disabled`; lietotājs paliek sarakstā ar birku **Pieeja liegta**, bet aktīvais uzņēmums viņam netiek atgriezts
- **`/users/groups`** — matrica: ko profils redz izvēlnē un ko drīkst darīt (`user-groups-permissions-form.tsx`); uzņēmuma profiliem ir izveide/pārsaukšana/dzēšana, bet sistēmas default profili ir aizsargāti; `users.manage_company_access` kontrolē bloķēšanu un noņemšanu
- **Eforcēšana** — `requireAction()` server actions; `assertNavAccess()` lapās; `AppNav` filtrēts pēc `permissions.nav`; PDF/Excel prasa `estimate.export`
- **UI ↔ tiesības** — `ActionPermissionsProvider` + `useActionPermission()` (`action-permissions-context.tsx`); pogas/darbības slēptas pēc `permissions.actions` (projekti, tāme, sagatave, moduļi, pozīcijas, materiāli, users, settings)

### Navigation

English routes, Latvian labels:

| Label | Route |
|-------|-------|
| Projekti | `/` |
| Ēku moduļi | `/modules` |
| Sagatave | `/estimate` |
| Pozicijas | `/positions` |
| Neiekļautās pozīcijas | `/excluded-positions` |
| Lietotāji | `/users` (apakšlapa **Grupas un tiesības**: `/users/groups`) |
| Uzstādījumi | `/settings` |
| System admin | `/site_companies`, `/site_companies_users`, `/site_user_groups`, `/site_docs`, `/todo`, `/site_languages`, `/site_translations`, `/site_settings` |

- **Navigācijas loading** — klikšķis uz izvēlnes saites rāda spinneri un bloķē citas saites līdz `pathname` mainās (`app-nav.tsx`); **Projekti** aktīvs tikai uz `/` (no `/{id}` atkal klikšķināms); sidebar augšā ir poga manuālai sakļaušanai/izvēršanai, saturs automātiski pielāgo kreiso atkāpi, nav linkiem ir count badge, apakšā piesprausti uzstādījumu/pārvaldības linki, un valodas dropdown apakšējā zonā atveras uz augšu, lai paliktu redzams
- **Publiskā dokumentācija** — `/docs` (`/wiki` alias) ir publiski pieejams dokumentācijas portāls ar fixed sidebar kategorijām, animēti atveramiem rakstu linkiem, noklusējuma kategoriju/rakstu kartīšu sarakstu un raksta content skatu; login kartē ir tieša saite uz dokumentāciju
- **Kartes → detaļa** — projekta un moduļa kartēm pilnekrāna blur + modālis (**Ielādē projektu…** / **Ielādē moduli…**) līdz navigācija pabeigta (`navigation-loading-context.tsx`)
- **Projekti** — project cards (module name above client name, email, phone, address); galvenē **Jauns projekts** + **Arhīvs** (`fa-archive`, `/?archive=1`); **Jauns projekts** modal creates project + estimate **cloned from Sagatave** in Supabase; pēc **Izveidot** — optimistiska karte sarakstā (blur + spinner) un automātiska navigācija uz projektu; card actions **Moduļa dati** (individual projects only — amber highlight when viz/PDF missing), **Kopēt** (vienmēr redzama), **Labot**, **Dzēst** (tikai `active`), **Apstiprināts**, **Noraidīts** (tikai `active`), **Pabeigts** (`fa-check-double`, tikai `approved`; `ConfirmModal`); **`approved` kartes** — visa karte zaļā tonī (`bg-green-50`, `text-green-800`, `border-green-200`), bez atsevišķas statusa birkas; **`approved` ar nepasūtītiem materiāliem** — izteikts oranžs bloks kartē **Visi materiāli vēl nav pasūtīti!** (`listProjectIdsWithPendingMaterials`); **sarkanā apmale** + teksts **Ir jauninājumi izcenojumos** tikai `active` projektiem ar novecojušām kataloga cenām; **dzeltena apmale** + **Sagatavē ir pozīcijas, kuras nav šajā tāmē** tikai `active` projektiem, kuru tāmē trūkst sagataves struktūras (izņemot **Kopēt** no cita projekta); list loads **only real DB rows** when Supabase is configured (no demo fallback on empty/error); sarakstā tikai `active` un `approved`; **Arhīvs** rāda visus statusus ar radio filtru (**Visi**, **Aktīvie**, **Procesā**, **Pabeigtie**, **Noraidītie**); **noraidītie** un **pabeigtie** paslēpti no galvenā saraksta, bet netiek dzēsti no DB
- **Jauns projekts / Labot / Kopēt** — shared `ProjectFormModal` with **required Modulis** select (catalog modules + **Individuāls projekts** last); `building_module_id` on `projects`; client name, phone, email, **free-text address**; phone country code from IP on create, parsed from stored number on edit; email/phone validation; **Kopēt** (`fa-copy`) atver **Jauns projekts** modāli ar tukšiem kontaktu laukiem un avota moduli, bet izveides laikā tāme tiek klonēta no avota projekta (`copyEstimateFromProjectId`)
- **Ēku moduļi** (`/modules`, `/modules/[id]`) — module catalog in Supabase (`building_modules`); **Pievienot Moduli** / **Labot moduli** atbalsta īsu piezīmi līdz 255 zīmēm (piem. “Spogulis”), kas redzama zem moduļa nosaukuma kartē un detaļā; cards with **Labot** / **Dzēst**; saraksts izmanto vieglo `module_data_complete` DB flagu, nevis pilnus failu bloku JSON; klikšķis uz kartes — tāds pats navigācijas loading overlay kā projektiem; red **`fa-house-damage`** icon + tooltip **Nav ievadīti moduļu dati** when viz or project PDF missing; click name opens detail: left column **Vizualizācijas** (image upload grid, 2 per row, drag reorder; spinner līdz ielādējās) + **Projekts** (PDF only, same grid; PDF thumbnail ar spinneri); right column **Projekta apraksts** (Pamats, L veida pamats, izgriezumi, Sienas ar **Frontoni** — augstums, skaits, pamata plakne; platums × augstums / 2 × skaits pieskaitīts ārsienu neto kvadratūrai; Logi un Durvis ar **Marka** lauku (piem. `L1`, `D2`), Jumts — calculated fields, **Saglabāt** persists `project_description` JSON); **aptaksts** outline list below; empty states; toasts on file actions
- **Sagatave** (`/estimate`) — single company-wide estimate template in Supabase (`estimate_positions`); opens editor table directly (`ensureDefaultEstimatePosition()` creates row if missing); hierarchy like project estimates: **tāmes pozīcija** (category) with **+ Sub** / **+ Multi** / **+ Pozīcija**, optional **subkategorijas**, line items and **multi-pozīcijas** under either level; subkategorijā **acs** `fa-eye` / `fa-eye-slash` (tooltip piedāvājuma redzamas / paslēptas pozīcijas; `hiddenInOffer` JSON) un **fa-stream** (dzeltens ieslēgts — paslēpt pozīciju cenas piedāvājumā; `hiddenPricesInOffer` JSON); **pozīcijām tieši zem kategorijas** (ne sub) — **acs** darbību zonā (`hiddenPriceInOffer`; dzeltens `eye-slash` ieslēgts; acs vienmēr redzama kad cena paslēpta, labot/dzēst tikai hover); **collapse** chevron on category and subcategory rows (state in cookie `eb_estimate_collapsed_{documentId}`); table columns **Nosaukums**, **Mērv.** (automātiski no `moduleSizeAttachment`), **Vienības cena** (6 kolonnas: **Laika norma** · **Darba samaksas likme** · Darbs · Materiāli · Mehānismi · Kopā); **kompozīts modelis** — pozīcija ar `laborTimeNorm`, `materials[]`, `mechanisms[]` (kataloga atsauces masīvi; vairāki materiāli summējas, vairāki mehānismi summējas × laika norma); Darbs = laika norma × stundas likme; **Laika norma** tieši rediģējama tabulā (`LaborTimeNormInput` — vienkāršs input, live pārrēķins); pozīciju / multi modāļos — `−`/`+` stepper (0,01, centrēts skaitlis); line-item name **catalog hints** from `/positions`; **darba pozīcijām** — treknraksts + `fa-clipboard-list` **Piesaisīt moduļa lielumu**: modālis ar ēku moduļu `project_description` lielumiem; strukturēts teksts zem nosaukuma (sadaļa · apzīmējums · vērtība); Materiāli/Mehānismi šūnās tooltip ar kataloga nosaukumu (ja vairāki — komatu atdalīti); rinda **sarkanā tonī** + `fa-exclamation-triangle` + teksts **Nav pievienots moduļa apjoms** pozīcijām bez `moduleSizeAttachment`, kad moduļu lielumi definēti; pozīciju modālī slēdzis **Manuāli norādīta mērvienība** (`manualUnitEnabled` / `manualUnit`) ar select no tāmē jau lietotajām mērvienībām — materiāliem ar citu mērvienību rāda patēriņu uz izvēlēto; **multi-pozīcija** — modal editor, drag-reorder options, auto-adds next empty option, duplicate catalog positions blocked **within one multi** only; katras opcijas apakšā cenu kopsāvilkums (Darbs / Materiāli / Mehānismi / Vienības cena); **multi opciju saites** — `fa-link`, velc uz opciju citā multi; saglabā `multiOptionLinks` JSON; drag-and-drop reorder; **Saglabāt** persists structure + syncs catalog names/units; **unsaved-changes** guard on leave; no footer **Kopā** totals row
- **Pozicijas** (`/positions`) — **materiālu un mehānismu** unit-price katalogs Supabase (`position_prices`; **Darbs** — no **Uzstādījumi** stundas likmes, ne šeit); searchable sortable table; kompakts **Veids** filtrs zem meklēšanas (**Visi** / **Materiāls** / **Mehānismi**); columns **Nosaukums**, **Veids**, **Cena** (`2.91 EUR / gab.` + update date; bez cenas `- EUR / gab.`), **Darbības**; **Pievienot pozīciju** / **Labot** modals (tikai Materiāls / Mehānismi — cost-type radio above name + unit with hints, 80/20; optional **mainīgs apjoms** toggle — enables editable **Apj.** cell in project estimates for linked rows); **Atjaunot cenu** modal (direct unit price or volume × total calc, supplier store/contact/email/phone, company currency suffixes); **Vēsture** row action opens extra-wide modal with price log (date, amount, “No …” delta, supplier on two lines with phone/email icons); ielādes stāvoklī spinneris pirms **Ielādē vēsturi…**; row zebra striping + muted green hover; supplier **tooltip** on price (`cursor: help`); **Atcelt** on all form modals via `ModalFormActions`; **nosaukums / mērvienība** atjaunināti arī no sagataves vai projekta tāmes, ja rinda saistīta ar katalogu (`positionPriceId` vai unikāla nosaukuma atbilstība)
- **Neiekļautās pozīcijas** (`/excluded-positions`) — uzņēmuma līmeņa saraksts pozīcijām, kas **nav iekļautas piedāvājumā**; pievienošana pa vienai (nosaukums); drag-and-drop secība; labošana / dzēšana; glabājas `excluded_positions` ar `company_id` (`031`, multi-company scope `035`)
- **Lietotāji** — Supabase Auth users + `public.users` profils; uzņēmuma membership, grupas, bloķēšana un noņemšana — skat. **Multi-company users, groups and permissions** augstāk
- **Uzstādījumi** — company profile (name, address, reg/VAT, bank, contacts, currency, logo, piedāvājuma derīgums un piezīmes)

### Company settings (`/settings`)

- Company name, address, registration number, optional **PVN numurs** (hidden in preview when empty; when set, PDF/Excel exports show VAT breakdown at the bottom — 21% on net total)
- **Bank account first** — entering a Latvian IBAN auto-fills bank name and SWIFT on the next row (Swedbank, SEB, Citadele, Luminor, etc.)
- Info phone and email
- Currency select (EUR, USD, GBP, PLN, SEK, NOK, DKK)
- **Tāmes derīguma termiņš** — integer days (suffix **dienas**); default **30**; used for new projects and estimate **Tāmes termiņš** calculation
- **Darbinieka standarta stundas likme** — optional decimal; currency suffix from company settings (e.g. `EUR`)
- **Piedāvājuma derīguma termiņš** — integer days (suffix **dienas**); default **30**; sadaļā **Piedāvājums**; PDF rāda treknrakstā **Piedāvājums spēkā X dienas** (pirms paraksta bloka)
- **Papildus informācija piedāvājumam** — textarea sadaļā **Piedāvājums**; katra rinda = atsevišķs komentārs; priekšskatījumā un PDF piedāvājumā (pirms paraksta bloka); tukšas rindas netiek rādītas
- **Logo upload** — drag-and-drop or file picker → Supabase Storage (`company-assets` bucket, path `companies/{companyId}/logo.*`)
- Live preview of company block on the right (wider sidebar column)
- Persisted in `public.company_settings` per company (`company_id`)

### Estimate editor (`/[id]`)

- **Header above table** — **2 columns**: module **visualizations** (left — from linked module or individual project uploads) · meta + actions (right)
- Meta layout: bold module name + action icons; **Tāmes piedāvājums** title + **Kopā** total; client, full-width object address; **Plānotā peļņa** · **Datums** · **Tāmes termiņš** vienā rindā (% palielina Darbs / Materiāli / Mehānismi; apstiprinātā tāmē neaktīva); apstiprinātā / pabeigtā tāmē — tikai **Plānotā peļņa** + **Datums**
- **Datums** — defaults to project **created_at**; **Tāmes termiņš** — defaults to Datums + validity days from **Uzstādījumi**; both editable (changing Datums recalculates termiņš); **zem termiņa** — "X dienas līdz termiņam" / "Termiņš šodien" / "Termiņš beidzies" rādīts, kad tāme ir saglabāta un projekts vēl nav apstiprināts
- **Individuāls projekts** — **Moduļa dati** icon opens `/[id]/module-data` (same upload UI as module detail: viz images, project PDFs, **Projekta apraksts** with save); incomplete viz/PDF → amber icon + optional full-page **spotlight** (blur overlay, ESC or **X** to dismiss)
- Excel-style table: categories, optional subcategories, line items, **multi-pozīcijas** (modal, DnD, **opciju saites**; piedāvājumā **viena rinda** ar opciju **select** + **Multi** badge zem nosaukuma)
- **Jauns projekts** — tāmes struktūra **klonēta no Sagataves** (`clone-sagatave-for-project.ts`); **Kopēt** no projekta kartes klonē esošas projekta tāmes pozīcijas un `multiOptionLinks` (jauni ID); tukšām esošām tāmēm fallback no sagataves; galvenē `{N} tāmes pozīcijas · {M} rindas` un **+ Tāmes pozīcija**
- **Saglabāt tāmi** — poga zem tabulas; nospiežot, tāme (title, meta, categories ar **iesaldētām cenām**) tiek saglabāta `estimates` tabulā; **atšķirīgas laika normas** sinhronizē uz **Sagatavi** un citiem **`active`** projektiem (`labor-time-norm-sync.ts`); apstiprinātie netiek mainīti; "Nesaglabātas izmaiņas" / "Saglabāts: DD.MM.YY" indikators; cenu iesaldēšana: `positionPriceId` atsauces tiek nomainītas uz faktiskajām cenām — kataloga izmaiņas neieetekmē saglabātās tāmes; pēc saglabāšanas **saglabātās cenas** salīdzināmas ar katalogu — atšķirības **sarkanās šūnās** (materiāli/mehanismi, arī apjoma kolonnās)
- **Jauni izcenojumi** — baneris **Pieejami jauni izcenojumi** un **Atjaunot cenas** tikai `active` projektiem (`shouldShowStaleCatalogPriceWarnings`); **Atjaunot cenas** atjaunina tabulas cenas no kataloga **tikai UI** (nesaglabā DB; **Saglabāt** paliek aktīvs)
- **Trūkstošās sagataves pozīcijas** — dzeltenš baneris **Sagatavē ir pozīcijas, kuras nav šajā tāmē** ar pogu **Atjaunot pozīcijas** (labajā pusē) tikai `active` projektiem; salīdzina struktūru ar `/estimate` (`sagatave-has-new-positions.ts`, `listProjectIdsWithNewSagatavePositions`); **Atjaunot pozīcijas** atver modāli ar trūkstošo pozīciju sarakstu pa kategorijām / subkategorijām un checkbox izvēli; **Pievienot izvēlētās** pievieno atzīmētās rindas **tikai UI**; jaunās rindas **zaļā izcelšanā** līdz lapas pārlādei; projekti no **Kopēt** (`meta.clonedFromProjectId`) izlaisti
- **Apstiprināta tāme** — **Apstiprināts** (`status = approved`) bloķē labošanu (read-only meta, bez drag/dzēšanas/pozīciju pievienošanas); projektu sarakstā **zaļa karte** (skat. **Projekti**); tāmes skatā (`/{id}`) — zaļš baneris **Tāme apstiprināta — izmaiņas vairs nav iespējamas** (`ApprovedEstimateStatusLabel`); **Tāmes termiņš** un atpakaļskaitīšana paslēpta; bez brīdinājumiem par jauniem izcenojumiem; PDF/Excel joprojām pieejami; **Kopēt** vienmēr pieejama; **Labot/Dzēst** paslēpti; **Pabeigts** pārvieto uz `completed` (pazūd no saraksta, saglabāts DB, atverams caur `/{id}`)
- **Materiālu saraksts** (tikai apstiprināts / pabeigts) — tabula **virs tāmes** (aiz apstiprināšanas banera); blakus **Lietotāji** (2:1, `project-materials-delegation-panel.tsx`), kamēr ir nepasūtīti materiāli; **drag-and-drop** — velc lietotāju no saraksta uz materiālu; piešķiršanas laikā attiecīgā rinda **blāva** ar spinneri, drag bloķēts; piešķirtais lietotājs zem materiāla nosaukuma; glabājas `meta.materialAssigneeUserIds` (`assignProjectMaterialUserAction`); viens materiāls = viena rinda (agregēts no tāmes, ieskaitot kompozītu patēriņu un izvēlētās multi opcijas); kolonnas **Apjoms**, **Budžeta cena** (iesaldēta), **Budžets**, **Darbības**; ja kataloga cena atšķiras — sarkanīga rinda + **Katalogā: …**; **Atjaunot cenu** (`fa-level-up-alt`) — vienmēr redzama, tas pats modālis kā **Pozicijas**; pēc saglabāšanas **ConfirmModal** **Vai pasūtīji materiālu?**; **Pasūtīts** (`fa-check`) — pogas vietā spinneris līdz saglabāšanai; rinda pazūd (`meta.orderedMaterialPositionIds`); piešķīrums tiek noņemts; kad **visi materiāli pasūtīti** — pazūd arī materiālu tabula un **Lietotāji** bloks; **brīdinājums** — oranžs baneris **Visi materiāli vēl nav pasūtīti! Atlikuši X no Y.** virs tabulas un uz `approved` kartes sarakstā, kamēr nav visi pasūtīti (neatkarīgi no delegācijas)
- **Eksports** (tikai kad saglabāts) — **PDF (piedāvājums)** un **Excel (tāme)** pogas ar **loading** (`fa-circle-notch fa-spin`) līdz lejupielādei; lejupielādēto failu prefiksi tiek tulkoti pēc aktīvās UI valodas (`piedavajums` / `offer`, `tame` / `estimate`); **PDF** — `@react-pdf/renderer` A4: uzņēmuma rekvizīti + logo (oriģinālās proporcijas, `objectFit: contain`), projekta info rindās (modulis · pasūtītājs; adrese; e-pasts · tālrunis ar `formatDisplayPhone`), vizualizācijas 2 kolonnās, vienkāršota tabula (Nr. · Nosaukums · Kopā ar uzņēmuma valūtu); subkategorijas ar `hiddenInOffer` → viena kopsummas rinda; ar `hiddenPricesInOffer` → pozīciju rindas ar **tukšām** cenu šūnām, bet subkategorijas/kategorijas kopsummas saglabātas; kategorijas līmeņa pozīcijas ar `hiddenPriceInOffer` → rinda ar tukšu cenu, kategorijas kopsumma saglabāta; karodziņi sinhronizēti no **Sagataves** (`sync-subcategory-offer-visibility.ts`, t.sk. `hiddenPriceInOffer`); apakšā **Summa bez PVN** · **PVN 21%** · **KOPĀ AR PVN**, ja **Uzstādījumos** ir PVN numurs (`vat-breakdown.ts`); sadaļa **Piedāvājumā neiekļautās pozīcijas** (globālais saraksts mīnus projekta noņemtās); **Papildus informācija piedāvājumam** no uzstādījumiem (rinda pa rindai) un treknrakstā **Piedāvājums spēkā X dienas** (`offerValidityDays`); piedāvājuma paraksta bloks kreisajā pusē (uzņēmuma nosaukums, info e-pasts, info tālrunis); Roboto fonts latviešu burtiem (`public/fonts/`); attēli no Supabase caur `pdf-image-fetch.ts`; **Excel** — `exceljs` pilna cenu detaļa (V.cena + Kopā pa Darbs/Materiāli/Mehānismi); kopsummas **Apjoma cena** kolonnās; datumi **DD.MM.YYYY** (`formatDisplayDateDdMmYyyy`); tāmei tāds pats PVN sadalījums apakšā, ja ir PVN numurs; kategoriju un pozīciju summas caur kopīgu `resolveEstimateLineItemPrices()`; lejupielāde no `/api/estimates/[id]/pdf` un `/api/estimates/[id]/excel`
- **Multi opciju saites** — sagatavē definētas pārus starp opcijām dažādos multi; projekta tāmē izvēle **divvirzienu** sinhronizē saistītās opcijas (session state; kopā ar pilnu tāmes persistenci roadmap)
- **Laika norma un individuālā stundas likme projekta tāmē** — kompozītpozīcijām inline `LaborTimeNormInput` tabulā (live pārrēķins: Darbs, Mehānismi, apjoma cenas, darbietilpība); pozīciju un multi opciju modāļos var ieslēgt **Individuālu stundas likmi**, kas aizstāj uzņēmuma noklusējuma likmi konkrētās darba pozīcijas aprēķinam un rāda uzņēmuma valūtas simbolu (`USD` → `$`, `EUR` → `€`); sistēmas administratoriem šis bloks netiek rādīts; nosaukums atver **Pozīcijas modāli**; multi — **Labot multi-pozīciju** modālis; modāļos `−`/`+` stepper (`patchLineItemLaborTimeNorm`)
- **Moduļa lieluma apjomi** — rindām ar `moduleSizeAttachment` **Apj.** kolonnā rāda piesaistīto lielumu (ne zem nosaukuma); sinhronizēts no sagataves / moduļa `project_description` (`sync-module-size-quantities.ts`); read-only, ja ir piesaiste
- **Multi piedāvājumā** — opciju **select** + inline laika norma izvēlētajai opcijai un apakšrindām; **Labot multi-pozīciju** modālis (cenas no kataloga joprojām read-only)
- **Collapse** category and subcategory rows (cookie per estimate id); **+ Sub** / **+ Pozīcija** auto-expands collapsed parent (**+ Multi** tikai sagatavē)
- Columns: **Nosaukums** (kataloga hinti; saistītām rindām **read-only**; materiālu / mehānismu nosaukumi labajā pusē), **Mērv.** (read-only, ja saistīts ar katalogu), **Apj.** (vienmēr redzama; rediģējama tikai **mainīgs apjoms** rindām bez moduļa piesaistes), **Vienības cena** (kompozītiem — rediģējama **Laika norma**; pārējās kolonnas read-only no kataloga / stundas likmes), **Apjoma cena** (Darbs / Materiāls / Mehānismi / Kopā — `apjoms × vienības cena` mainīga apjoma rindām; citām **—**), dzēšana; summu šūnās **0** rāda kā **—** (`formatAmountDisplay`); apjomi apaļoti līdz **2 cipariem**
- Kājene **Kopā** — komponentu kopsummas **Apjoma cena** kolonnās; kopējā summa **Apjoma cena → Kopā** (`formatAmountDisplay`, bez `€` prefiksa)
- **Piesaistītais moduļa lielums** — strukturēts teksts zem rindas nosaukuma (`EstimateLineItemNameField` `footer`)
- Drag-and-drop reorder for categories, subcategories, multi-pozīcijas, and items (cross-subcategory / cross-category item moves)
- Drop indicator: thick horizontal line on hover (no slide animation)
- Sticky table header, footer totals row
- Editable estimate number in meta when set
- **Neiekļautās pozīcijas** — bloks **zem tāmes tabulas**; rāda globālo sarakstu; **×** noņem pozīciju tikai no **šī projekta** piedāvājuma (`estimates.meta.excludedPositionIdsOmitted`); globālais `/excluded-positions` nemainās; **Kopēt** projektu kopē arī noņemšanas sarakstu; apstiprinātā tāmē — tikai lasāms

### Data

- **Supabase** (Postgres + Storage) when env is configured
- Falls back to in-memory sample data only when Supabase is **not** configured (configured DB with zero projects shows empty list, not seed cards)
- **Multi-company scoping** — projects, estimates, settings, modules, position prices/history, sagatave, excluded positions and private storage assets are scoped by active `company_id`
- **Company access** — `public.users.is_admin` marks system admins; `company_users` controls company membership/status; `company_user_groups` + `company_group_members` control per-company permissions
- **System admin data and performance** — `site_settings` controls app metadata; `site_user_groups` controls global default profiles; `site_languages` + `users.active_language_code` control signed-in UI language selection; anonymous login language uses `eb_language` cookie; `site_translations` stores seeded and custom translation values per key/language, served through a per-language server cache invalidated on translation/language edits; `site_doc_categories` + `site_docs` store public documentation; `/todo` stores its board state in browser `localStorage`; site settings/languages/docs use tag-based server caches; request-level caches prevent duplicate translation/admin/settings/module/catalog checks during one SSR render; project-list warning badges share one estimates read instead of three separate scans
- Estimate **full state** (title, meta, categories with baked-in prices) persisted via **Saglabāt tāmi** server action; dates also auto-saved on change
- `npm run db:migrate` applies only **pending** migrations (tracked in `public.schema_migrations`)
- App tables use **service-role server access** with RLS deny policies for browser clients

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase** — Postgres + Auth + Storage via `@supabase/ssr` + service role on server
- **Tailwind CSS 4**
- **@dnd-kit** — drag and drop
- **@react-pdf/renderer** — server-side PDF generation (estimate proposal); `serverExternalPackages` in `next.config.ts`
- **exceljs** — Excel workbook generation (estimate spreadsheet) with merged headers and cell borders
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

**Repo layout note:** root-level `npm run dev` delegates into the nested `estimate-builder/` app directory, so restarts keep Next.js pointed at the same codebase that contains `app/`.

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
| `NEXT_PUBLIC_SITE_URL` | Auth | `http://localhost:3100` locally; on Vercel set to `https://your-app.vercel.app` (server invites, CSP/HSTS); browser OAuth uses `window.location.origin` |
| `SUPABASE_DB_PASSWORD` or `DATABASE_URL` | Migrations | `npm run db:migrate` only |
| `SUPABASE_DB_REGION` | Migrations | Pooler region (default `eu-west-1`) if direct `db.*` host fails |
| `ALLOWED_EMAIL_DOMAIN` | Optional | If set, only this domain may sign in via Google OAuth (e.g. `mycompany.com`) |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Optional for multi-instance production | Enables distributed PDF/Excel export rate limiting; without these, local/single-instance deploys use in-process limits |

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
   - **Site URL:** production app URL (e.g. `https://your-app.vercel.app`); if Supabase falls back to Site URL and returns `/?code=...`, `proxy.ts` forwards it to `/auth/callback`  
   - **Redirect URLs:** add every app callback you use, e.g.  
     - `http://localhost:3100/auth/callback` (local dev)  
     - `https://your-app.vercel.app/auth/callback` (production)
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

**Schema:** `supabase/migrations/` — `users` (`034`, global `is_admin`; `041`, active language), `companies` / `company_users` / `company_user_groups` / `company_group_members` (`035`), `users.manage_company_access` backfill (`036`), custom company profiles (`037`), system admin tables (`038` site settings, `040` site user groups, `041` site languages, `042` site translations), system/company UI translation normalization and seed coverage (`043`–`076`), legacy group cleanup (`039`), `projects` + `estimates` (`company_id`), `estimate_positions`, `position_prices` + `position_price_history`, `excluded_positions`, `building_modules`, `company_settings`, legacy `user_groups` + `user_group_members` (`032`–`033`), `schema_migrations`, Storage `company-assets` / `module-assets` (private, company-scoped paths)

---

## Project structure

```
app/
├── layout.tsx          # Root layout; FeedbackToastProvider (vienīgais — Turbopack konteksts)
├── (protected)/      # Auth-gated routes (nav + pages)
│   ├── layout.tsx      # Login gate or AppNav + ActionPermissionsProvider + async AssignedMaterialsBanner + children
│   ├── page.tsx        # Project list (/) + archive (?archive=1)
│   ├── actions.ts      # create/update/delete project; save estimate; updateProjectEstimatePlannedProfitAction; omitProjectExcludedPositionAction; markProjectMaterialOrderedAction; assignProjectMaterialUserAction; updateProjectStatusAction; updateProjectEstimateDatesAction
│   ├── project-module-actions.ts  # individual project viz/PDF blocks + project description
│   ├── [id]/           # Estimate editor + module-data/
│   │   ├── page.tsx
│   │   └── module-data/page.tsx   # Individual project module uploads
│   ├── excluded-positions/  # page + CRUD / reorder actions (global excluded-offer list)
│   ├── modules/        # list + [id] detail; actions (CRUD, blocks, uploads, project description)
│   ├── estimate/            # Sagatave editor + saveEstimatePositionDocumentAction
│   ├── positions/      # page + CRUD / price-update / history / catalog sync actions
│   ├── users/          # page, groups/, inviteUserAction, assignUserGroupAction, create/update/delete group actions, updateUserGroupPermissionsAction, setCompanyUserAccessAction, removeCompanyUserAction
│   ├── site_companies/ # System admin company overview
│   ├── site_companies_users/ # System admin company-user overview
│   ├── site_settings/  # Global system name/slogan metadata settings
│   ├── site_user_groups/ # Global default group permissions
│   ├── site_docs/      # System admin public docs category/article manager
│   ├── site_languages/ # System languages and default/active toggles
│   ├── site_translations/ # Translation key CRUD and live search
│   ├── todo/          # System admin local todo board (two columns + DnD)
│   └── settings/
├── docs/              # Public documentation alias for wiki
├── wiki/              # Public documentation page
├── api/
│   ├── estimates/[projectId]/pdf/    # Authenticated PDF download (Piedāvājums)
│   ├── estimates/[projectId]/excel/  # Authenticated Excel download (Tāme)
│   ├── company/logo/       # Authenticated company logo proxy (private bucket)
│   ├── geo/calling-code/   # IP → phone country code (auth required)
│   ├── modules/asset/      # Authenticated PDF/image proxy (modules + projects paths)
├── auth/
│   ├── callback/       # OAuth code exchange
│   └── auth-code-error/
├── components/         # UI (estimate-table, public-docs-view, site-docs-manager, navigation-loading-context, action-permissions-context, project-materials-table, …)
├── lib/
│   ├── auth/           # getCurrentUser, permissions, requireAction, assertNavAccess, signInWithGoogle, signOut, mapUserDisplay, resolve-related-user-ids, require-auth
│   ├── companies/      # current company resolution and bootstrap company id
│   ├── client/         # cookie read/write helpers
│   ├── estimate-positions/  # repository, serialize, reorder, collapsed-sections-cookie, clone-sagatave-for-project, sagatave-has-new-positions, project-estimate-base, sync-subcategory-offer-visibility, labor-time-norm-sync, default sagatave
│   ├── excluded-positions/  # repository, resolve-project-excluded-positions (global list + per-project omissions)
│   ├── estimates/      # calculate-totals (resolveEstimateLineItemPrices), planned-profit, aggregate-project-materials, collect-estimate-document-units, calculate-line (addThousandSeparators), format-money, multi-position, composite-line-item, sync-module-size-quantities, …
│   ├── exports/        # estimate-pdf.tsx, estimate-excel.ts (exceljs), pdf-image-fetch.ts
│   ├── hooks/          # use-unsaved-changes-guard, use-sync-catalog-position-from-line-item, use-collapsed-estimate-sections, use-assigned-materials-banner-expanded
│   ├── form/           # input invalid styles
│   ├── geo/            # country calling codes, IP detect
│   ├── modules/        # repository, outline/blocks parse, building-module-data, project-description types/calc/parse, foundation-plane-options, format-module-size-summary, apply-module-size-adjustments, listBuildingModuleSizeOptions, file-storage (company-scoped module-assets), file-validation
│   ├── navigation/     # sidebar cookie constants, nav count badges and navigation helpers
│   ├── positions/      # repository, apply-catalog-to-line-item, sync-from-estimate-line-items, sync-estimate-line-items-to-catalog, has-defined-labor, variable-quantity, stale-catalog-price, filter-positions
│   ├── projects/       # repository, project-module-data, project-module-utils, list-user-assigned-materials, assigned-materials-banner-cookie, pending-project-materials, project-status, filter-projects, …
│   ├── settings/       # company settings, vat-breakdown, offer-additional-info, company-scoped logo storage, logo-validation, IBAN bank resolve, currencies
│   ├── site-admin/     # system admin access, site settings, docs, languages, translations, default groups
│   ├── users/          # Auth user list, public.users sync, company membership status, invite, groups-repository (company membership + permissions)
│   ├── validation/     # email, phone, formatDisplayPhone
│   ├── security/       # safe redirect paths, magic-bytes (file header validation), rate-limit
│   └── supabase/       # clients, update-session (session refresh + auth redirect), storage-key cookie cleanup
proxy.ts                # Supabase session refresh middleware
scripts/                # db:migrate, db:test, copy-pdf-worker.mjs
public/                 # pdf.worker.min.mjs (postinstall); fonts/Roboto-*.ttf (PDF latviešu burti)
supabase/migrations/    # 001–078 (038–042 = system admin tables; 043–078 = UI/docs translation seeds and follow-ups; 077 = site docs tables)
.github/workflows/      # secret-scan.yml, security-audit.yml, security-smoke.yml
.cursor/rules/          # README bump, commits, db:migrate, Supabase security
```

---

## Roadmap

- [x] Persist full estimate edits to `estimates` table — **Saglabāt tāmi** ar cenu iesaldēšanu
- [x] Individuāls projekts — per-project module data page, uploads, spotlight prompt
- [x] Estimate meta dates — auto defaults + manual override persisted
- [x] Ēku moduļi — catalog CRUD, detail page, image/PDF uploads, outline (DB), **Projekta apraksts** (persisted JSON), missing-data icon on list
- [x] Sagatave (`/estimate`) — template editor with subcategories, read-only catalog prices, DB persist, save + unsaved guard, catalog hints
- [x] Pozicijas catalog (`/positions`) — CRUD for **materials/mechanisms** + unit price updates with supplier info; **Darbs** from settings hourly rate
- [x] Sagatave ↔ Pozicijas sync — linked line items update catalog name/unit on edit or save
- [x] Multi-pozīcijas — modal editor, option DnD, table reorder, offer radio selection (sagatave + project estimates)
- [x] Estimate table collapse — categories and subcategories with per-document cookie
- [x] Pozicijas **mainīgs apjoms** — optional quantity column in project estimates (`024`)
- [x] Multi **opciju saites** — drag link starp opcijām dažādos multi, divvirzienu izvēle, saglabāšana sagatavē
- [x] Projekta tāme no sagataves — jauns projekts klonē sagataves struktūru; **Apj.** kolonna; **Apjoma cena**; read-only kataloga nosaukums/mērv./vienības cena; multi piedāvājumā viena rinda ar select
- [x] Sagatave — moduļa lieluma piesaiste darba pozīcijām (`moduleSizeAttachment`); subkategorijas piedāvājuma redzamība (`hiddenInOffer`, `hiddenPricesInOffer`); kategorijas līmeņa pozīciju cenu slēpšana (`hiddenPriceInOffer`, acs darbību zonā)
- [x] Piedāvājumā (`/[id]`) — `moduleSizeAttachment` apjomi **Apj.** kolonnā; multi tikai select; materiālu/mehānismu nosaukumi labajā pusē
- [x] Projekta apraksts — **Frontoni** sadaļā Sienas (pamata plakne, skaits, formula; pieskaitīts ārsienu neto)
- [x] Pozicijas — **Veids** filtrs (Visi / Materiāls / Mehānismi); bez cenas `- VALŪTA / mērv.`
- [x] Kompozīts pozīciju modelis — laika norma, Darbs = norma × likme, Materiāli/Mehānismi no kataloga (masīvi, cenas summējas); inline rediģēšana; multi-pozīcijām arī; moduļa apjoma brīdinājums; opciju kopsāvilkums multi modālī
- [x] Piedāvājumā `hiddenInOffer` / `hiddenPricesInOffer` / `hiddenPriceInOffer` — PDF tukšas cenu šūnas vai kopsummas rinda (karodziņi no sagataves)
- [x] Export estimate — **PDF (piedāvājums)** un **Excel (tāme)**; PDF ar rekvizītiem, logo, vizualizācijām; eksporta loading
- [x] Excel/PDF kopsummas — kopīga `resolveEstimateLineItemPrices()` (kompozītas pozīcijas, mainīgs apjoms)
- [x] Saglabātas tāmes — novecojušu kataloga cenu indikators (saraksts + projekta lapa + sarkanās šūnas); **Atjaunot cenas** (UI)
- [x] Sagataves trūkstošās pozīcijas — brīdinājums projektu sarakstā un projekta lapā; **Atjaunot pozīcijas** modālis ar checkbox izvēli; zaļa izcelšana (session)
- [x] Projekta statuss — **Apstiprināts** / **Noraidīts** / **Pabeigts** + **Arhīvs** ar statusa filtru
- [x] User management — lietotāju grupas, navigācijas/darbību tiesības (`/users`, `/users/groups`, `032` + `033`)
- [x] Company settings + logo on estimate PDF
- [x] Neiekļautās pozīcijas — globālais saraksts (`/excluded-positions`); projekta lapā bloks zem tāmes ar projekta līmeņa noņemšanu; PDF sadaļa
- [x] Materiālu saraksts — apstiprinātiem projektiem **virs tāmes**; agregēts apjoms un budžets; **Pasūtīts** + **Atjaunot cenu**; brīdinājums sarakstā un projekta lapā, kamēr nav visi pasūtīti
- [x] Materiālu delegācija — drag lietotāju uz materiālu (`materialAssigneeUserIds`); globālais baneris zem nav ar animāciju un cookie
- [x] UI atbilstība tiesībām — pogas slēptas pēc `permissions.actions` (`useActionPermission`)
- [x] System admin sadaļas — uzņēmumi, lietotāji, default grupas, Docs pārvaldība, Todo dēlis, valodas, tulkojumi un sistēmas uzstādījumi
- [x] Drošības audits — `security-check.md` **9.5 / 10** (L23, M23, L24, `npm audit` 0)

---

## CI / Security checks

Three GitHub Actions workflows run on every push and pull request:

| Workflow | File | What it checks |
|----------|------|----------------|
| **Secret scan** | `.github/workflows/secret-scan.yml` | gitleaks — API keys, tokens, passwords in git history |
| **Security audit** | `.github/workflows/security-audit.yml` | `npm audit` — HIGH and CRITICAL dependency vulnerabilities (`uuid` override `^11.1.1` caur `package.json`) |
| **Security smoke** | `.github/workflows/security-smoke.yml` | TypeScript, lint, production build, `requireAuth` on all actions, no `eval()`, security headers |

> `GITLEAKS_LICENSE` repo secret is required only for **private** repositories (free for public repos).

Pilns audits un atlikušie punkti: **`security-check.md`** (pašreiz **9.5 / 10**).

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
- `.cursor/rules/modal-confirm-exit.mdc` — `AppModal` backdrop confirm only when `dirty={true}`; Enter submit; fixed overlay (not `showModal`) for portaled dropdown z-index
- `.cursor/rules/tooltip-buttons.mdc` — icon buttons use `Tooltip`, not `title`
- `.cursor/rules/button-cursor-pointer.mdc` — all buttons use `cursor: pointer` (base styles in `globals.css`)
- `.cursor/rules/feedback-toast.mdc` — save feedback via toast provider (`app/layout.tsx`; konteksts `feedback-toast-context.ts`)

Skip version bump only for typo/docs-only changes when you explicitly say no release.

---

## Changelog

### Unreleased

- (none)

### v1.3.49

**Editable docs and sidebar counts**

- Added system-admin `/site_docs` management for public documentation categories and docs articles, including drag-and-drop article reorder and cross-category moves
- Reworked public `/docs` (`/wiki`) into a light documentation portal with fixed category sidebar, animated article lists, and article content view
- Added sidebar count badges, reordered system-admin navigation, and moved settings/user-management links to the bottom nav area above the language selector

### v1.3.48

**Sidebar persistence and Todo deletion**

- Persisted the manual sidebar collapsed state in `eb_sidebar_collapsed`, so refresh keeps the menu collapsed or expanded
- Prioritized the `/todo` delete drop zone in drag-and-drop collision detection so dragging a task into the delete block removes it reliably

### v1.3.47

**System admin Todo and public docs**

- Added a system-admin `/todo` board with two drag-and-drop columns, an add/edit task modal for title and description, and a top delete drop zone
- Added public `/docs` documentation (`/wiki` alias) and a login-card documentation link with seeded `lv`/`en` translations
- Seeded Todo and documentation UI translations through migrations `071`–`076`

### v1.3.46

**Translated export filenames**

- Added active-language export filename prefixes for PDF offers and Excel estimates via `exports.filename.offer` / `exports.filename.estimate`
- Seeded `lv` and `en` filename prefix translations in `070_seed_export_filename_translations.sql`

### v1.3.45

**Modal translations and currency display**

- Seeded missing `PositionModal` title/description/name placeholder translations and strengthened the Cursor i18n rule so new UI text must include `lv`/`en` DB seed migrations
- Replaced hardcoded hourly-rate `€` display with the active company currency in position and multi-position modals, including PDF/Excel export total headers

### v1.3.44

**System admin directory polish**

- Shows user avatars and company logos in `/site_companies_users`, including per-company logo loading for system admins
- Shows company logos in `/site_companies` and makes secondary company/user details more compact

### v1.3.43

**Sidebar polish**

- Shows the configured system name in the expanded sidebar header instead of a generic menu label
- Moves the language selector to a visible block above the user menu and opens its dropdown upward from the sidebar bottom area
- Improves collapsed sidebar affordances with square icon buttons and a visible ellipsis badge on the user avatar menu

### v1.3.42

**Sidebar navigation and user menu**

- Replaced the top navigation with a fixed left sidebar that can be manually collapsed to icon-only mode and expanded back to full labels
- Moved user actions into a sidebar user dropdown with a frontend-only user settings placeholder and sign-out action
- Seeded translations for the user menu and sidebar collapse/expand controls

### v1.3.41

**Position hourly rates, admin UX and page-load performance**

- Added per-position and per-multi-option custom hourly rates for composite labor calculations while keeping the company default hourly rate as the fallback
- Fixed the sagatave table action column overflow and formatted custom hourly rate inputs with two decimal places
- Improved system-admin UI: the top nav shows the system administrator label under the user name, `/site_companies_users` includes system admins without a company and displays each company user's actual group/role
- Reduced protected layout and project-list load work with cached site settings/languages, request-level repository deduping and a combined project badge scan
- Kept Font Awesome on the full CSS bundle after the solid-only import proved incompatible with the current icon setup

### v1.3.40

**Company name in top navigation**

- Shows the active company name under the signed-in user name in the top menu for non-system-admin users

### v1.3.39

**Opening marks in module descriptions**

- Added mark fields for module windows and doors, with examples like `L1` and `D2`
- Persisted opening marks in `project_description` and included them in module size summaries
- Seeded Latvian/English translation keys for opening mark labels

### v1.3.38

**Module notes and load optimizations**

- Added short module notes (up to 255 characters) in create/edit forms, shown under module names in the list and detail views
- Added lightweight module completion metadata so `/modules` no longer loads full visualization/project block JSON for every card
- Reduced initial render work by removing Auth Admin full-user scans from `listUsers()` and reusing project/settings data on project detail loads

### v1.3.37

**System admin access redirect**

- Redirected signed-in non-admin users from system admin pages back to `/` instead of showing a 404

### v1.3.36

**Protected navigation performance**

- Moved the assigned-materials banner out of blocking protected layout SSR and into a post-load `/api/assigned-materials` fetch
- Added request-level caching for server translations and system-admin checks to reduce duplicate Supabase calls during one render
- Kept the existing assigned-materials banner UX while preventing heavy project/estimate/catalog reads from delaying unrelated protected pages

### v1.3.35

**Language UX and translation caching**

- Added anonymous login language switching in the login card, backed by the `eb_language` cookie and the same DB translation dictionary used after sign-in
- Cached site translation dictionaries per language with `site-translations` tag invalidation on translation and language admin changes
- Removed the visible sagatave title field from the template editor header and filled remaining module/estimate/position i18n gaps, including module empty states and phone/roof/position labels

### v1.3.34

**Settings-backed login and i18n completion**

- Added a dedicated `/login` route and full-screen login card that uses the global system name and slogan from `site_settings`
- Removed hardcoded login marketing copy and cleaned obsolete login translation keys while keeping Google OAuth button/error text translatable
- Expanded remaining UI translation seed coverage across company pages, estimate/module/position flows and backend/action errors through the latest seed migrations

### v1.3.33

**System UI translations and rate-limit hardening**

- Seeded Latvian/English UI translation keys for navigation, system admin pages, language/translation forms, roles, statuses and permission labels via `043_seed_system_ui_translations.sql`
- Wired core navigation, language switching and permissions forms through the translation dictionary while keeping fallbacks for missing keys
- Added Upstash Redis REST support for distributed PDF/Excel export rate limiting, plus README/env/security-check documentation and CI smoke guard updates

### v1.3.32

**System admin settings, languages and translations**

- Added `is_admin`-only system admin navigation and pages for companies, company users, global settings, default user groups, languages and translations
- Added global `site_settings`, `site_user_groups`, `site_languages` and `site_translations` management, including top-bar language switching and app metadata from DB
- Added migrations `038`–`042` plus legacy group cleanup `039`, with editable default group permissions and translation CRUD/search

### v1.3.31

**Company-created user profiles**

- `/users/groups` now supports company-created profiles with create, rename, delete and permission editing for company-owned profiles only
- System default profiles are reduced to **Administrators** and **Skatītājs**; company admins can view them, while permission edits require `public.users.is_admin = true`
- `037_company_custom_user_groups.sql` converts legacy extra groups into company-owned profiles and `next.config.ts` sets `turbopack.root` explicitly to remove the multiple-lockfile workspace warning

### v1.3.30

**Company user access UX fixes**

- `/users` unauthorized access now redirects to the project list instead of showing a 404
- `036_company_user_manage_access_permission.sql` backfills `users.manage_company_access` into existing company/user group permission JSON so the checkbox and card actions appear consistently
- Root npm scripts now delegate into the nested `estimate-builder/` app directory, preventing dev-server restarts from serving an older parent workspace bundle

### v1.3.29

**Multi-company users and tenant scoping**

- **Multi-company foundation** — `034_users_system_admin.sql` and `035_multi_company_foundation.sql` add `public.users.is_admin`, `companies`, `company_users`, company groups/memberships, and `company_id` scoping for projects, estimates, settings, modules, catalogs, sagatave, excluded positions and price history
- **Company user management** — `/users` cards now support company access lock/unlock and remove/leave actions with `ConfirmModal`; new `users.manage_company_access` permission appears under group action permissions
- **Company-scoped assets and repositories** — logo and module/project files use `companies/{companyId}/...` storage paths, and server repositories/API routes enforce the active company context

### v1.3.28

**Navigation performance**

- **Protected layout** — global assigned-materials banner now loads in a separate `Suspense` slot, so page/menu transitions are no longer blocked by the banner's users, catalog, settings, project and estimate queries
- **Auth request cache** — `getCurrentUser()` and `getCurrentUserAccess()` use React request caching to avoid duplicate Supabase auth/access lookups during one server render
- **Assigned materials data** — `listUserAssignedMaterialGroups()` can reuse an already loaded catalog, avoiding an extra `listPositionPrices()` call from the layout banner path

### v1.3.27

**OAuth redirect allowlist match**

- **Google login** — `sign-in-with-google.ts` no longer appends `?next=/` for root login, so Supabase can match the exact allowed redirect URL (`/auth/callback`) instead of falling back to the Site URL
- **Localhost/Vercel OAuth** — root login now uses the same clean callback path on both origins; non-root return paths still use the safe `next` query

### v1.3.26

**Localhost OAuth and protected route fallback**

- **OAuth fallback** — `update-session.ts` redirects `/?code=...` to `/auth/callback?code=...`, so Supabase Site URL fallback still exchanges the code instead of leaving the app on the login page
- **Local dev auth** — `assertNavAccess()` returns full local permissions when Supabase is not configured in development, while production and configured Supabase still require real sessions
- **Protected pages** — all protected pages stop rendering child content when there is no session, letting `(protected)/layout.tsx` show the Google login gate instead of returning a 404

### v1.3.25

**Sagataves trūkstošās pozīcijas — modālis ar izvēli**

- Banera teksts **Sagatavē ir pozīcijas, kuras nav šajā tāmē** (projektu saraksts + projekta lapa)
- **Atjaunot pozīcijas** atver modāli ar trūkstošo pozīciju sarakstu pa kategorijām / subkategorijām un checkbox izvēli (`restore-sagatave-positions-modal.tsx`)
- **Pievienot izvēlētās** — pievieno tikai atzīmētās pozīcijas **tikai UI**; jaunās rindas **zaļā izcelšanā** līdz lapas pārlādei
- `listMissingSagatavePositions()` un selektīva `mergeNewSagatavePositionsIntoProject()` (`sagatave-has-new-positions.ts`)

### v1.3.24

**Sagatave — kategorijas līmeņa pozīciju cenu slēpšana piedāvājumā**

- **Acs poga** — pozīcijām tieši zem kategorijas (ne subkategorijas) darbību zonā: `fa-eye` / `fa-eye-slash` (`hiddenPriceInOffer` JSON); ieslēgts — dzeltens `eye-slash`, acs vienmēr redzama, labot/dzēst tikai hover (`line-item-price-visibility-toggle.tsx`, `estimate-position-table.tsx`)
- **PDF piedāvājums** — paslēptas cenas rinda ar nosaukumu un tukšu **Kopā €**; kategorijas kopsumma nemainās (`estimate-pdf.tsx`)
- **Sinhronizācija** — `hiddenPriceInOffer` no sagataves uz projekta PDF (`sync-subcategory-offer-visibility.ts`)

### v1.3.23

**Materiālu pasūtīšana — loading un globālais baneris**

- **Piešķiršana lietotājam** — materiāla rinda kļūst blāva ar spinneri; drag-and-drop bloķēts līdz saglabāšanai (`project-materials-delegation-panel.tsx`, `project-materials-table.tsx`)
- **Pasūtīts** — pogas vietā spinneris, kamēr `markProjectMaterialOrderedAction` notiek (`project-material-row-actions.tsx`)
- **Globālais materiālu baneris** — saistīto kontu atradīšana izmanto `listUsers` vārdu, ne tikai auth metadatus; `listUserAssignedMaterialGroups` atbalsta `allUsers` (`layout.tsx`, `list-user-assigned-materials.ts`)

### v1.3.22

**Laika norma, eksporti un PDF piedāvājums**

- **Laika norma projekta tāmē** — inline input tabulā ar live pārrēķinu (`patchLineItemLaborTimeNorm`, `LaborTimeNormInput`); kompozītpozīciju nosaukums atver modāli; multi — **Labot multi-pozīciju**; modāļos `−`/`+` stepper (0,01, centrēts skaitlis)
- **Laika normu sinhronizācija** — **Saglabāt tāmi** pārnese uz **Sagatavi** un citiem **`active`** projektiem (`labor-time-norm-sync.ts`); `approved` / `completed` netiek mainīti
- **PDF piedāvājums** — `hiddenPricesInOffer`: pozīciju rindas ar tukšām cenu šūnām, subkategoriju/kategoriju kopsummas saglabātas; karodziņu sinhronizācija no sagataves pēc nosaukuma (`sync-subcategory-offer-visibility.ts`)
- **Excel eksports** — kopsummas **Apjoma cena** kolonnās; datumi **DD.MM.YYYY** (`formatDisplayDateDdMmYyyy`)

### v1.3.21

**Navigācijas ielāde un UI labojumi**

- **Projektu / moduļu kartes** — klikšķis rāda pilnekrāna blur + loading modāli līdz lapai ielādējas (`navigation-loading-context.tsx`, `project-card.tsx`, `module-card.tsx`)
- **Izvēlne Projekti** — no projekta lapas (`/{id}`) saite atkal ved uz sarakstu; **Projekti** aktīvs tikai uz `/` (`app-nav.tsx`)
- **Plānotā peļņa** — meta rindā pirms **Datums**; `%` vairs nepārklājas ar datuma lauku (`estimate-table.tsx`)
- **Pozīcijas · Vēsture** — ielādes stāvoklī spinneris pirms **Ielādē vēsturi…** (`position-price-history-modal.tsx`)

### v1.3.20

**Plānotā peļņa un UX**

- **Plānotā peļņa** — projekta tāmē meta lauks ar **%**; palielina Darbs / Materiāli / Mehānismi vienības cenas un kopsummas (`planned-profit.ts`, `calculate-totals.ts`, `estimate-planned-profit-context.tsx`); glabājas `meta.plannedProfitPercent`; PDF un Excel eksportos iekļauts
- **Apstiprināta tāme** — **Plānotā peļņa** paliek redzama, bet neaktīva (`disabled`); rāda saglabāto vērtību objektam
- **Navigācija** — izvēlnes saites rāda spinneri un kļūst neklikšķināmas līdz lapas pārejai (`app-nav.tsx`)
- **Jauns projekts** — optimistiska izveide: karte parādās uzreiz ar blur + spinner, tad navigācija uz projektu (`projects-page-create-context.tsx`, `project-list.tsx`, `project-form-modal.tsx`); submit pogā **Izveido…** ar spinneri
- **Moduļu attēli / PDF** — loading spinner līdz ielādējās (`module-visualization-image.tsx`, `module-pdf-thumbnail.tsx`)

### v1.3.19

**Projektu kartes**

- **Nepasūtīti materiāli** — oranžais brīdinājums apstiprinātā projekta kartē stiepjas pa visu kartes platumu apakšā (`project-card.tsx`, `pending-project-materials-banner.tsx`)

### v1.3.18

**Apstiprinātas tāmes UI**

- **Tāmes termiņš** — apstiprinātā / pabeigtā projektā (`estimate-table.tsx`) paslēpts lauks **Tāmes termiņš** un atpakaļskaitīšana (**X dienas līdz termiņam** u.tml.); paliek tikai **Datums**
- **Materiālu delegācija** — kad visi materiāli pasūtīti, `project-materials-delegation-panel.tsx` vairs nerāda ne materiālu tabulu, ne **Lietotāji** bloku

### v1.3.17

**Vercel OAuth**

- **`sign-in-with-google.ts`** — OAuth callback uses `window.location.origin` in the browser (fixes login redirect to localhost when `NEXT_PUBLIC_SITE_URL` is wrong at build time)
- **README** — Vercel deployment and Supabase URL Configuration (Site URL + Redirect URLs vs Google provider callback)

### v1.3.16

**CI lint**

- **`estimate-table.tsx`** — `hasStaleCatalogPrices` useMemo (React Compiler `preserve-manual-memoization`)
- **`sagatave-has-new-positions.ts`** — `prefer-const` (`projectCategory`, `projectSubcategory`)

### v1.3.15

**UI tiesības, drošība 9.5, toast un npm**

- **UI ↔ tiesības (L23)** — `action-permissions-context.tsx`; `ActionPermissionsProvider` `(protected)/layout.tsx`; pogas slēptas pēc `permissions.actions`
- **M22** — jauni lietotāji bez membership → **Skatītājs** (`ensureUserDefaultMembership`); `/users` noklusējuma grupa Skatītājs
- **M23** — noņemts admin `slug` bypass; admin tiesības tikai `getUserAccess()` → `createFullPermissions(true)`; saglabāšanā admin grupai vienmēr pilns JSON
- **L24** — `getPositionPriceHistoryAction` → `requireAction("positions.manage")`
- **npm** — `package.json` `overrides.uuid` `^11.1.1`; `npm audit` 0 moderate+
- **Toast** — `FeedbackToastProvider` tikai `app/layout.tsx` (novērš Turbopack `useFeedbackToast` kļūdu materiālu banerī)
- **`security-check.md`** — atkārtota pārbaude **9.5 / 10**

### v1.3.14

**Lietotāju grupas — admin labojumi un dokumentācija**

- **Admin redzamība** — `groups-repository.ts`: membership bez join kļūdas; `033` repair migrācija
- **DB** — `033_repair_admin_group_memberships.sql`: atjauno admin `permissions` JSON; piešķir admin lietotājiem bez membership
- **README** — User groups sadaļa, shēma, struktūra; `security-check.md` M14 ✅

### v1.3.13

**Google Maps noņemts; adrese brīvā tekstā**

- **Projekta forma** — adrese parasts teksta lauks (`ProjectFormModal`); bez Places autocomplete un kartes priekšskatījuma
- **Tāmes galvene** — noņemts `AddressMapEmbed`; **2 kolonnas**: moduļa vizualizācijas · meta + darbības
- **Dzēsti** — `app/lib/google-maps/`, `/api/places/autocomplete`, `address-autocomplete-field.tsx`, `address-map-embed.tsx`, `@types/google.maps`
- **CSP** (`next.config.ts`) — noņemti Maps/Places domēni no `script-src`, `connect-src`, `frame-src`
- **UI/CSS** — `.pac-container` stili no `globals.css`; `AppModal` vairs neignorē `.pac-container` backdrop klikšķī
- **Env** — vairs nav nepieciešams `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_API_KEY` (`.env.example` atjaunināts)
- **Drošība** — `028_private_storage_buckets.sql` apstiprināts piemērots (`npm run db:migrate`); `security-check.md` atjaunināts (M17 noņemts)

### v1.3.12

**Lietotāju grupas un tiesības (M14)**

- **DB** — `032_user_groups.sql`: `user_groups`, `user_group_members`; RLS deny; 4 sistēmas grupas; esošie lietotāji → Administrators
- **`/users`** — grupas izvēle katram lietotājam (`user-group-select.tsx`); saite **Grupas un tiesības**
- **`/users/groups`** — matrica: navigācija + darbības (`user-groups-permissions-form.tsx`)
- **Eforcēšana** — `requireAction()` visos server actions; `assertNavAccess()` lapās; filtrēta `AppNav`; PDF/Excel ar `estimate.export`

### v1.3.11

**Materiālu delegācija un globālais baneris**

- **Projekta tāme** (`/{id}`) — materiālu tabula + **Lietotāji** bloks (2:1); drag-and-drop piešķir materiālu lietotājam; piešķirtais zem nosaukuma; `meta.materialAssigneeUserIds`; `assignProjectMaterialUserAction` / `assignProjectMaterialUser()`
- **Globālais baneris** — zem top izvēlnes ielogotajam lietotājam ar nepasūtītiem piešķirtajiem materiāliem (`list-user-assigned-materials.ts`, `assigned-materials-banner.tsx`); vairāki projekti — pārslēgšana; **sakļaujams** ar animāciju; stāvoklis cookie `eb_assigned_materials_banner_collapsed_{userId}`; atpazīst saistītos kontus pēc normalizēta vārda (`resolve-related-user-ids.ts`)
- **Moduļu vizualizācijas** — autentificēts attēlu ielāde projektos un `/modules/[id]` (`module-visualization-image.tsx`, `resolve-block-asset.ts`)
- **Toast** — `FeedbackToastProvider` arī `(protected)/layout.tsx` (novērš kļūdu materiālu tabulā)

### v1.3.10

**Materiālu pasūtīšanas plūsma un brīdinājumi**

- **Materiālu saraksts** — pārvietots **virs tāmes** tabulas (`estimate-table.tsx`)
- **Atjaunot cenu** — poga **vienmēr** redzama; pēc saglabāšanas **ConfirmModal** **Vai pasūtīji materiālu?** — apstiprinot, materiāls pazūd no saraksta
- **Brīdinājums** — **Visi materiāli vēl nav pasūtīti!** uz `approved` projekta kartes (izteikts oranžs bloks) un baneris projekta lapā ar **Atlikuši X no Y** (`listProjectIdsWithPendingMaterials`, `pending-project-materials.ts`, `pending-project-materials-banner.tsx`)
- **Darbības** — `markProjectMaterialOrderedAction`; `project-material-row-actions.tsx`

### v1.3.9

**Apstiprinātu projektu kartes, manuālā mērvienība sagatavē un toast labojums**

- **Projektu saraksts** — `approved` kartes visa virsma zaļā tonī (`approvedEstimateSurfaceClassName`); bez atsevišķas birkas sarakstā; tāmes skatā baneris paliek (`approved-estimate-status-label.tsx`)
- **Sagatave (`/estimate`)** — pozīciju modālī slēdzis **Manuāli norādīta mērvienība** + select (`manualUnitEnabled`, `manualUnit` JSON); mērvienību saraksts no tāmes (`collect-estimate-document-units.ts`); materiālu patēriņš, ja mērvienības nesakrīt
- **Toast** — `FeedbackToastProvider` tikai `app/layout.tsx`; konteksts `feedback-toast-context.ts` (novērš `useFeedbackToast must be used within FeedbackToastProvider` Turbopack)
- **Maršruts `/`** — atjaunots `app/(protected)/page.tsx` (projektu saraksts; novērš 404)

### v1.3.8

**Materiālu saraksts apstiprinātiem projektiem**

- **Projekta tāme** (`/{id}`) — jauna tabula **Materiālu saraksts** zem tāmes, tikai `approved` / `completed`; agregē materiālus no tāmes (kompozīts × patēriņš, multi — izvēlētā opcija)
- **Kolonnas** — Nosaukums, Mērv., Apjoms, Budžeta cena (iesaldēta), Budžets, Darbības
- **Pasūtīts** — materiāls pazūd no saraksta; glabājas `estimates.meta.orderedMaterialPositionIds` (bez jaunas migrācijas)
- **Atjaunot cenu** — redzama, ja kataloga cena ≠ budžeta cena; `UpdatePositionPriceModal` kā `/positions`; atjaunina `position_prices` un vēsturi
- **UI** — sarkanīga rinda un **Katalogā: …**, kad cenas atšķiras
- **Jaunie faili** — `aggregate-project-materials.ts`, `project-materials-table.tsx`, `project-material-row-actions.tsx`

### v1.3.7

**Neiekļautās pozīcijas — globālais saraksts un projekta pielāgojumi**

- **Nav** — jauns punkts **Neiekļautās pozīcijas** (`/excluded-positions`); CRUD, drag-and-drop secība
- **Projekta tāme** (`/{id}`) — bloks **zem tāmes tabulas** ar globālo sarakstu; **×** noņem pozīciju tikai no šī projekta piedāvājuma (`meta.excludedPositionIdsOmitted`); **Kopēt** projektu kopē arī noņemšanas sarakstu
- **PDF piedāvājums** — sadaļa **Piedāvājumā neiekļautās pozīcijas** (projekta efektīvais saraksts)
- **Supabase** — `031_excluded_positions.sql` (`excluded_positions`); obligāts `npm run db:migrate`
- **Jaunie faili** — `app/lib/excluded-positions/`, `app/(protected)/excluded-positions/`, `project-excluded-positions-panel.tsx`, `resolve-project-excluded-positions.ts`
- **Tooltip** — `align` (`center` / `start` / `end`) labajā malā esošām pogām

### v1.3.6

**Piedāvājuma derīgums PDF un uzstādījumos**

- **`/settings`** — sadaļā **Piedāvājums** jauns lauks **Piedāvājuma derīguma termiņš** (dienas, noklusējums 30); priekšskatījumā treknrakstā **Piedāvājums spēkā X dienas**
- **PDF piedāvājums** — pēc papildu informācijas rindām, pirms paraksta bloka, treknrakstā **Piedāvājums spēkā X dienas**
- **Supabase** — `030_company_settings_offer_validity_days.sql` (`company_settings.offer_validity_days`)

### v1.3.5

**Uzstādījumi — papildus informācija piedāvājumam**

- **`/settings`** — jauna sadaļa **Piedāvājums** ar textarea **Papildus informācija piedāvājumam**; katra rinda = atsevišķs komentārs; priekšskatījumā sadaļa **Piedāvājuma piezīmes**
- **PDF piedāvājums** — komentāri rādīti pēc kopsummas/PVN, pirms paraksta bloka
- **Supabase** — `029_company_settings_offer_additional_info.sql` (`company_settings.offer_additional_info`)
- **Jauns fails** — `app/lib/settings/offer-additional-info.ts` (`parseOfferAdditionalInfoLines`)

### v1.3.4

**Sagataves jaunas pozīcijas — brīdinājums un sinhronizācija**

- **Projektu saraksts** — dzeltena kartes apmale + **Sagatavē pievienotas jaunas pozīcijas** (`listProjectIdsWithNewSagatavePositions`); tikai `active`; izlaisti projekti ar `meta.clonedFromProjectId` (**Kopēt**)
- **Projekta lapa** — dzeltenš baneris ar pogu **Atjaunot pozicijas** labajā pusē; pievieno trūkstošo struktūru no sagataves **tikai UI** (`mergeNewSagatavePositionsIntoProject`)
- **Zaļa izcelšana** — jaunās kategorijas / subkategorijas / rindas zaļā tonī līdz lapas pārlādei vai atkārtotai ieeja projektā
- **Sagataves saglabāšana** — `revalidatePath("/")` pēc `/estimate` saglabāšanas, lai projektu saraksts atjaunojas
- **Jaunie faili / loģika** — `sagatave-has-new-positions.ts`; `EstimateMeta.clonedFromProjectId` pie **Kopēt** izveides

### v1.3.3

**Eksporta PVN sadalījums un piedāvājuma paraksts**

- **PVN sadalījums** — ja **Uzstādījumos** ir aizpildīts PVN numurs, PDF (piedāvājums) un Excel (tāme) apakšā rāda **Summa bez PVN**, **PVN 21%** un **KOPĀ AR PVN**; bez PVN numura paliek tikai **PAVISAM KOPĀ**
- **Piedāvājuma paraksts** — PDF apakšā kreisajā pusē: uzņēmuma nosaukums, info e-pasts, info tālrunis (tukši lauki netiek rādīti)
- **Jauns fails** — `app/lib/settings/vat-breakdown.ts` (kopīgs PVN aprēķins eksportiem)

### v1.3.2

**Piedāvājuma PDF — logo un kontaktu izkārtojums**

- **Logo** — vairs netiek izstiepts; `maxHeight` + `objectFit: contain` saglabā oriģinālās proporcijas
- **Projekta info** — tālrunis blakus e-pastam vienā rindā; numurs ar `formatDisplayPhone()` (`+371 987654321`); info bloks strukturēts pa rindām (projekts/pasūtītājs · adrese · e-pasts/tālrunis · datums/termiņš)

### v1.3.1

**Piedāvājuma PDF, sagataves subkategoriju redzamība un tāmes kopsummu labojums**

- **Piedāvājuma PDF** — jauns izkārtojums: rekvizīti (kreisā puse) + logo (labā), projekta dati (modulis, pasūtītājs, adrese, tālrunis, e-pasts), vizualizācijas 2 kolonnās, vienkāršota tabula (Nr. · Nosaukums · Kopā €); Roboto TTF latviešu burtiem (`public/fonts/`); attēlu ielāde serverī (`pdf-image-fetch.ts`)
- **Sagatave — subkategoriju cenu slēpšana** — `fa-stream` poga blakus acij; `hiddenPricesInOffer` JSON; PDF subkategorijai rāda kopsummu, ja ieslēgts `hiddenInOffer` vai `hiddenPricesInOffer`
- **PDF subkategoriju karodziņi no sagataves** — `sync-subcategory-offer-visibility.ts` pirms PDF ģenerēšanas sinhronizē `hiddenInOffer` / `hiddenPricesInOffer` no sagataves uz projekta tāmi (pēc indeksa / nosaukuma)
- **Eksporta pogas** — PDF un Excel lejupielāde ar `fetch` + loading spinner (`fa-circle-notch fa-spin`), bloķē dubultklikšķi; kļūda → `FeedbackToast`
- **Kopsummu labojums** — jauna kopīga `resolveEstimateLineItemPrices()` (`calculate-totals.ts`); Excel un PDF pozīciju rindas izmanto to pašu loģiku kā kategoriju kopsummas (kompozītas pozīcijas, `variableQuantity`, moduļa lielums)
- **Jaunie faili** — `subcategory-price-visibility-toggle.tsx`, `sync-subcategory-offer-visibility.ts`, `pdf-image-fetch.ts`, `public/fonts/Roboto-Regular.ttf`, `public/fonts/Roboto-Bold.ttf`

### v1.3.0

**Drošības un lint kļūdu labojumi — xlsx noņemts, ESLint konfigurācija**

- **`xlsx` noņemts** (`package.json`) — HIGH drošības ievainojamība (Prototype Pollution + ReDoS); Excel eksports jau izmanto `exceljs`; `xlsx` vairs nav nepieciešams
- **ESLint konfigurācija** (`eslint.config.mjs`) — `public/**` pievienots ignorē (PDF worker minifikāts fails); `react-hooks/set-state-in-effect`, `react-hooks/refs`, `react-hooks/immutability` pazemināti uz `warn` (šie paterni ir leģitīmi daudzās komponentēs — modāļu atiestatīšana, kontrollētu lauku sinhronizācija)
- **`module` → `mod` pārsaukšana** (5 faili) — `@next/next/no-assign-module-variable` kļūdu novēršana failos `modules/[id]/page.tsx`, `format-attached-module-size-display.ts`, `modules/repository.ts` (×2), `projects/repository.ts` (×2)
- **`confirm-modal.tsx`** — ref atjaunināšana pārvietota no render laika uz `useEffect`; novērš `react-hooks/refs` kļūdu
- **Lint rezultāts pēc labojumiem:** 0 kļūdas, 53 brīdinājumi (CI iet cauri)

### v1.2.9

**Materiāla patēriņš, kompozītu kopsummu labojums, opciju nosaukumu fallback un UI kļūdu labojumi**

- **Materiāla patēriņš** (`consumption`) — jauns neobligāts lauks `LineItemCatalogRef.consumption`; kad materiāla mērvienība atšķiras no pozīcijas moduļa mērvienības (piem. m pret m²), parādās `MaterialConsumptionInput` pozīcijas un multi-pozīcijas modāļos; `deriveCompositeUnitPrice` reizina katra materiāla cenu ar patēriņa koeficientu (noklusējums 1); `refreshCatalogRef` saglabā `consumption` vērtību pie kataloga atsvaidzināšanas
- **Kompozītu kopsummu labojums** (`calculate-totals.ts`) — `calculateEstimateTotals` kompozītajiem elementiem tagad vienmēr izsauc `deriveCompositeUnitPrice` (aktuāla struktūra ar `consumption`), nevis izmanto iesaldēto `item.unitPrice`; pirms šī labojuma patēriņš netika atspoguļots kopsummās, ja tāme bija saglabāta pirms `consumption` pievienošanas
- **Moduļa lieluma mērvienības sinhronizācija** (`sync-module-size-quantities.ts`) — `syncLineItemQuantityFromModuleSize` tagad sinhronizē arī `item.unit` no moduļa lieluma, ne tikai `quantity`; saglabājot projekta tāmi, mērvienība tiek atjaunināta automātiski, ja pozīcijai ir `moduleSizeAttachment`
- **Multi-pozīciju opciju nosaukumi** (`multi-position.ts`) — `getMultiPositionSelectionOptions` (opciju select projekta tāmē) un jauna `resolveLineItemDisplayName` helper funkcija tagad izmanto materiāla/mehānisma nosaukumu kā fallback, ja opcija nav nosaukta; šī pati loģika pielietota **Excel** un **PDF** eksportā
- **Google avatari** (`user-avatar.tsx`, `users/repository.ts`) — `UserAvatar` pārveidots par klienta komponentu ar `onError` apstrādi — bojāta Google attēla URL gadījumā tiek parādīti iniciāļi; `resolveAvatarUrl` tagad pārbauda arī `user.identities[].identity_data`, kur dažiem Google OAuth lietotājiem avatar URL tiek glabāts
- **`/positions` novirzīšana** (`next.config.ts`) — pievienots pastāvīgs redirect `/positions` → `/settings/positions`; novērš konsoles kļūdu `invalid input syntax for type uuid: "positions"` no `[id]` dinamiskā maršruta

### v1.2.8

**Security hardening — auth guards, private storage, rate limiting, CI**

- **`requireAuth()`** helper (`app/lib/auth/require-auth.ts`) — added to every server action (projects, estimates, positions, modules, settings, users); unauthenticated calls now return `{ ok: false, error: "Nav autorizācijas." }` instead of silently executing with service role
- **Middleware redirect** (`update-session.ts`) — unauthenticated requests to non-`/auth/*` routes are now redirected to `/` (defense in depth on top of layout login gate)
- **Private storage buckets** — migration `028_private_storage_buckets.sql` makes `module-assets` and `company-assets` private; files served only through authenticated proxies (`/api/modules/asset`, `/api/company/logo`)
- **`/api/company/logo`** — new authenticated route to serve the company logo from private Supabase storage
- **Google OAuth domain restriction** — optional `ALLOWED_EMAIL_DOMAIN` env var; if set, users whose email does not match the domain are signed out at callback
- **X-Forwarded-Host validation** (`auth/callback`) — host validated against `NEXT_PUBLIC_SITE_URL` in production to prevent open-redirect via header injection
- **Rate limiting** (`app/lib/security/rate-limit.ts`) — 60 req/min on Places API (per user), 20 req/min on PDF/Excel export
- **Magic-byte validation** (`app/lib/security/magic-bytes.ts`) — file uploads (module images, project PDFs, company logo) validated against actual header bytes, not just `Content-Type`
- **Production guard** — when Supabase is not configured in `NODE_ENV=production`, layout blocks access instead of showing the app in open demo mode
- **Security headers** — added `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; HSTS when `NEXT_PUBLIC_SITE_URL` starts with `https://`; `unsafe-eval` in CSP only in development (React debugger requirement)
- **Error sanitization** — Supabase and Google API error messages no longer forwarded to clients
- **`logoUrl` validation** — `saveCompanySettings` rejects any URL that is not a `/api/company/logo` path
- **Auth on geo + Places endpoints** — `/api/geo/calling-code` and `/api/places/autocomplete` now require a valid session
- **GitHub Actions** (`.github/workflows/`) — 3 new workflows on every push: `secret-scan` (gitleaks), `security-audit` (npm audit high+), `security-smoke` (typecheck + lint + build + static security checks)
- **`security-check.md`** — full audit report with findings, fixes applied, score (4/10 → **9.5/10**), and remaining TODO

### v1.2.7

**Laika norma — vienmēr 2 cipari aiz komata**

- **`formatTimeNormDisplay`** (`variable-quantity.ts`) — noņemts `value === 0` agrais atgriešanās; tagad 0 formatējas kā `"0,00"` nevis `""` (tukšums); ne-nulle vērtības jau izmantoja `.toFixed(2)`, tāpēc tās nav mainītas
- **`LaborTimeNormInput`** — `placeholder` mainīts no `"0"` uz `"0,00"`; blur notikums normalizē jebkuru nepilnu ievadi (piem. `"0,0"`) uz `"0,00"` caur `formatTimeNormDisplay(parseTimeNormInput(draft))`

### v1.2.6

**Valūtas simbols no uzstādījumiem — tāmes kolonnu virsraksti un naudas formatēšana**

- **`getCurrencySymbol()`** — jauna funkcija `currencies.ts`; katrai valūtai pievienots `symbol` lauks (EUR → €, USD → $, GBP → £, PLN → zł, SEK/NOK/DKK → kr)
- **`formatMoney` / `formatMoneyDisplay`** — tagad pieņem `currency?: string | null` parametru un izmanto `getCurrencySymbol()` simbolu; iepriekš bija hardkodēts `€`
- **`estimate-table.tsx`** — `currency` prop propagēts caur visu komponentu ķēdi: `EstimateTable` → `EstimateDndTable` → `EstimateDndTableInner` → `CategoryBlock` → `SubcategoryBlock` → `SortableLineItemRow` → `LineItemRow`; **KOPĀ** žetons tagad rāda pareizo valūtas simbolu; kataloga hintu cenas `EstimateLineItemNameField` arī iegūst `currency`
- **`estimate-position-table.tsx`** — `currency` prop pievienots `EstimatePositionDndTable` sub-komponentam un propagēts no `EstimatePositionTable` caur `EstimatePositionDndTable`
- **Kolonu virsraksti** — `getUnitPriceSubheaderLabels(currency)` jau bija ieviests v1.2.5; šajā versijā salabota prop propagācija, kas iepriekš nenonāca līdz renderēšanas slānim

### v1.2.5

**Individuāls apjoms katram projektam — mērvienība, ikona, korekciju inputs**

- **`variableQuantity` uz `EstimateLineItem`** — karodziņš pārvietots no kataloga pozīcijas uz tāmes rindu (`item.variableQuantity`); `isVariableQuantityLineItem` pārbauda vispirms rindu, tad katalogu; klonējot no sagataves (`clone-sagatave-for-project.ts`) `variableQuantity` rindām `quantity = 0`; sinhronizācija no sagataves uz projektu pie lapas ielādes (`sync-variable-quantity.ts`)
- **Mērvienība no materiāla** — kad `variableQuantity = true`, saglabājot pozīciju modalī mērvienību ņem no pirmā piesaistītā materiāla (piem. "Kanalizācija d.110" → "m"); ja materiāla nav — `draft.unit` vai "gab."
- **Sagatave (`/estimate`)** — slēdzis **Individuāls apjoms katram projektam** katrā pozīciju modalī (`PositionVariableQuantityField`); ieslēdzot: notīra `moduleSizeAttachment`; `fa-random` ikona rindā pie nosaukuma (`estimate-position-table`); moduļa apjoma brīdinājums slēpts, ja `variableQuantity`; mērvienība tabulā — `item.unit` nevis moduļa atvasinājums
- **Projekta tāme (`/[id]`)** — `fa-random` ikona (sarkanā) redzama **tikai** rindām ar `variableQuantity = true`; klikšķis uz ikonas noņem `variableQuantity`; ikona nobīdīta 5 px uz leju; `variableQuantity` rindām `EstimateQuantityInput` ar `emptyValue={0}`; sarkana rinda (`bg-red-50/60`) ja apjoms ≤ 0; **Saglabāt** bloķēts, ja kāda `variableQuantity` rinda bez apjoma; `displayUnit` ignorē `moduleSizeUnit` šādām rindām
- **Moduļa korekciju inputs** (`module-size-attach-item-row.tsx`) — lokāls `useState` (`inputValue`) nodrošina tūlītēju ievades atjauninājumu neatkarīgi no vecāka re-render; `useEffect` sinhronizē no `state.adjustment` tikai ārēju izmaiņu gadījumā
- **Modālis** — `app-modal.tsx` pievienots `overflow-x-hidden` panelim, lai novērstu horizontālo ritināšanu
- **Katalogs (`/positions`)** — `variableQuantity` toggle noņemts no pozīciju kataloga UI (pārvietots uz sagataves tāmes rindu līmeni)

### v1.2.4

**Moduļa lieluma picker — akordeons un auto-atvēršana**

- **Akordeons** — katras `ModuleCard` sadaļas galvene (`PAMATS`, `PAMATA IZGRIEZUMI` u.c.) ir klikšķināma: atvērt vienu sadaļu aizver pārējās; chevron ikona rāda stāvokli
- **Auto-atvēršana pie labošanas** — ja pozīcijai jau ir saglabāts `moduleSizeAttachment`, modāli atverot automātiski atveras tā sadaļa, kurā atrodas piesaistītais `itemKey` (`findSectionForItemKey`); sākotnēji visas sadaļas aizvērtas
- **Sync ar `useEffect`** — `isAttachedModule` vai `attachment.itemKey` mainoties (piemēram, atverot modāli ar saglabātu piesaisti), atveras pareizā sadaļa bez manuālas iejaukšanās
- **`key={draft.id}`** uz `ModuleSizeAttachPicker` `position-modal.tsx` — garantē pilnu remount un `useState` inicializāciju, kad modālī tiek atvērts cits elements

### v1.2.3

**Vairāki materiāli un mehānismi, multi kopsāvilkums, moduļa apjoma brīdinājums**

- **Vairāki materiāli un mehānismi** — `EstimateLineItem` tagad satur `materials: LineItemCatalogRef[]` un `mechanisms: LineItemCatalogRef[]` masīvus; vecais `material`/`mechanism` (singular) saglabāts backward compat kā deprecated; `hydrateCompositeLineItem` automātiski migrē vecos datus uz masīviem
- **Cenu summēšana** — `deriveCompositeUnitPrice` summē visu materiālu cenas un `Σ (kataloga likme × laika norma)` katram mehānismam
- **Position modālis** — katrai pozīcijai var pievienot neierobežotu skaitu materiālu un mehānismu; esošie rāda kā kartītes ar nosaukumu, mērvienību un × noņemšanas pogu; meklēšanas lauks apakšā pievieno nākamo (atiestatās ar `key` triku pēc izvēles)
- **Multi-pozīciju modālis** — tas pats multi-materiālu/mehānismu atjauninājums katrai opcijai (per-opcija `materialAddKey`/`mechanismAddKey`)
- **Multi opciju kopsāvilkums** — katras opcijas kartiņas apakšā `dl` ar Darbs / Materiāli / Mehānismi / Vienības cena (dinamiski atjauninās)
- **Moduļa apjoma brīdinājums** — pozīcijas rinda sarkanā tonī (`bg-red-50/60`) + `fa-exclamation-triangle` aiz nosaukuma + teksts **Nav pievienots moduļa apjoms** zem nosaukuma, ja `moduleSizeOptions.length > 0` un `!item.moduleSizeAttachment`
- **Tooltip** — Materiāli/Mehānismi šūnās tooltip rāda viena nosaukumu vai vairāku nosaukumus komatu atdalītus
- **Stale cenu indikators** — pārbaudīts pret masīvu (`resolveEffectiveMaterials`/`resolveEffectiveMechanisms`), nevis singular lauku

### v1.2.2

**Projektu arhīvs un stale brīdinājumu precizēšana**

- **Arhīvs** — poga `fa-archive` blakus **Jauns projekts** (`project-page-actions.tsx`); skats `/?archive=1` ar visiem projektiem
- **Statusa filtrs** — radio rinda pirms saraksta: **Visi**, **Aktīvie**, **Procesā** (`approved`), **Pabeigtie**, **Noraidītie** (`project-status-filter.tsx`, `filter-projects.ts`)
- **Repository** — `listAllProjects()` visiem statusiem; galvenais saraksts joprojām filtrē `active` + `approved`
- **Stale brīdinājumi** — `shouldShowStaleCatalogPriceWarnings()` tikai `active`; noraidītiem (un apstiprinātiem/pabeigtiem) bez sarkanās apmales, banera un **Atjaunot cenas**
- **Noņemts** — `add-project-button.tsx` (aizstāts ar `project-page-actions.tsx`)

### v1.2.1

**Kopēt vienmēr un pabeigts projekts**

- **Kopēt** — `fa-copy` redzama **vienmēr** (arī apstiprinātiem projektiem), lai var klonēt tāmi kā tā bija
- **Pabeigts** — jauna poga `fa-check-double` apstiprinātiem projektiem (`approved` → `completed`); pēc apstiprināšanas modālā projekts pazūd no `/` saraksta, bet paliek DB; atverams caur tiešu saiti `/{id}`
- **Kartes darbības** — Labot/Dzēst un Noraidīts tikai `active`; Apstiprināts tikai `active`; Pabeigts tikai `approved`
- **Statusa loģika** — `isProjectVisibleInList`: `active` + `approved`; `isProjectEstimateLocked`: `approved` + `completed`
- **Supabase** — `027_project_completed_status.sql` (paplašina `projects_status_check` ar `completed`)
- **UI** — `IconActionButton` variants `complete` (teal hover)

### v1.2.0

**Novecojušas cenas, tāmes apstiprināšana un projekta statuss**

- **Novecojušas kataloga cenas** — saglabātām projekta tāmēm (`meta.savedAt` vai legacy heuristika) salīdzina iesaldētās cenas ar katalogu; **sarkanās šūnas** materiālu/mehanismu vienības un apjoma kolonnās (`stale-catalog-price.ts`, `resolveStaleCatalogPriceHints`)
- **Projektu saraksts** — sarkanā kartes apmale + **Ir jauninājumi izcenojumos** (`listProjectIdsWithStaleCatalogPrices`); apstiprinātie projekti izlaisti
- **Projekta lapa** — baneris **Pieejami jauni izcenojumi**; **Atjaunot cenas** atjaunina cenas tabulā no kataloga bez DB saglabāšanas (**Saglabāt** paliek dirty, ja ir izmaiņas)
- **Apstiprināts** — `updateProjectStatusAction` → `approved`; tāme read-only (`estimateLocked`); zaļš statusa baneris; bez stale brīdinājumiem un **Atjaunot cenas**; backend bloķē `saveProjectEstimate` / datumu labošanu; kartē paslēpti Kopēt/Labot/Dzēst
- **Noraidīts** — `rejected`; pazūd no `/` saraksta (`isProjectVisibleInList`), ieraksts DB paliek; pēc apstiprināšanas `router.push("/")`
- **Supabase** — `026_project_status.sql` (`projects.status`, check constraint, index); `npm run db:migrate` obligāts pirms statusa pogām
- **Repository** — progresīvs `SELECT` fallback, ja trūkst `status` vai `project_description` kolonnas (līdz migrācijai / PostgREST schema reload)
- **UI** — `ConfirmModal` apstiprināšanai/noraidīšanai; piesaistītais moduļa lielums zem nosaukuma (`footer`); kājene **Kopā** ar `formatAmountDisplay` (bez `€`)

### v1.1.32

**Projekta kopēšana ar tāmi**

- **Kopēt** — jauna ikonu poga (`fa-copy`) projekta kartē (`project-card-actions.tsx`); atver **Jauns projekts** modāli ar tukšiem kontaktu laukiem un avota moduli iepriekš aizpildītu
- **Tāmes klons** — izveides laikā jaunā tāme tiek klonēta no avota projekta (`createProject` + `copyEstimateFromProjectId`), nevis no Sagataves; izmanto `cloneSagataveDocumentForProject` ar jauniem ID un `multiOptionLinks`
- **UI / API** — `ProjectFormModal` `copyFromProject`; `CreateProjectInput.copyEstimateFromProjectId`; `IconActionButton` variants `copy`

### v1.1.31

**Tāmes saglabāšana, eksports un ciparu formatēšana**

- **Saglabāt tāmi** — jauna poga zem tāmes tabulas projekta skatā (`/[id]`); saglabā `title`, `meta` un `categories` uz `estimates` tabulā; pirms saglabāšanas cenas tiek **iesaldētas** (`positionPriceId` nomainīts pret faktisko `unitPrice`) — kataloga izmaiņas neieetekmē jau saglabātās tāmes; dirty tracking ar `savedSnapshot` (serialized compare)
- **Saglabāts indikators** — blakus pogai rāda "Nesaglabātas izmaiņas" vai "Saglabāts: DD.MM.YY" (no `estimates.updated_at`); datums tiek ielādēts no DB pie lapas atvēršanas
- **Termiņa atpakaļskaitīšana** — zem "Tāmes termiņš" lauka rāda "X dienas līdz termiņam" / "Termiņš šodien" / "Termiņš beidzies pirms X d." (sarkans), tikai kad tāme saglabāta
- **PDF (piedāvājums)** un **Excel (tāme)** — pogas parādās kad tāme saglabāta un nav izmaiņu; PDF ģenerē `@react-pdf/renderer` (`/api/estimates/[id]/pdf`): A4, kategoriju sekcijas, `hiddenInOffer` apakšsadaļas kā viena kopsummas rinda, lapas numurs; Excel ģenerē `xlsx` (`/api/estimates/[id]/excel`): pilna cenu detaļa (V.cena + Kopā × Darbs/Materiāli/Mehānismi); abi maršruti autorizēti (`getCurrentUser`)
- **Ciparu formatēšana** — `addThousandSeparators()` helper `calculate-line.ts`; visi `formatAmount`, `formatAmountDisplay`, `formatMoney`, `formatMoneyDisplay`, `formatQuantityDisplay` tagad rāda atstarpi ik pēc 3 cipariem (piem. `1 234 567.89`); Cursor rule `number-formatting.mdc`
- **Bug fix** — `calculateEstimateTotals` tagad pareizi reizina ar daudzumu arī pozīcijām ar `moduleSizeAttachment` (iepriekš ignorēja `item.quantity`, ja `position.variableQuantity` nebija `true`)
- **Sagatavotājs** — lauks noņemts no tāmes galvenes
- **Jauni faili** — `app/lib/exports/estimate-pdf.tsx`, `app/lib/exports/estimate-excel.ts`, `app/api/estimates/[projectId]/pdf/route.ts`, `app/api/estimates/[projectId]/excel/route.ts`
- **Jaunas atkarības** — `@react-pdf/renderer`, `xlsx`; `next.config.ts` → `serverExternalPackages`

### v1.1.30

**Kompozīts pozīciju modelis — laika norma, Darbs, multi-pozīciju aprēķini**

- **Jaunais kompozīts modelis** — `composite-line-item.ts`: `isCompositeLineItem`, `deriveCompositeUnitPrice`, `hydrateCompositeLineItem`, `createCompositePosition`; pozīcijas var saturēt `laborTimeNorm`, `material` (kataloga atsauce), `mechanism` (kataloga atsauce)
- **Vienības cena — 6 kolonnas** — Laika norma · Darba samaksas likme · Darbs · Materiāls · Mehānismi · Kopā; `unit-price-columns.ts`, `EstimateUnitPriceCells` (`estimate-unit-price-cells.tsx`)
- **Apjoma cena — Darbietilpība (c/h)** — jaunā pirmā kolonna `= apjoms × laika norma` (`volume-price-columns.ts`, `estimate-volume-sum-cells.tsx`)
- **Laika norma — tiešā rediģēšana tabulā** — `LaborTimeNormInput` ar `−`/`+` pogām (0,01 solis); border un pogas redzamas tikai uz hover/fokusa; sagatavē gan parastajai, gan multi-pozīciju opcijām
- **Mērvienība no moduļa** — kompozītajām rindām mērvienību iegūst automātiski no `moduleSizeAttachment`; lauks noņemts no modāļiem
- **Multi-pozīcijas darba šūna** — labots: kompozītajām multi-opcijām `Darbs` vienmēr aprēķināts ar `deriveCompositeUnitPrice` (nevis no kataloga nosaukuma sakritības); tāpat labots `estimate-position-table` un `estimate-table`
- **Multi-pozīcijas nosaukums** — ja nav ievadīts, automātiski ņem no materiāla vai mehānisma nosaukuma
- **Tooltip uz šūnām** — Materiāls un Mehānismi šūnās tooltip parāda kataloga pozīcijas nosaukumu
- **Piesaistītā moduļa lieluma etiķete** — strukturēts inline teksts (sadaļa · apzīmējums · vērtība) zem pozīcijas nosaukuma
- **Nosaukuma austiski** — visas nosaukuma šūnas vienmēr kreisajā pusē (noņemta nosacītā labā izlīdzināšana)
- **Jaunie faili** — `composite-line-item.ts`, `unit-price-columns.ts`, `volume-price-columns.ts`, `estimate-unit-price-cells.tsx`, `labor-time-norm-input.tsx`, `position-modal.tsx`, `position-modal-context.tsx`, `catalog-hint-field.tsx`, `module-size-attach-picker.tsx`

### v1.1.29

**Pozicijas — materiāli/mehānismi, filtrs un cenas attēlojums**

- **`/positions`** — katalogā tikai **Materiāls** un **Mehānismi** (darba rindas slēptas; pievienot/labot tikai šos veidus); **Darbs** joprojām no **Uzstādījumi** stundas likmes tāmēs
- **Veida filtrs** — kompakts radio zem meklēšanas: **Visi** / **Materiāls** / **Mehānismi** (kopā ar meklēšanu)
- **Cena** — ja nav iedota, rāda `- EUR / gab.` (nevis `—`)
- **Lib / UI** — `CATALOG_POSITION_COST_TYPES`, `filterCatalogPositions`, `PositionCostTypeFilter`; `PositionCostTypeField` ar `catalogOnly`; `position-cost-type-filter.tsx`

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
