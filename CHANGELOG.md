# Changelog

All notable changes to **Estimate Builder** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

See [README.md](README.md) for the product overview and setup, and [DEVELOPER.md](DEVELOPER.md) for the full technical documentation.

## Unreleased

- (none)

## v1.3.115

**Eksports — aptuvens budžets rindas Kopā**

- Excel tāme un PDF piedāvājums rindās ar **Aptuvens budžets** rāda šo summu kolonnā **Kopā** (nevis aprēķināto cenu); sakrīt ar `calculateEstimateTotals` / `collectExportDisplayRows`

## v1.3.114

**Papildu darbu tāmes — ielādes overlay**

- **Atvērt** (un pēc izveides) rāda pilnekrāna loading animāciju, kamēr tiek ielādēta papildu darbu tāme (`NavigationLoadingProvider`, `additional_work.loading`, migrācija `157`)

## v1.3.113

**Navigācija, Termiņu grafika noņemšana, moduļu kompletums**

- Noņemts `module_timeline` / Termiņu grafiks (`/timeline`, `company_timeline_entries`, migrācija `154`); `module_timeline_graph` atjaunots DB pēc kļūdainās `153` (`155`)
- Sidebar: **Laika grafiks** virs Ēku moduļiem; **Tasks** apakšā virs Lietotāji; **Tāme** grupa (Sagatave / Pozīcijas / Neiekļautās) ar virsrakstu un atdalītājiem (`nav.group.estimate`, `156`)
- `module_data_complete` prasa arī dzīvojamo platību; sidebar brīdinājums nekompletiem moduļiem (`151`–`152`)
- Postinstall patch pret Next.js 16.2 Turbopack `require is not defined` (`scripts/patch-next-app-page-require.mjs`)

## v1.3.112

**Moduļu kopēšana un piezīme projekta selectā**

- Ēku moduļu kartē **Kopēt** — jauns modulis ar nosaukumu/piezīmi, nokopētiem vizualizāciju/PDF failiem, outline un projekta aprakstu (`copyBuildingModule`, migrācija `150`)
- Jauna projekta / labošanas **Modulis** selectā piezīme iekavās aiz nosaukuma (kā projektu kartēs)

## v1.3.111

**Laika grafiks — tiesības un režģa UX**

- `timeline_graph.manage` — prioritātes DnD tikai ar šo tiesību; skatītājs var tikai skatīt (migrācija `149`)
- Kalendāra dienu vertikālās līnijas, kategoriju/subkategoriju horizontālie atdalītāji un violets fons subkategoriju rindām

## v1.3.110

**Laika grafiks — darbietilpības plāns pēc prioritātes**

- Jauns modulis `module_timeline_graph` un lapa `/timeline-graph` (**Laika grafiks**): projekti pēc DnD prioritātes, joslas no tāmes darbietilpības (apjoms × laika norma), 1 d = 8 c/h; brīvdienas netiek ieskaitītas
- Kategorijas / subkategorijas un pašu projektu var sakļaut vienā rindā; neapstiprinātie projekti ar aptuvenu joslu; vecais `/timeline` pārdēvēts par **Termiņu grafiks**
- Migrācijas `141`–`148` (modulis, `company_timeline_graph_order`, tulkojumi)

## v1.3.109

**Security — brace-expansion overrides**

- `package.json` overrides `brace-expansion` uz labotajām same-major versijām (`1.1.18` / `2.1.4` / `5.0.9`); noņemts novecojis ACCEPTED ieraksts `audit-check.mjs`

## v1.3.108

**Papildu darbu tāmes dzēšana un sagataves multi izcelšana**

- Papildu darbu tāmju sarakstā blakus **Atvērt** — **Dzēst** ar apstiprinājuma modāli; rinda pazūd uzreiz (optimistiski), backend dzēš `estimates` ierakstu; migrācija `140`
- Sagatavē multi-pozīcijas un to apakšopcijas ar vieglu violetu fonu, lai vieglāk atšķirt no parastajām pozīcijām

## v1.3.107

**Lint — project card module variable**

- `project-card.tsx`: pārdēvēts lokālais `module` uz `buildingModule`, lai izvairītos no `@next/next/no-assign-module-variable` CI kļūdas

## v1.3.106

**Projektu saraksts — moduļa piezīme**

- Projektu kartē aiz moduļa nosaukuma iekavās rādās moduļa **Piezīme**, ja tā ir aizpildīta (piem. `Modulis (Spogulis)`)

## v1.3.105

**Papildu darbu tāme — sagataves hinti un PDF/Excel eksports**

- PositionModal nosaukumā **hinti no sagataves** — izvēloties aizpilda nosaukumu, materiālus, mehānismus, laika normu u.c. (sagatave un papildu tāme); `position-templates.ts`, `position-template-name-field.tsx`; migrācija `139`
- Papildu darbu tāmē pēc saglabāšanas pieejamas **PDF** un **Excel** pogas (`?estimateId=`); API maršruti atbalsta papildu tāmes eksportu
- Labošanas poga papildu/kompozītās pozīcijās pārvietota uz darbību kolonnu **pirms Dzēst**

## v1.3.104

**Papildu darbu tāme — manuāls apjoms, pozīciju modālis un tikai datums**

- Papildu darbu tāmē katrai pozīcijai **manuāli ievadāms apjoms** (objekta-specifisks; `variableQuantity`), kopsummas reizina ar daudzumu; helpers `additional-work-quantity.ts`
- **Pievienot / labot pozīciju** atver to pašu `PositionModal` kā sagatavē (nosaukums, materiāli, mehānismi, laika norma)
- Papildu tāmē ir tikai **datums** (bez derīguma termiņa); jaunām tāmēm termiņš netiek iestatīts, saglabājot esošās — notīrās; Excel termiņu rāda tikai ja aizpildīts
- Kategoriju un subkategoriju nosaukumos var rakstīt **ar atstarpēm** (`resolveEstimateGroupTitleInput` bez `trim` ievades laikā)

## v1.3.103

**Multi-pozīcijas labošanas poga darbību kolonnā**

- Multi-pozīcijas **Labot** (pildspalva) pārvietota no nosaukuma blakus uz labo darbību kolonnu **pirms Dzēst** — tāpat kā parastajām pozīcijām (sagatave un piedāvājums)

## v1.3.102

**Sanmezgli, apjoma +/- / ×2 un neitrāli logu/durvju apzīmējumi**

- **Sanmezgli** — jauna sadaļa **Projekta aprakstā** (nosaukums, garums, platums); perimetrs, sienu m² (no stāvu augstuma) un grīdas m² pieejami kā apjomi sagatavē/tāmē; migrācija `135`
- **Apjomu kombinēšana ar zīmi** — pie papildu piesaistītā apjoma pirms slēdža zaļš **+** / sarkans **−**; kopsumma ir summa vai starpība (`itemSigns` uz `moduleSizeAttachment`)
- **×2** — kompakta poga pie ieslēgta apjoma (piem. starpsienu garums abām pusēm); blāva, kad neaktīva; migrācija `136`
- **Durvis / Logi pie apjomiem** — rāda **Durvis 1**, **Logi 1** utt., nevis moduļa marku/nosaukumu; logiem slēdzis **Vitrīna** (īpašas stikla durvis ar citu izcenojumu); migrācijas `137`, `138`

## v1.3.101

**Moduļa lielumi: dzīvojamā platība, ailu perimetrs un skaidrāka izvēle**

- **Dzīvojamā platība (m²)** — jauna ievade moduļa un individuāla projekta **Projekta apraksta** sadaļā **Pamats** (`livingAreaM2`); pieejama arī kā apjoms tāmes pozīcijai (`foundation.living-area`) ar +/- korekciju; migrācija `132`
- **Kopējais perimetrs katram logu un durvju veidam** — aprēķināts kā `2 × (augstums + platums) × skaits` (`openingPerimeterM`) un pievienots definēto apjomu sarakstam sadaļās **Logi** un **Durvis**; migrācija `133`
- **Apjoms no moduļa lieluma** — kategorijas vairs neaizveras, atverot nākamo, tāpēc apjomus var atzīmēt no vairākām sadaļām pēc kārtas; sadaļas ar atzīmētiem apjomiem atveras automātiski
- **Sagatavē noņemts moduļa nosaukums** un tā vietā redzama piezīme, ka skaitļi ir tikai piemērs no viena moduļa, bet tāmē apjoms tiks rēķināts no attiecīgā projekta moduļa (`BuildingModuleSizeOption.exampleOnly`); vecās piesaistes atpazīst pēc lieluma atslēgas, nevis pēc `moduleId`; migrācija `134`

## v1.3.100

**Aptuvenais budžets kopsummas kolonnā**

- **Aptuvens budžets** vairs nav ievade zem pozīcijas nosaukuma — tas ir attiecīgās tabulas **Kopā** šūnā: projekta tāmē **Apjoma cena → Kopā**, sagatavē **Vienības cena → Kopā** (jauns `cell` variants `estimate-attention-budget-control.tsx`, sarkans lauks ar tooltip)
- Budžets **aizstāj** rindas aprēķināto cenu un tiek ieskaitīts subkategorijas, kategorijas un tāmes kopsummā; sadalījums **Darbs / Materiāli / Mehānismi** paliek tukšs, jo budžetam nav komponentu (`splitRowsForTotals` — `multi-position.ts`)
- `EstimateTotals` un `SectionVolumeTotals` ieguva lauku `attentionBudget`; `calculateEstimateTotals` `grand` un `calculateRowsVolumeTotals` tagad rēķina budžetus atsevišķi no cenām, tāpēc arī PDF/Excel galasummas sakrīt ar ekrānā redzamo
- Multi-pozīcijām priekšroka ir pašas multi budžetam; ja tā nav, tiek ņemts izvēlētās opcijas budžets (`resolveAttentionBudgetAmount`)

## v1.3.99

**Sticky kategoriju un subkategoriju rindas sagatavē**

- Sagataves tāmē (`/estimate`) kategorijas un subkategorijas rinda paliek piespraustas zem tabulas galvenes, kamēr ritina to saturu, un tiek nomainītas, tiklīdz sākas nākamā grupa; subkategorija izslīd augšup arī tad, ja pēc tās seko kategorijas tiešās pozīcijas
- Jauns `app/lib/estimates/sticky-group-rows.ts` pārrēķina rindu `top` vērtības; `EstimateTableStickyShell` izsauc to tajā pašā scroll/resize ciklā, kas piesprauž kolonnu galveni
- Tabulas karte pārgāja no `overflow-hidden` uz `overflow-clip` — `hidden` veidoja ritināšanas konteineru un atslēdza `position: sticky`

## v1.3.98

**Dokumentācija sadalīta trīs failos**

- **`README.md`** pārtaisīts par īsu komerciālu pārskatu (134 rindas): ko produkts dara, lietotājam redzamās funkcijas, uzstādīšana (env, Supabase, Vercel), tehnoloģijas un saites uz pārējiem dokumentiem
- **`DEVELOPER.md`** (jauns) — pilnā tehniskā dokumentācija: visas funkcionalitātes sadaļas, projekta struktūra, DB shēma, CI/drošības pārbaudes, versionēšanas process, Cursor rules un roadmap
- **`CHANGELOG.md`** ievadā saite arī uz `DEVELOPER.md`
- Cursor rules atjaunināti: `readme-version-update.mdc` apraksta trīs failu sadalījumu un prasa `CHANGELOG.md` ierakstu + `DEVELOPER.md` sinhronizāciju; `github-version-commit.mdc` norāda uz `DEVELOPER.md` un iekļauj to release commit failos

## v1.3.97

**Atkarību drošības labojumi**

- **`next` un `eslint-config-next` → 16.2.12** — novērstas 9 Next.js HIGH ievainojamības (middleware bypass, SSRF rewrites/Server Actions, cache confusion, Image Optimization DoS, Server Function endpoint atklāšana)
- Jauni `overrides`: **`postcss` `^8.5.18`** (path traversal sourceMappingURL), **`sharp` `^0.35.0`** (libvips CVE-2026-33327/33328/35590/35591), **`js-yaml` `^4.3.0`** (merge-key CPU DoS)
- **`npm run audit:check`** (`scripts/audit-check.mjs`) aizstāj inline audita loģiku `security-audit.yml` — krīt pie katra HIGH/CRITICAL advisory, izņemot skaidri pieņemtos ar iemeslu un noņemšanas nosacījumu
- `brace-expansion` (GHSA-mh99-v99m-4gvg) pieņemts kā nelabojams — advisory atzīmē visas versijas `<= 5.0.7`, tāpēc `minimatch` 3.x/5.x patērētājiem nav nebreaking upgrade; pamatojums `security-check.md`

## v1.3.96

**Individuāls apjoms multi-pozīcijām; dokumentācijas sadalīšana**

- **Multi-pozīcijai globāls individuālais apjoms** — slēdzis **Individuāls apjoms katram projektam** multi-pozīcijas modālī attiecas uz **visām opcijām**; projekta tāmē apjoms tiek ievadīts vienu reizi visai multi-pozīcijai un saglabājas, mainot izvēlēto opciju (`multi-position-modal.tsx`, `estimate-multi-position-row.tsx`, `variable-quantity.ts`)
- Ieslēdzot individuālo apjomu, tiek notīrīta moduļa lieluma piesaiste un paslēpta **Apjoms no moduļa lieluma (vienots)** sadaļa — tāpat kā parastajām pozīcijām; sarkanā `fa-random` ikona redzama sagataves un projekta rindā
- **Labojums:** saglabāšanas validācija prasīja apjomu arī neizvēlētajām multi opcijām, kas neatgriezeniski bloķēja tāmes saglabāšanu; tagad tiek pārbaudītas tikai rindas, kas ietekmē kopsummas
- **Labojums:** multi-pozīcijas labošana projektā pārrakstīja ievadīto apjomu un mērvienību ar noklusējuma vērtībām
- **Labojums:** `syncLineItemQuantityFromModuleSize` vairs nepārraksta manuāli ievadīto apjomu rindām ar individuālo apjomu
- **Dokumentācija sadalīta** — visas versiju izmaiņas pārceltas uz jaunu **`CHANGELOG.md`** ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/) formāts); `README.md` tagad satur tikai funkcionalitātes, uzstādīšanas un struktūras aprakstu

## v1.3.95

**Papildu darbu tāmes**

- Frontend modulis **`module_additional_work`** — ieslēdzams `/site_frontend_modules`; zem līguma tāmes sadaļa **Papildu darbu tāmes** ar izveides pogu un sarakstu
- Vairākas papildu tāmes uz projektu — `estimates.estimate_kind` (`main` | `additional_work`), redaktors `/[id]/additional-work/[estimateId]`; tukša tabula no nulles, atsevišķa saglabāšana bez sagataves sinhronizācijas
- Migrācijas `129`–`131`; `app/lib/additional-work-estimates/repository.ts`, `project-additional-work-section.tsx`

## v1.3.94

**Sagataves sinhronizācija, materiālu patēriņš, projekta tāme**

- **Materiālu patēriņa UX** — pozīciju modālī patēriņa input paliek redzams; slēdži (**Cits apjoms**, **Patēriņš**) atsevišķā rindā; apjoma modālis tikai pēc **Izvēlēt apjomu** (`material-consumption-basis-control.tsx`, `material-consumption-input.tsx`)
- **Projekta tāme — materiālu tooltip** — vienības cenas **Materiāli** / **Mehānismi** šūnās katrs kataloga nosaukums savā rindā (`estimate-unit-price-cells.tsx`)
- **Sagataves → projekts** — multi pārošana pēc nosaukuma un kārtas; **vienā pret vienu** sasaiste; jaunas rindas ievietotas `childOrder` secībā (`category-child-order.ts`, `sagatave-has-new-positions.ts`, `project-structure-to-sagatave.ts`); kompozītpozīciju displeja nosaukumi sinhronizācijā (`sagatave-row-matching.ts`)
- **Lieki multi dublikāti** — kļūdaini sinhronizētas paslēptās rindas (piem. otrais „95mm”, ja sagatavē ir viens) lapas ielādē pilnībā izdzēstas no projekta, arī pēc **Sapratu** (`pruneOrphanedHiddenSagataveSyncRows`)
- `.gitignore` — `/estimate-builder/`, `*.code-workspace` (nejauša iekšējā repo kopija)

## v1.3.89

**Sagatave — pozīcijas darbību kolonna**

- Paplašināta darbību kolonna līdz `12rem`, lai ietilptu visas pogas (īpaša uzmanība, acs, bookmark, labot, dzēst); `EstimatePositionTableColgroup` un kopīgs `estimateLineItemActionsInnerClassName`

## v1.3.88

**Kataloga hinti — tīkla kļūda**

- Labots `useCatalogPositionsWithRefresh` runtime `Failed to fetch`, kad cilnes atgriešanās vai dev pārlāde īslaicīgi pārtrauc `GET /api/catalog-positions/hints` — tīkla kļūda klusi saglabā esošo katalogu

## v1.3.87

**Pozīcijas — rādīt tikai gala summu (bookmark)**

- Sagatavē un projekta tāmē pozīciju/multi rindā **bookmark** poga (`far` / `fas fa-bookmark`) — **Rādīt tikai gala summu**; web tabulā sadalījuma kolonnas blāvas, **Kopā** izteikta; PDF piedāvājumā un Excel tāmē paslēptas vienības/apjoma cenu detaļas (`showOnlyTotalPrice`, `line-item-export-visibility.ts`)
- Sagataves sinhronizācija — lauks **Rādīt tikai gala summu** pieejams **Pielāgot no sagataves** modālī; migrācijas `127`–`128`

## v1.3.86

**Dokumentācija — sagataves dzēšana un projektu tāmes**

- README precizēts: sagataves rindas dzēšana neietekmē esošo (arī apstiprināto) projektu tāmes; sinhronizācija tikai pievieno jaunu struktūru vai piedāvā lauku atjauninājumus `active` projektiem

## v1.3.85

**Sagatave un projekta tāme — saglabāšanas regresija**

- Labots bugs, kur pēc **Saglabāt** pozīciju izcenojumi un citi dati pazuda: servera sinhronizācijas `useEffect` vairs netiek aktivizēts, kad `isDirty` kļūst `false` pirms `initialSections` / `initialCategories` atjaunināšanās (`estimate-position-table.tsx`, `estimate-table.tsx`)

## v1.3.84

**Sakļautas kategorijas — kopsavilkuma izlīdzinājums**

- Sakļautu kategoriju/subkategoriju kopsavilkums (piem. `5 apakškategorijas` / `38 pozīcijas`) tagad izlīdzināts ar labo malu, saglabājot tekstu pa kreisi (`estimate-collapsed-summary-display.tsx`)

## v1.3.83

**Kataloga hinti modāļos, sagataves nosaukumi un tāmes kājene**

- **Materiāli / mehānismi modāļos** — jauna pozīcija `/positions` parādās hintos bez lapas pārlādes: `GET /api/catalog-positions/hints`, `useCatalogPositionsWithRefresh` (modāļa atvēršana + cilnes `visibilitychange`), nekešots `listPositionPricesForHints`
- **Sagataves kategorijas/subkategorijas** — laboti pazudušie nosaukumi (`resolve-group-title.ts`, `normalizeEstimatePositionSection`); darbību zona vairs nesaspiež nosaukuma lauku (`estimate-section-actions-cell.tsx`)
- **Projekta tāmes kājene** — kopsummas ar `truncate` un tooltip kā kategoriju rindās (`FooterSumAmount` / `estimate-volume-sum-cells.tsx`)
- **Mehānismi modālī** — atjaunots **fiksēts daudzums** / **darbietilpība** slēdzis; `fixedQuantity` vairs netiek piespiedu ieslēgts ar `perPositionConsumption` (`mechanism-quantity-control.tsx`, `composite-line-item.ts`)

## v1.3.82

**Darāmo darbu saraksts — noklusējuma kategorijas galvene**

- `/tasks` default **Uzdevumi** kolonnā virsraksts un darbu skaits nobīdīts 5px pa labi, lai vizuāli saskaņotos ar uzdevumu kartītēm (`todo-board.tsx`)

## v1.3.81

**Sagataves struktūras sinhronizācija, neiekļautās pozīcijas un tāmes rindu UI**

- **Projekts → sagatave** — jaunas kategorijas / subkategorijas / pozīcijas automātiski nonāk sagatavē, saglabājot projekta tāmi (`project-structure-to-sagatave.ts`)
- **Citi active projekti** — trūkstošā sagataves struktūra pievienota **paslēpta**; dzeltenš iepazīšanās bloks ar sarakstu un **Sapratu** (`sagatave-to-other-projects.ts`, `meta.unacknowledgedSagataveStructureIds`); atvērtot projektu sinhronizē arī vecus ierakstus
- **Neiekļautās pozīcijas projektā** — **Pievienot pozīciju** globālajam sarakstam; pārējos projektos automātiski noņemta no piedāvājuma; drag-and-drop secība globāli; migrācija `125`
- **Tāmes kategoriju/subkategoriju rindas** — kopsavilkums sakļautā stāvoklī, summu tooltip, ikonu darbības labajā pusē, hover-grupa; migrācija `124`
- **Paslēptās sadaļas** — `hiddenInEstimate` arī kategorijām un subkategorijām (automātiskā sagataves sinhronizācija)
- **Build** — iepazīšanās bloka saraksta helpers atdalīts client-safe modulī (`sagatave-structure-intro-entries.ts`), lai `estimate-table` neimportētu servera kodu
- Migrācija `123` (projekta→sagatave tulkojumi), `126` (iepazīšanās bloka tulkojumi)

## v1.3.80

**Sidebar izkārtojums un sticky tāmes galvene**

- **Pilns satura platums** — noņemts `.page` `max-width: 1480px`; saturs aizpilda visu vietu aiz sidebar (arī sakļautā izvēlnē)
- **Kompaktāka atstarpe** — sidebar un satura atkāpe samazināta par 40% caur `--app-sidebar-padding`, `--app-sidebar-width-*` un `--app-content-inset-left` (`globals.css`)
- **Sticky galvene** — projekta tāmē un sagatavē fiksētā tabulas galvene uzreiz seko sidebar animācijai (`estimate-table-sticky-shell.tsx`, `SIDEBAR_LAYOUT_CHANGE_EVENT`, `data-app-main` padding novērošana)

## v1.3.79

**Projekta tāmes tabulas izkārtojums un galvenes**

- **Plašāks Nosaukums** — kolonnu platumi pārdalīti (~44%); Mērv., Daudz. un cenu apakškolonnas kompaktākas (`estimate-table-numeric-styles.ts`)
- **Galvenes** — garie apakšvirsraksti ar **…** un tooltip; īsāki tulkojumi (**Likme**, **Darbietilpība**, **Daudz.**); migrācijas `121`–`122`
- **Šūnu izlīdzinājums** — centrēts visur, izņemot Nosaukumu; sticky galvene caur `estimate-table-sticky-shell.tsx`
- **Neiekļautās pozīcijas** — secīga numerācija tikai redzamajām rindām

## v1.3.78

**Paslēptās tāmes rindas, neiekļautās pozīcijas un tabulas ritināšana**

- **Projekta tāme** — pozīciju/multi **Dzēst** paslēpj rindu (`hiddenInEstimate`); poga **Rādīt noņemtās (N)** ar pelēku/blāvu izcelti un **Atjaunot**; paslēptās ārpus kopsummām un eksporta; sagataves/kataloga sinhronizācija saglabāta
- **Multi-pozīcijas** — **Dzēst** pieejams arī projekta tāmes offer režīmā
- **Neiekļautās pozīcijas** — projekta blokā tāds pats **Rādīt/Paslēpt noņemtās** UX ar atjaunošanu piedāvājumā
- **Tabula** — pilns garums bez iekšējā scroll; sticky kolonnu galvene lapas ritināšanā (projekts un sagatave)
- Migrācijas `119`–`120` (tulkojumi)

## v1.3.77

**Lint labojumi**

- Noņemti neizmantotie importi un mirušais `applyRowField` helpers (`estimate-table`, `sagatave-position-changes`, `category-child-order`)
- PDF eksportā `prefer-const` labojums (`estimate-pdf.tsx`)

## v1.3.76

**Īpaša uzmanība, multi mērvienība un sagataves uzlabojumi**

- **Īpaša uzmanība** — slēdzis sagatavē un pozīciju/multi modāļos (`requiresAttention`); projekta tabulā **Aptuvens budžets**; sinhronizācija no sagataves; migrācijas `117`–`118`
- **Kategoriju secība** — subkategorijas un pozīcijas vienā līmenī (`childOrder`); drag-and-drop starp tipiem; PDF/Excel eksports sinhronizēts
- **Multi manuālā mērvienība** — kopīga modālī kā parastajām pozīcijām; bez moduļa apjoma — materiālu/mehānismu patēriņa lauki, kad mērvienības nesakrīt
- **Pozīcijas nosaukums** — bez ievadīta nosaukuma tabulā rāda pirmā materiāla vai mehānisma nosaukumu (`resolveLineItemDisplayName`)

## v1.3.75

**Multi-pozīcijas un moduļa apjoma piesaiste**

- **Multi piezīmes** — globāla **Piezīme** pie multi nosaukuma un atsevišķa katrai opcijai modālī (līdz 255 zīmēm); redzama tāmes tabulā; sagataves sinhronizācija ar lauku `multiNote` (migrācija `116`)
- **Moduļa apjoma izvēle** — sadaļu akordeons vairs neaizveras uzreiz pēc atvēršanas (`module-size-attach-picker.tsx`)
- **Skaits (gab.)** — logu, durvju un jumta skaita lauki piesaistes sarakstā un zem pozīcijas rāda **gab.** kā moduļa projekta aprakstā (`format-module-size-summary.ts`)

## v1.3.74

**Moduļu vizualizācijas**

- **Attēlu ielāde** — moduļu vizualizāciju sīktēli vairs nepaliek spinnerī līdz pelės hover; noņemts `loading="lazy"`, kešatmiņas `complete` pārbaude un `hover:opacity` tikai pēc ielādes (`module-visualization-image.tsx`)

## v1.3.73

**Sagataves izmaiņu sinhronizācija un tāmes labojumi**

- **Pielāgot no sagataves** — zils baneris un modālis ar checkbox katram laukam (mērvienība, nosaukums, laika norma, materiāli u.c.); pilna rindas sinhronizācija no sagataves (`sagatave-position-changes.ts`, `sync-sagatave-changes-modal.tsx`); baneris pazūd, kad atšķirību vairs nav
- **Rindu pāraošana** — `sagatave-row-matching.ts` (indekss, kataloga saite, nosaukums), lai pārsauktas pozīcijas netiktu pievienotas kā jaunas
- **Projektu saraksts** — debesszila apmale un hints, kad sagatavē mainītas esošās pozīcijas (`sagatavePositionChangeProjectIds`)
- **Manuālā mērvienība** — projekta tabulā un multi rindās tāda pati efektīvā mērvienība kā sagatavē (`resolveEstimateRowDisplayUnit`)
- **Plānotā peļņa** — mainot %, aktivizējas **Saglabāt tāmi** un nesaglabāto izmaiņu indikators
- **Eksporta hints** — īsāks teksts zem PDF/Excel pogām; migrācija `113`

## v1.3.72

**Moduļi un moduļa lielumu piesaiste**

- **Projekta apraksts** — sadaļa **Ūdensapgāde** ar aukstā/karstā ūdens un recirkulācijas garumiem (m); migrācija `114`
- **Moduļa lielumu piesaiste** — vienā pozīcijā var ieslēgt vairākus slēdžus (piem. aukstais + karstais ūdens); apjoms summējas, ja vienāda mērvienība; `itemKeys` JSON
- **Piesaistes rindiņa** — apgrieztam moduļa apjoma tekstam tabulā `TruncatedText` tooltip ar pilno saturu

## v1.3.71

**Projekti, tāme un sagatave**

- **Projektu dzēšana** — `project.delete` tiesība grupās; uzņēmuma **Administrators** / **Īpašnieks** var dzēst arī bez grupas atļaujas; `DELETE /api/projects/[projectId]`; migrācija `111`
- **Arhīvs** — projektus var dzēst arī arhīvā (`approved` / `rejected` / `completed`), ne tikai `active`
- **Apjoma cena** — laboti apakškolonnu virsraksti: **Darbietilpība (c/h)** · Darbs · Materiāls · Mehānismi · Kopā
- **Plānotā peļņa** — dzeltens brīdinājums pirms tabulas un teksts zem PDF/Excel, kad nav norādīta vai ir 0%; migrācija `112`
- **Sagatave / pozīciju modāļi** — `TruncatedText` tooltip apgrieztam materiāla vai mehānisma nosaukumam

## v1.3.70

**Ātrāka sagatave, pozīcijas un mehānismu cenas modālī**

- **Sagatave `/estimate`** — ātrāka **Saglabāt**: viegls katalogs (`listPositionPricesForHydration`), moduļu apjomi tikai kad vajag, kataloga indekss hidratācijai, fona sync/revalidate ar `after()`, serveris atgriež hidratētās `sections` bez `router.refresh()`
- **Saglabāt poga** — skaidrs `isSaving` stāvoklis; teksts uzreiz atgriežas no **Saglabā…** uz **Saglabāt** pēc veiksmīgas atbildes
- **Mehānismi modālī** — **Uz pozīciju** vienības cena kā materiāliem (`MechanismBasisControl`, `resolveMechanismUnitPriceContribution`)
- **Pozīcijas `/positions`** — optimistiska jaunas pozīcijas pievienošana tabulā bez pilnas lapas gaidīšanas
- **Kataloga sync** — paralēli atjauninājumi, izlaiž nemainītos; sinhronizē arī kompozītu materiālus/mehānismus (`batchUpdatePositionNamesAndUnits`)

## v1.3.69

**Materiālu manuālais patēriņš**

- Slēdzis **Patēriņš** (`manualConsumption`) — patēriņa ievade arī tad, ja materiāla m.v. sakrīt ar pozīcijas m.v. (piem. 2× siets uz m²)
- Ieslēdzot **Patēriņš**, **Cits apjoms** slēdzis pazūd; abas opcijas savstarpēji izslēdzamas
- Migrācija `110` — tulkojums `estimate.material_consumption.manual`

## v1.3.68

**Lint**

- Laboti ESLint brīdinājumi un `@next/next/no-assign-module-variable` kļūda, lai CI `npm run lint` izietu tīri

## v1.3.67

**Pozīciju modāļi, materiālu cenas un meklēšana**

- **Materiālu/mehānismu kārtošana** — drag-and-drop secība pozīcijas un multi modāļos (`line-item-catalog-ref-sortable-list.tsx`); migrācija `108`
- **Materiāla cena modālī** — **Uz pozīciju** vienības cena katram materiālam; moduļa apjoma koeficients arī bez „Cits apjoms”; live atjaunināšana pievienojot materiālu; migrācija `109`
- **Kataloga meklēšana** — hinti un `/positions` bez diakritikas (`normalizePositionSearchText` in `filter-positions.ts`)
- **Sagatave** — labota saglabāšanas plūsma un cenu aprēķins ar `moduleSizeOptions` (`estimate/actions.ts`, `estimate-position-table.tsx`)

## v1.3.66

**Materiālu patēriņš, mehānismu daudzums un pozīciju modāļu UX**

- **Cits apjoms** — katram materiālam var piesaistīt citu moduļa lielumu (`consumptionVolumeAttachment`; piem. siets uz m², armatūra uz perimetru m); aprēķins `material-consumption-basis.ts` + `aggregate-project-materials.ts`
- **Patēriņa UI** — `MaterialConsumptionBasisControl` + apjoma izvēles modālis (`material-consumption-volume-modal.tsx`); slēdzis un patēriņa ievade apakšējā rindā; migrācijas `106`–`107`
- **Mehānismi** — `MechanismQuantityControl` ar slēdzi **fiksēts daudzums** (neizmanto laika normu); migrācija `104`
- **Manuālā mērvienība** — slēdzis **Cita mērvienība** brīvai ievadei (`105`); `normalizeEstimateUnit` — m³/m3 u.c. ekvivalences
- **Patēriņa ievade** — līdz 5 cipariem aiz komata, rāda tikai ievadītos decimālus (bez obligātās `,00`); vienots `,` displejs (`formatDecimalDisplay`)
- **Ligzdoti modāļi** — `modal-stack-context.tsx` + `AppModal` slāņi; novērš „Izbeigt darbību?” klikšķot patēriņa apjoma modālī
- **Citi** — kataloga hinti izslēdz jau pievienotos materiālus/mehānismus; pozīciju nosaukumu dabiskā kārtošana; ātrāka laika normu sinhronizācija saglabāšanā

## v1.3.65

**Multi-position add flow**

- `+ Multi` in the sagatave and estimate tables now opens the full multi-position editor before inserting the row, so newly added multi-positions can be completed immediately

## v1.3.64

**CI Node engine alignment**

- GitHub Actions now run `npm ci` on Node `22.13.0`, matching `pdfjs-dist@6` engine requirements
- `package.json`, `package-lock.json`, and README now declare Node `22.13.0+` as the supported runtime

## v1.3.63

**Performance and security recheck**

- Normalized delegated-material lookups through `project_material_assignments`, reducing global assigned-materials banner reads while keeping RLS deny for browser clients
- Tightened export and media paths with rate-limited module assets, sanitized PDF/Excel filenames, bounded PDF image fetching, and browser-native downloads/image caching
- Added the v1.3.63 security recheck to `security-check.md` and kept `typecheck`, `lint`, `build`, `db:migrate`, and `npm audit` green

## v1.3.62

**Workers/tools documentation sync**

- README now reflects the completed worker photo upload, worker tools modal, tool assignment, assignment history, and module-flag behavior across Features, schema notes, and project structure
- `package.json` version bumped for the release documentation pass

## v1.3.61

**Tools respects workers module flag**

- `/tools` now hides the worker column, worker assignment action, and tool history action when `module_workers` is disabled
- The tools page skips loading workers when the workers module is off, keeping the module boundaries consistent

## v1.3.60

**Worker assigned tools modal**

- `/workers` now shows a `fa-tools` row action when `module_tools` is enabled, opening a compact table of tools assigned to that worker
- Worker tools UI reuses the tools catalog data on the server and adds seeded translations in migration `102`

## v1.3.59

**Worker photo and tool assignment UX**

- Worker photo uploads now support the 5 MB Server Action/storage limit, show a blocking upload modal, and route upload feedback through toast notifications
- `/tools` adds fast worker assignment from the row action, optimistic live table updates, compact assignment history, and storage-backed history migrations `100`–`101`
- Tool create/edit and shared modal footers were tightened: create hides deferred assignment fields, price display is cleaner, avatars are rounded-square, and loading buttons keep stable widths

## v1.3.58

**Workers, tools, and timeline modules**

- Added company-user frontend modules `module_workers`, `module_tools`, and `module_timeline` with nav gating, permissions, seeded translations, and migrations `091`–`096`
- Added `/workers` with worker CRUD, phone details, and private drag-and-drop photo uploads served through `/api/workers/photo`
- Added `/tools` inventory with purchase/amortization prices and worker assignment, plus `/timeline` for approved-project schedule bars

## v1.3.57

**Lint and CI**

- ESLint rules aligned with intentional patterns (modal prop sync, dynamic images, PDF counters); `npm run lint` exits with zero warnings
- Removed dead imports and unused bootstrap company helper; small `useMemo` / `prefer-const` fixes

## v1.3.56

**Frontend module flags**

- System admin **Frontend moduļi** at `/site_frontend_modules` — define `module_key` values with on/off toggles (live UI, no full page reload)
- `module_todo_list` gates company-user `/tasks` sidebar link and route access when disabled (`assertNavAccess`, layout nav filter)
- Migrations `087`–`090` (`site_frontend_modules`, translations, `module_todo_list` seed)

## v1.3.55

**Todo description line breaks**

- `/tasks` and system-admin `/todo` cards now preserve textarea line breaks in task descriptions (`whitespace-pre-wrap`)

## v1.3.54

**Estimate position notes, table UX, and tooltip safety**

- Added optional **Piezīme** on estimate line items (position modal, up to 255 chars) — shown under the name in web tables; seeded `086` translations
- New category / subcategory rows auto-focus the title input for immediate typing
- Drag handles align to the top of tall rows (notes, warnings, module-size labels)
- `Tooltip` measures itself and clamps position inside the viewport so labels no longer clip off-screen
- Collapsed sidebar nav tooltips anchor from the icon’s left edge and extend to the right
- `/tasks` category and task titles show a tooltip with the full name only when truncated (`truncated-text.tsx`)

## v1.3.53

**Todo board and collapsed nav badges**

- `/tasks` categories can be reordered with drag-and-drop while the default **Uzdevumi** column stays fixed first
- Moved **Pievienot darbu** to a top-right **+** icon with a blue tooltip on each category header
- Collapsed sidebar count badges stay inside nav icons so numbers remain visible

## v1.3.52

**Todo server action guard**

- Added an explicit `getCurrentUser()` denial path to `/tasks` server actions before todo mutations, while keeping `assertNavAccess("todo")` permission checks

## v1.3.51

**Todo board layout polish**

- Tightened `/tasks` category and task spacing so columns fit without horizontal scrolling
- Removed task delete buttons in favor of the delete drop zone, with the trash icon aligned beside the zone label
- Hid category and task action icons until hover while keeping drag handles visible

## v1.3.50

**User todo board and delegated material tasks**

- Added `/tasks` for non-system-admin users with personal categories, task drag-and-drop, thick drop indicators, delete drop zone, and live feedback while creating or saving
- Scoped todo categories/tasks per user with default **Uzdevumi** category, legacy board recovery, navigation counts, and seeded `lv`/`en` translations
- Integrated material delegation so assigned material ordering creates an idempotent user todo task and removes it when the material is marked ordered

## v1.3.49

**Editable docs and sidebar counts**

- Added system-admin `/site_docs` management for public documentation categories and docs articles, including drag-and-drop article reorder and cross-category moves
- Reworked public `/docs` (`/wiki`) into a light documentation portal with fixed category sidebar, animated article lists, and article content view
- Added sidebar count badges, reordered system-admin navigation, and moved settings/user-management links to the bottom nav area above the language selector

## v1.3.48

**Sidebar persistence and Todo deletion**

- Persisted the manual sidebar collapsed state in `eb_sidebar_collapsed`, so refresh keeps the menu collapsed or expanded
- Prioritized the `/todo` delete drop zone in drag-and-drop collision detection so dragging a task into the delete block removes it reliably

## v1.3.47

**System admin Todo and public docs**

- Added a system-admin `/todo` board with two drag-and-drop columns, an add/edit task modal for title and description, and a top delete drop zone
- Added public `/docs` documentation (`/wiki` alias) and a login-card documentation link with seeded `lv`/`en` translations
- Seeded Todo and documentation UI translations through migrations `071`–`076`

## v1.3.46

**Translated export filenames**

- Added active-language export filename prefixes for PDF offers and Excel estimates via `exports.filename.offer` / `exports.filename.estimate`
- Seeded `lv` and `en` filename prefix translations in `070_seed_export_filename_translations.sql`

## v1.3.45

**Modal translations and currency display**

- Seeded missing `PositionModal` title/description/name placeholder translations and strengthened the Cursor i18n rule so new UI text must include `lv`/`en` DB seed migrations
- Replaced hardcoded hourly-rate `€` display with the active company currency in position and multi-position modals, including PDF/Excel export total headers

## v1.3.44

**System admin directory polish**

- Shows user avatars and company logos in `/site_companies_users`, including per-company logo loading for system admins
- Shows company logos in `/site_companies` and makes secondary company/user details more compact

## v1.3.43

**Sidebar polish**

- Shows the configured system name in the expanded sidebar header instead of a generic menu label
- Moves the language selector to a visible block above the user menu and opens its dropdown upward from the sidebar bottom area
- Improves collapsed sidebar affordances with square icon buttons and a visible ellipsis badge on the user avatar menu

## v1.3.42

**Sidebar navigation and user menu**

- Replaced the top navigation with a fixed left sidebar that can be manually collapsed to icon-only mode and expanded back to full labels
- Moved user actions into a sidebar user dropdown with a frontend-only user settings placeholder and sign-out action
- Seeded translations for the user menu and sidebar collapse/expand controls

## v1.3.41

**Position hourly rates, admin UX and page-load performance**

- Added per-position and per-multi-option custom hourly rates for composite labor calculations while keeping the company default hourly rate as the fallback
- Fixed the sagatave table action column overflow and formatted custom hourly rate inputs with two decimal places
- Improved system-admin UI: the top nav shows the system administrator label under the user name, `/site_companies_users` includes system admins without a company and displays each company user's actual group/role
- Reduced protected layout and project-list load work with cached site settings/languages, request-level repository deduping and a combined project badge scan
- Kept Font Awesome on the full CSS bundle after the solid-only import proved incompatible with the current icon setup

## v1.3.40

**Company name in top navigation**

- Shows the active company name under the signed-in user name in the top menu for non-system-admin users

## v1.3.39

**Opening marks in module descriptions**

- Added mark fields for module windows and doors, with examples like `L1` and `D2`
- Persisted opening marks in `project_description` and included them in module size summaries
- Seeded Latvian/English translation keys for opening mark labels

## v1.3.38

**Module notes and load optimizations**

- Added short module notes (up to 255 characters) in create/edit forms, shown under module names in the list and detail views
- Added lightweight module completion metadata so `/modules` no longer loads full visualization/project block JSON for every card
- Reduced initial render work by removing Auth Admin full-user scans from `listUsers()` and reusing project/settings data on project detail loads

## v1.3.37

**System admin access redirect**

- Redirected signed-in non-admin users from system admin pages back to `/` instead of showing a 404

## v1.3.36

**Protected navigation performance**

- Moved the assigned-materials banner out of blocking protected layout SSR and into a post-load `/api/assigned-materials` fetch
- Added request-level caching for server translations and system-admin checks to reduce duplicate Supabase calls during one render
- Kept the existing assigned-materials banner UX while preventing heavy project/estimate/catalog reads from delaying unrelated protected pages

## v1.3.35

**Language UX and translation caching**

- Added anonymous login language switching in the login card, backed by the `eb_language` cookie and the same DB translation dictionary used after sign-in
- Cached site translation dictionaries per language with `site-translations` tag invalidation on translation and language admin changes
- Removed the visible sagatave title field from the template editor header and filled remaining module/estimate/position i18n gaps, including module empty states and phone/roof/position labels

## v1.3.34

**Settings-backed login and i18n completion**

- Added a dedicated `/login` route and full-screen login card that uses the global system name and slogan from `site_settings`
- Removed hardcoded login marketing copy and cleaned obsolete login translation keys while keeping Google OAuth button/error text translatable
- Expanded remaining UI translation seed coverage across company pages, estimate/module/position flows and backend/action errors through the latest seed migrations

## v1.3.33

**System UI translations and rate-limit hardening**

- Seeded Latvian/English UI translation keys for navigation, system admin pages, language/translation forms, roles, statuses and permission labels via `043_seed_system_ui_translations.sql`
- Wired core navigation, language switching and permissions forms through the translation dictionary while keeping fallbacks for missing keys
- Added Upstash Redis REST support for distributed PDF/Excel export rate limiting, plus README/env/security-check documentation and CI smoke guard updates

## v1.3.32

**System admin settings, languages and translations**

- Added `is_admin`-only system admin navigation and pages for companies, company users, global settings, default user groups, languages and translations
- Added global `site_settings`, `site_user_groups`, `site_languages` and `site_translations` management, including top-bar language switching and app metadata from DB
- Added migrations `038`–`042` plus legacy group cleanup `039`, with editable default group permissions and translation CRUD/search

## v1.3.31

**Company-created user profiles**

- `/users/groups` now supports company-created profiles with create, rename, delete and permission editing for company-owned profiles only
- System default profiles are reduced to **Administrators** and **Skatītājs**; company admins can view them, while permission edits require `public.users.is_admin = true`
- `037_company_custom_user_groups.sql` converts legacy extra groups into company-owned profiles and `next.config.ts` sets `turbopack.root` explicitly to remove the multiple-lockfile workspace warning

## v1.3.30

**Company user access UX fixes**

- `/users` unauthorized access now redirects to the project list instead of showing a 404
- `036_company_user_manage_access_permission.sql` backfills `users.manage_company_access` into existing company/user group permission JSON so the checkbox and card actions appear consistently
- Root npm scripts now delegate into the nested `estimate-builder/` app directory, preventing dev-server restarts from serving an older parent workspace bundle

## v1.3.29

**Multi-company users and tenant scoping**

- **Multi-company foundation** — `034_users_system_admin.sql` and `035_multi_company_foundation.sql` add `public.users.is_admin`, `companies`, `company_users`, company groups/memberships, and `company_id` scoping for projects, estimates, settings, modules, catalogs, sagatave, excluded positions and price history
- **Company user management** — `/users` cards now support company access lock/unlock and remove/leave actions with `ConfirmModal`; new `users.manage_company_access` permission appears under group action permissions
- **Company-scoped assets and repositories** — logo and module/project files use `companies/{companyId}/...` storage paths, and server repositories/API routes enforce the active company context

## v1.3.28

**Navigation performance**

- **Protected layout** — global assigned-materials banner now loads in a separate `Suspense` slot, so page/menu transitions are no longer blocked by the banner's users, catalog, settings, project and estimate queries
- **Auth request cache** — `getCurrentUser()` and `getCurrentUserAccess()` use React request caching to avoid duplicate Supabase auth/access lookups during one server render
- **Assigned materials data** — `listUserAssignedMaterialGroups()` can reuse an already loaded catalog, avoiding an extra `listPositionPrices()` call from the layout banner path

## v1.3.27

**OAuth redirect allowlist match**

- **Google login** — `sign-in-with-google.ts` no longer appends `?next=/` for root login, so Supabase can match the exact allowed redirect URL (`/auth/callback`) instead of falling back to the Site URL
- **Localhost/Vercel OAuth** — root login now uses the same clean callback path on both origins; non-root return paths still use the safe `next` query

## v1.3.26

**Localhost OAuth and protected route fallback**

- **OAuth fallback** — `update-session.ts` redirects `/?code=...` to `/auth/callback?code=...`, so Supabase Site URL fallback still exchanges the code instead of leaving the app on the login page
- **Local dev auth** — `assertNavAccess()` returns full local permissions when Supabase is not configured in development, while production and configured Supabase still require real sessions
- **Protected pages** — all protected pages stop rendering child content when there is no session, letting `(protected)/layout.tsx` show the Google login gate instead of returning a 404

## v1.3.25

**Sagataves trūkstošās pozīcijas — modālis ar izvēli**

- Banera teksts **Sagatavē ir pozīcijas, kuras nav šajā tāmē** (projektu saraksts + projekta lapa)
- **Atjaunot pozīcijas** atver modāli ar trūkstošo pozīciju sarakstu pa kategorijām / subkategorijām un checkbox izvēli (`restore-sagatave-positions-modal.tsx`)
- **Pievienot izvēlētās** — pievieno tikai atzīmētās pozīcijas **tikai UI**; jaunās rindas **zaļā izcelšanā** līdz lapas pārlādei
- `listMissingSagatavePositions()` un selektīva `mergeNewSagatavePositionsIntoProject()` (`sagatave-has-new-positions.ts`)

## v1.3.24

**Sagatave — kategorijas līmeņa pozīciju cenu slēpšana piedāvājumā**

- **Acs poga** — pozīcijām tieši zem kategorijas (ne subkategorijas) darbību zonā: `fa-eye` / `fa-eye-slash` (`hiddenPriceInOffer` JSON); ieslēgts — dzeltens `eye-slash`, acs vienmēr redzama, labot/dzēst tikai hover (`line-item-price-visibility-toggle.tsx`, `estimate-position-table.tsx`)
- **PDF piedāvājums** — paslēptas cenas rinda ar nosaukumu un tukšu **Kopā €**; kategorijas kopsumma nemainās (`estimate-pdf.tsx`)
- **Sinhronizācija** — `hiddenPriceInOffer` no sagataves uz projekta PDF (`sync-subcategory-offer-visibility.ts`)

## v1.3.23

**Materiālu pasūtīšana — loading un globālais baneris**

- **Piešķiršana lietotājam** — materiāla rinda kļūst blāva ar spinneri; drag-and-drop bloķēts līdz saglabāšanai (`project-materials-delegation-panel.tsx`, `project-materials-table.tsx`)
- **Pasūtīts** — pogas vietā spinneris, kamēr `markProjectMaterialOrderedAction` notiek (`project-material-row-actions.tsx`)
- **Globālais materiālu baneris** — saistīto kontu atradīšana izmanto `listUsers` vārdu, ne tikai auth metadatus; `listUserAssignedMaterialGroups` atbalsta `allUsers` (`layout.tsx`, `list-user-assigned-materials.ts`)

## v1.3.22

**Laika norma, eksporti un PDF piedāvājums**

- **Laika norma projekta tāmē** — inline input tabulā ar live pārrēķinu (`patchLineItemLaborTimeNorm`, `LaborTimeNormInput`); kompozītpozīciju nosaukums atver modāli; multi — **Labot multi-pozīciju**; modāļos `−`/`+` stepper (0,01, centrēts skaitlis)
- **Laika normu sinhronizācija** — **Saglabāt tāmi** pārnese uz **Sagatavi** un citiem **`active`** projektiem (`labor-time-norm-sync.ts`); `approved` / `completed` netiek mainīti
- **PDF piedāvājums** — `hiddenPricesInOffer`: pozīciju rindas ar tukšām cenu šūnām, subkategoriju/kategoriju kopsummas saglabātas; karodziņu sinhronizācija no sagataves pēc nosaukuma (`sync-subcategory-offer-visibility.ts`)
- **Excel eksports** — kopsummas **Apjoma cena** kolonnās; datumi **DD.MM.YYYY** (`formatDisplayDateDdMmYyyy`)

## v1.3.21

**Navigācijas ielāde un UI labojumi**

- **Projektu / moduļu kartes** — klikšķis rāda pilnekrāna blur + loading modāli līdz lapai ielādējas (`navigation-loading-context.tsx`, `project-card.tsx`, `module-card.tsx`)
- **Izvēlne Projekti** — no projekta lapas (`/{id}`) saite atkal ved uz sarakstu; **Projekti** aktīvs tikai uz `/` (`app-nav.tsx`)
- **Plānotā peļņa** — meta rindā pirms **Datums**; `%` vairs nepārklājas ar datuma lauku (`estimate-table.tsx`)
- **Pozīcijas · Vēsture** — ielādes stāvoklī spinneris pirms **Ielādē vēsturi…** (`position-price-history-modal.tsx`)

## v1.3.20

**Plānotā peļņa un UX**

- **Plānotā peļņa** — projekta tāmē meta lauks ar **%**; palielina Darbs / Materiāli / Mehānismi vienības cenas un kopsummas (`planned-profit.ts`, `calculate-totals.ts`, `estimate-planned-profit-context.tsx`); glabājas `meta.plannedProfitPercent`; PDF un Excel eksportos iekļauts
- **Apstiprināta tāme** — **Plānotā peļņa** paliek redzama, bet neaktīva (`disabled`); rāda saglabāto vērtību objektam
- **Navigācija** — izvēlnes saites rāda spinneri un kļūst neklikšķināmas līdz lapas pārejai (`app-nav.tsx`)
- **Jauns projekts** — optimistiska izveide: karte parādās uzreiz ar blur + spinner, tad navigācija uz projektu (`projects-page-create-context.tsx`, `project-list.tsx`, `project-form-modal.tsx`); submit pogā **Izveido…** ar spinneri
- **Moduļu attēli / PDF** — loading spinner līdz ielādējās (`module-visualization-image.tsx`, `module-pdf-thumbnail.tsx`)

## v1.3.19

**Projektu kartes**

- **Nepasūtīti materiāli** — oranžais brīdinājums apstiprinātā projekta kartē stiepjas pa visu kartes platumu apakšā (`project-card.tsx`, `pending-project-materials-banner.tsx`)

## v1.3.18

**Apstiprinātas tāmes UI**

- **Tāmes termiņš** — apstiprinātā / pabeigtā projektā (`estimate-table.tsx`) paslēpts lauks **Tāmes termiņš** un atpakaļskaitīšana (**X dienas līdz termiņam** u.tml.); paliek tikai **Datums**
- **Materiālu delegācija** — kad visi materiāli pasūtīti, `project-materials-delegation-panel.tsx` vairs nerāda ne materiālu tabulu, ne **Lietotāji** bloku

## v1.3.17

**Vercel OAuth**

- **`sign-in-with-google.ts`** — OAuth callback uses `window.location.origin` in the browser (fixes login redirect to localhost when `NEXT_PUBLIC_SITE_URL` is wrong at build time)
- **README** — Vercel deployment and Supabase URL Configuration (Site URL + Redirect URLs vs Google provider callback)

## v1.3.16

**CI lint**

- **`estimate-table.tsx`** — `hasStaleCatalogPrices` useMemo (React Compiler `preserve-manual-memoization`)
- **`sagatave-has-new-positions.ts`** — `prefer-const` (`projectCategory`, `projectSubcategory`)

## v1.3.15

**UI tiesības, drošība 9.5, toast un npm**

- **UI ↔ tiesības (L23)** — `action-permissions-context.tsx`; `ActionPermissionsProvider` `(protected)/layout.tsx`; pogas slēptas pēc `permissions.actions`
- **M22** — jauni lietotāji bez membership → **Skatītājs** (`ensureUserDefaultMembership`); `/users` noklusējuma grupa Skatītājs
- **M23** — noņemts admin `slug` bypass; admin tiesības tikai `getUserAccess()` → `createFullPermissions(true)`; saglabāšanā admin grupai vienmēr pilns JSON
- **L24** — `getPositionPriceHistoryAction` → `requireAction("positions.manage")`
- **npm** — `package.json` `overrides.uuid` `^11.1.1`; `npm audit` 0 moderate+
- **Toast** — `FeedbackToastProvider` tikai `app/layout.tsx` (novērš Turbopack `useFeedbackToast` kļūdu materiālu banerī)
- **`security-check.md`** — atkārtota pārbaude **9.5 / 10**

## v1.3.14

**Lietotāju grupas — admin labojumi un dokumentācija**

- **Admin redzamība** — `groups-repository.ts`: membership bez join kļūdas; `033` repair migrācija
- **DB** — `033_repair_admin_group_memberships.sql`: atjauno admin `permissions` JSON; piešķir admin lietotājiem bez membership
- **README** — User groups sadaļa, shēma, struktūra; `security-check.md` M14 ✅

## v1.3.13

**Google Maps noņemts; adrese brīvā tekstā**

- **Projekta forma** — adrese parasts teksta lauks (`ProjectFormModal`); bez Places autocomplete un kartes priekšskatījuma
- **Tāmes galvene** — noņemts `AddressMapEmbed`; **2 kolonnas**: moduļa vizualizācijas · meta + darbības
- **Dzēsti** — `app/lib/google-maps/`, `/api/places/autocomplete`, `address-autocomplete-field.tsx`, `address-map-embed.tsx`, `@types/google.maps`
- **CSP** (`next.config.ts`) — noņemti Maps/Places domēni no `script-src`, `connect-src`, `frame-src`
- **UI/CSS** — `.pac-container` stili no `globals.css`; `AppModal` vairs neignorē `.pac-container` backdrop klikšķī
- **Env** — vairs nav nepieciešams `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_API_KEY` (`.env.example` atjaunināts)
- **Drošība** — `028_private_storage_buckets.sql` apstiprināts piemērots (`npm run db:migrate`); `security-check.md` atjaunināts (M17 noņemts)

## v1.3.12

**Lietotāju grupas un tiesības (M14)**

- **DB** — `032_user_groups.sql`: `user_groups`, `user_group_members`; RLS deny; 4 sistēmas grupas; esošie lietotāji → Administrators
- **`/users`** — grupas izvēle katram lietotājam (`user-group-select.tsx`); saite **Grupas un tiesības**
- **`/users/groups`** — matrica: navigācija + darbības (`user-groups-permissions-form.tsx`)
- **Eforcēšana** — `requireAction()` visos server actions; `assertNavAccess()` lapās; filtrēta `AppNav`; PDF/Excel ar `estimate.export`

## v1.3.11

**Materiālu delegācija un globālais baneris**

- **Projekta tāme** (`/{id}`) — materiālu tabula + **Lietotāji** bloks (2:1); drag-and-drop piešķir materiālu lietotājam; piešķirtais zem nosaukuma; `meta.materialAssigneeUserIds`; `assignProjectMaterialUserAction` / `assignProjectMaterialUser()`
- **Globālais baneris** — zem top izvēlnes ielogotajam lietotājam ar nepasūtītiem piešķirtajiem materiāliem (`list-user-assigned-materials.ts`, `assigned-materials-banner.tsx`); vairāki projekti — pārslēgšana; **sakļaujams** ar animāciju; stāvoklis cookie `eb_assigned_materials_banner_collapsed_{userId}`; atpazīst saistītos kontus pēc normalizēta vārda (`resolve-related-user-ids.ts`)
- **Moduļu vizualizācijas** — autentificēts attēlu ielāde projektos un `/modules/[id]` (`module-visualization-image.tsx`, `resolve-block-asset.ts`)
- **Toast** — `FeedbackToastProvider` arī `(protected)/layout.tsx` (novērš kļūdu materiālu tabulā)

## v1.3.10

**Materiālu pasūtīšanas plūsma un brīdinājumi**

- **Materiālu saraksts** — pārvietots **virs tāmes** tabulas (`estimate-table.tsx`)
- **Atjaunot cenu** — poga **vienmēr** redzama; pēc saglabāšanas **ConfirmModal** **Vai pasūtīji materiālu?** — apstiprinot, materiāls pazūd no saraksta
- **Brīdinājums** — **Visi materiāli vēl nav pasūtīti!** uz `approved` projekta kartes (izteikts oranžs bloks) un baneris projekta lapā ar **Atlikuši X no Y** (`listProjectIdsWithPendingMaterials`, `pending-project-materials.ts`, `pending-project-materials-banner.tsx`)
- **Darbības** — `markProjectMaterialOrderedAction`; `project-material-row-actions.tsx`

## v1.3.9

**Apstiprinātu projektu kartes, manuālā mērvienība sagatavē un toast labojums**

- **Projektu saraksts** — `approved` kartes visa virsma zaļā tonī (`approvedEstimateSurfaceClassName`); bez atsevišķas birkas sarakstā; tāmes skatā baneris paliek (`approved-estimate-status-label.tsx`)
- **Sagatave (`/estimate`)** — pozīciju modālī slēdzis **Manuāli norādīta mērvienība** + select (`manualUnitEnabled`, `manualUnit` JSON); mērvienību saraksts no tāmes (`collect-estimate-document-units.ts`); materiālu patēriņš, ja mērvienības nesakrīt
- **Toast** — `FeedbackToastProvider` tikai `app/layout.tsx`; konteksts `feedback-toast-context.ts` (novērš `useFeedbackToast must be used within FeedbackToastProvider` Turbopack)
- **Maršruts `/`** — atjaunots `app/(protected)/page.tsx` (projektu saraksts; novērš 404)

## v1.3.8

**Materiālu saraksts apstiprinātiem projektiem**

- **Projekta tāme** (`/{id}`) — jauna tabula **Materiālu saraksts** zem tāmes, tikai `approved` / `completed`; agregē materiālus no tāmes (kompozīts × patēriņš, multi — izvēlētā opcija)
- **Kolonnas** — Nosaukums, Mērv., Apjoms, Budžeta cena (iesaldēta), Budžets, Darbības
- **Pasūtīts** — materiāls pazūd no saraksta; glabājas `estimates.meta.orderedMaterialPositionIds` (bez jaunas migrācijas)
- **Atjaunot cenu** — redzama, ja kataloga cena ≠ budžeta cena; `UpdatePositionPriceModal` kā `/positions`; atjaunina `position_prices` un vēsturi
- **UI** — sarkanīga rinda un **Katalogā: …**, kad cenas atšķiras
- **Jaunie faili** — `aggregate-project-materials.ts`, `project-materials-table.tsx`, `project-material-row-actions.tsx`

## v1.3.7

**Neiekļautās pozīcijas — globālais saraksts un projekta pielāgojumi**

- **Nav** — jauns punkts **Neiekļautās pozīcijas** (`/excluded-positions`); CRUD, drag-and-drop secība
- **Projekta tāme** (`/{id}`) — bloks **zem tāmes tabulas** ar globālo sarakstu; **×** noņem pozīciju tikai no šī projekta piedāvājuma (`meta.excludedPositionIdsOmitted`); **Kopēt** projektu kopē arī noņemšanas sarakstu
- **PDF piedāvājums** — sadaļa **Piedāvājumā neiekļautās pozīcijas** (projekta efektīvais saraksts)
- **Supabase** — `031_excluded_positions.sql` (`excluded_positions`); obligāts `npm run db:migrate`
- **Jaunie faili** — `app/lib/excluded-positions/`, `app/(protected)/excluded-positions/`, `project-excluded-positions-panel.tsx`, `resolve-project-excluded-positions.ts`
- **Tooltip** — `align` (`center` / `start` / `end`) labajā malā esošām pogām

## v1.3.6

**Piedāvājuma derīgums PDF un uzstādījumos**

- **`/settings`** — sadaļā **Piedāvājums** jauns lauks **Piedāvājuma derīguma termiņš** (dienas, noklusējums 30); priekšskatījumā treknrakstā **Piedāvājums spēkā X dienas**
- **PDF piedāvājums** — pēc papildu informācijas rindām, pirms paraksta bloka, treknrakstā **Piedāvājums spēkā X dienas**
- **Supabase** — `030_company_settings_offer_validity_days.sql` (`company_settings.offer_validity_days`)

## v1.3.5

**Uzstādījumi — papildus informācija piedāvājumam**

- **`/settings`** — jauna sadaļa **Piedāvājums** ar textarea **Papildus informācija piedāvājumam**; katra rinda = atsevišķs komentārs; priekšskatījumā sadaļa **Piedāvājuma piezīmes**
- **PDF piedāvājums** — komentāri rādīti pēc kopsummas/PVN, pirms paraksta bloka
- **Supabase** — `029_company_settings_offer_additional_info.sql` (`company_settings.offer_additional_info`)
- **Jauns fails** — `app/lib/settings/offer-additional-info.ts` (`parseOfferAdditionalInfoLines`)

## v1.3.4

**Sagataves jaunas pozīcijas — brīdinājums un sinhronizācija**

- **Projektu saraksts** — dzeltena kartes apmale + **Sagatavē pievienotas jaunas pozīcijas** (`listProjectIdsWithNewSagatavePositions`); tikai `active`; izlaisti projekti ar `meta.clonedFromProjectId` (**Kopēt**)
- **Projekta lapa** — dzeltenš baneris ar pogu **Atjaunot pozicijas** labajā pusē; pievieno trūkstošo struktūru no sagataves **tikai UI** (`mergeNewSagatavePositionsIntoProject`)
- **Zaļa izcelšana** — jaunās kategorijas / subkategorijas / rindas zaļā tonī līdz lapas pārlādei vai atkārtotai ieeja projektā
- **Sagataves saglabāšana** — `revalidatePath("/")` pēc `/estimate` saglabāšanas, lai projektu saraksts atjaunojas
- **Jaunie faili / loģika** — `sagatave-has-new-positions.ts`; `EstimateMeta.clonedFromProjectId` pie **Kopēt** izveides

## v1.3.3

**Eksporta PVN sadalījums un piedāvājuma paraksts**

- **PVN sadalījums** — ja **Uzstādījumos** ir aizpildīts PVN numurs, PDF (piedāvājums) un Excel (tāme) apakšā rāda **Summa bez PVN**, **PVN 21%** un **KOPĀ AR PVN**; bez PVN numura paliek tikai **PAVISAM KOPĀ**
- **Piedāvājuma paraksts** — PDF apakšā kreisajā pusē: uzņēmuma nosaukums, info e-pasts, info tālrunis (tukši lauki netiek rādīti)
- **Jauns fails** — `app/lib/settings/vat-breakdown.ts` (kopīgs PVN aprēķins eksportiem)

## v1.3.2

**Piedāvājuma PDF — logo un kontaktu izkārtojums**

- **Logo** — vairs netiek izstiepts; `maxHeight` + `objectFit: contain` saglabā oriģinālās proporcijas
- **Projekta info** — tālrunis blakus e-pastam vienā rindā; numurs ar `formatDisplayPhone()` (`+371 987654321`); info bloks strukturēts pa rindām (projekts/pasūtītājs · adrese · e-pasts/tālrunis · datums/termiņš)

## v1.3.1

**Piedāvājuma PDF, sagataves subkategoriju redzamība un tāmes kopsummu labojums**

- **Piedāvājuma PDF** — jauns izkārtojums: rekvizīti (kreisā puse) + logo (labā), projekta dati (modulis, pasūtītājs, adrese, tālrunis, e-pasts), vizualizācijas 2 kolonnās, vienkāršota tabula (Nr. · Nosaukums · Kopā €); Roboto TTF latviešu burtiem (`public/fonts/`); attēlu ielāde serverī (`pdf-image-fetch.ts`)
- **Sagatave — subkategoriju cenu slēpšana** — `fa-stream` poga blakus acij; `hiddenPricesInOffer` JSON; PDF subkategorijai rāda kopsummu, ja ieslēgts `hiddenInOffer` vai `hiddenPricesInOffer`
- **PDF subkategoriju karodziņi no sagataves** — `sync-subcategory-offer-visibility.ts` pirms PDF ģenerēšanas sinhronizē `hiddenInOffer` / `hiddenPricesInOffer` no sagataves uz projekta tāmi (pēc indeksa / nosaukuma)
- **Eksporta pogas** — PDF un Excel lejupielāde ar `fetch` + loading spinner (`fa-circle-notch fa-spin`), bloķē dubultklikšķi; kļūda → `FeedbackToast`
- **Kopsummu labojums** — jauna kopīga `resolveEstimateLineItemPrices()` (`calculate-totals.ts`); Excel un PDF pozīciju rindas izmanto to pašu loģiku kā kategoriju kopsummas (kompozītas pozīcijas, `variableQuantity`, moduļa lielums)
- **Jaunie faili** — `subcategory-price-visibility-toggle.tsx`, `sync-subcategory-offer-visibility.ts`, `pdf-image-fetch.ts`, `public/fonts/Roboto-Regular.ttf`, `public/fonts/Roboto-Bold.ttf`

## v1.3.0

**Drošības un lint kļūdu labojumi — xlsx noņemts, ESLint konfigurācija**

- **`xlsx` noņemts** (`package.json`) — HIGH drošības ievainojamība (Prototype Pollution + ReDoS); Excel eksports jau izmanto `exceljs`; `xlsx` vairs nav nepieciešams
- **ESLint konfigurācija** (`eslint.config.mjs`) — `public/**` pievienots ignorē (PDF worker minifikāts fails); `react-hooks/set-state-in-effect`, `react-hooks/refs`, `react-hooks/immutability` pazemināti uz `warn` (šie paterni ir leģitīmi daudzās komponentēs — modāļu atiestatīšana, kontrollētu lauku sinhronizācija)
- **`module` → `mod` pārsaukšana** (5 faili) — `@next/next/no-assign-module-variable` kļūdu novēršana failos `modules/[id]/page.tsx`, `format-attached-module-size-display.ts`, `modules/repository.ts` (×2), `projects/repository.ts` (×2)
- **`confirm-modal.tsx`** — ref atjaunināšana pārvietota no render laika uz `useEffect`; novērš `react-hooks/refs` kļūdu
- **Lint rezultāts pēc labojumiem:** 0 kļūdas, 53 brīdinājumi (CI iet cauri)

## v1.2.9

**Materiāla patēriņš, kompozītu kopsummu labojums, opciju nosaukumu fallback un UI kļūdu labojumi**

- **Materiāla patēriņš** (`consumption`) — jauns neobligāts lauks `LineItemCatalogRef.consumption`; kad materiāla mērvienība atšķiras no pozīcijas moduļa mērvienības (piem. m pret m²), parādās `MaterialConsumptionInput` pozīcijas un multi-pozīcijas modāļos; `deriveCompositeUnitPrice` reizina katra materiāla cenu ar patēriņa koeficientu (noklusējums 1); `refreshCatalogRef` saglabā `consumption` vērtību pie kataloga atsvaidzināšanas
- **Kompozītu kopsummu labojums** (`calculate-totals.ts`) — `calculateEstimateTotals` kompozītajiem elementiem tagad vienmēr izsauc `deriveCompositeUnitPrice` (aktuāla struktūra ar `consumption`), nevis izmanto iesaldēto `item.unitPrice`; pirms šī labojuma patēriņš netika atspoguļots kopsummās, ja tāme bija saglabāta pirms `consumption` pievienošanas
- **Moduļa lieluma mērvienības sinhronizācija** (`sync-module-size-quantities.ts`) — `syncLineItemQuantityFromModuleSize` tagad sinhronizē arī `item.unit` no moduļa lieluma, ne tikai `quantity`; saglabājot projekta tāmi, mērvienība tiek atjaunināta automātiski, ja pozīcijai ir `moduleSizeAttachment`
- **Multi-pozīciju opciju nosaukumi** (`multi-position.ts`) — `getMultiPositionSelectionOptions` (opciju select projekta tāmē) un jauna `resolveLineItemDisplayName` helper funkcija tagad izmanto materiāla/mehānisma nosaukumu kā fallback, ja opcija nav nosaukta; šī pati loģika pielietota **Excel** un **PDF** eksportā
- **Google avatari** (`user-avatar.tsx`, `users/repository.ts`) — `UserAvatar` pārveidots par klienta komponentu ar `onError` apstrādi — bojāta Google attēla URL gadījumā tiek parādīti iniciāļi; `resolveAvatarUrl` tagad pārbauda arī `user.identities[].identity_data`, kur dažiem Google OAuth lietotājiem avatar URL tiek glabāts
- **`/positions` novirzīšana** (`next.config.ts`) — pievienots pastāvīgs redirect `/positions` → `/settings/positions`; novērš konsoles kļūdu `invalid input syntax for type uuid: "positions"` no `[id]` dinamiskā maršruta

## v1.2.8

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

## v1.2.7

**Laika norma — vienmēr 2 cipari aiz komata**

- **`formatTimeNormDisplay`** (`variable-quantity.ts`) — noņemts `value === 0` agrais atgriešanās; tagad 0 formatējas kā `"0,00"` nevis `""` (tukšums); ne-nulle vērtības jau izmantoja `.toFixed(2)`, tāpēc tās nav mainītas
- **`LaborTimeNormInput`** — `placeholder` mainīts no `"0"` uz `"0,00"`; blur notikums normalizē jebkuru nepilnu ievadi (piem. `"0,0"`) uz `"0,00"` caur `formatTimeNormDisplay(parseTimeNormInput(draft))`

## v1.2.6

**Valūtas simbols no uzstādījumiem — tāmes kolonnu virsraksti un naudas formatēšana**

- **`getCurrencySymbol()`** — jauna funkcija `currencies.ts`; katrai valūtai pievienots `symbol` lauks (EUR → €, USD → $, GBP → £, PLN → zł, SEK/NOK/DKK → kr)
- **`formatMoney` / `formatMoneyDisplay`** — tagad pieņem `currency?: string | null` parametru un izmanto `getCurrencySymbol()` simbolu; iepriekš bija hardkodēts `€`
- **`estimate-table.tsx`** — `currency` prop propagēts caur visu komponentu ķēdi: `EstimateTable` → `EstimateDndTable` → `EstimateDndTableInner` → `CategoryBlock` → `SubcategoryBlock` → `SortableLineItemRow` → `LineItemRow`; **KOPĀ** žetons tagad rāda pareizo valūtas simbolu; kataloga hintu cenas `EstimateLineItemNameField` arī iegūst `currency`
- **`estimate-position-table.tsx`** — `currency` prop pievienots `EstimatePositionDndTable` sub-komponentam un propagēts no `EstimatePositionTable` caur `EstimatePositionDndTable`
- **Kolonu virsraksti** — `getUnitPriceSubheaderLabels(currency)` jau bija ieviests v1.2.5; šajā versijā salabota prop propagācija, kas iepriekš nenonāca līdz renderēšanas slānim

## v1.2.5

**Individuāls apjoms katram projektam — mērvienība, ikona, korekciju inputs**

- **`variableQuantity` uz `EstimateLineItem`** — karodziņš pārvietots no kataloga pozīcijas uz tāmes rindu (`item.variableQuantity`); `isVariableQuantityLineItem` pārbauda vispirms rindu, tad katalogu; klonējot no sagataves (`clone-sagatave-for-project.ts`) `variableQuantity` rindām `quantity = 0`; sinhronizācija no sagataves uz projektu pie lapas ielādes (`sync-variable-quantity.ts`)
- **Mērvienība no materiāla** — kad `variableQuantity = true`, saglabājot pozīciju modalī mērvienību ņem no pirmā piesaistītā materiāla (piem. "Kanalizācija d.110" → "m"); ja materiāla nav — `draft.unit` vai "gab."
- **Sagatave (`/estimate`)** — slēdzis **Individuāls apjoms katram projektam** katrā pozīciju modalī (`PositionVariableQuantityField`); ieslēdzot: notīra `moduleSizeAttachment`; `fa-random` ikona rindā pie nosaukuma (`estimate-position-table`); moduļa apjoma brīdinājums slēpts, ja `variableQuantity`; mērvienība tabulā — `item.unit` nevis moduļa atvasinājums
- **Projekta tāme (`/[id]`)** — `fa-random` ikona (sarkanā) redzama **tikai** rindām ar `variableQuantity = true`; klikšķis uz ikonas noņem `variableQuantity`; ikona nobīdīta 5 px uz leju; `variableQuantity` rindām `EstimateQuantityInput` ar `emptyValue={0}`; sarkana rinda (`bg-red-50/60`) ja apjoms ≤ 0; **Saglabāt** bloķēts, ja kāda `variableQuantity` rinda bez apjoma; `displayUnit` ignorē `moduleSizeUnit` šādām rindām
- **Moduļa korekciju inputs** (`module-size-attach-item-row.tsx`) — lokāls `useState` (`inputValue`) nodrošina tūlītēju ievades atjauninājumu neatkarīgi no vecāka re-render; `useEffect` sinhronizē no `state.adjustment` tikai ārēju izmaiņu gadījumā
- **Modālis** — `app-modal.tsx` pievienots `overflow-x-hidden` panelim, lai novērstu horizontālo ritināšanu
- **Katalogs (`/positions`)** — `variableQuantity` toggle noņemts no pozīciju kataloga UI (pārvietots uz sagataves tāmes rindu līmeni)

## v1.2.4

**Moduļa lieluma picker — akordeons un auto-atvēršana**

- **Akordeons** — katras `ModuleCard` sadaļas galvene (`PAMATS`, `PAMATA IZGRIEZUMI` u.c.) ir klikšķināma: atvērt vienu sadaļu aizver pārējās; chevron ikona rāda stāvokli
- **Auto-atvēršana pie labošanas** — ja pozīcijai jau ir saglabāts `moduleSizeAttachment`, modāli atverot automātiski atveras tā sadaļa, kurā atrodas piesaistītais `itemKey` (`findSectionForItemKey`); sākotnēji visas sadaļas aizvērtas
- **Sync ar `useEffect`** — `isAttachedModule` vai `attachment.itemKey` mainoties (piemēram, atverot modāli ar saglabātu piesaisti), atveras pareizā sadaļa bez manuālas iejaukšanās
- **`key={draft.id}`** uz `ModuleSizeAttachPicker` `position-modal.tsx` — garantē pilnu remount un `useState` inicializāciju, kad modālī tiek atvērts cits elements

## v1.2.3

**Vairāki materiāli un mehānismi, multi kopsāvilkums, moduļa apjoma brīdinājums**

- **Vairāki materiāli un mehānismi** — `EstimateLineItem` tagad satur `materials: LineItemCatalogRef[]` un `mechanisms: LineItemCatalogRef[]` masīvus; vecais `material`/`mechanism` (singular) saglabāts backward compat kā deprecated; `hydrateCompositeLineItem` automātiski migrē vecos datus uz masīviem
- **Cenu summēšana** — `deriveCompositeUnitPrice` summē visu materiālu cenas un `Σ (kataloga likme × laika norma)` katram mehānismam
- **Position modālis** — katrai pozīcijai var pievienot neierobežotu skaitu materiālu un mehānismu; esošie rāda kā kartītes ar nosaukumu, mērvienību un × noņemšanas pogu; meklēšanas lauks apakšā pievieno nākamo (atiestatās ar `key` triku pēc izvēles)
- **Multi-pozīciju modālis** — tas pats multi-materiālu/mehānismu atjauninājums katrai opcijai (per-opcija `materialAddKey`/`mechanismAddKey`)
- **Multi opciju kopsāvilkums** — katras opcijas kartiņas apakšā `dl` ar Darbs / Materiāli / Mehānismi / Vienības cena (dinamiski atjauninās)
- **Moduļa apjoma brīdinājums** — pozīcijas rinda sarkanā tonī (`bg-red-50/60`) + `fa-exclamation-triangle` aiz nosaukuma + teksts **Nav pievienots moduļa apjoms** zem nosaukuma, ja `moduleSizeOptions.length > 0` un `!item.moduleSizeAttachment`
- **Tooltip** — Materiāli/Mehānismi šūnās tooltip rāda viena nosaukumu vai vairāku nosaukumus komatu atdalītus
- **Stale cenu indikators** — pārbaudīts pret masīvu (`resolveEffectiveMaterials`/`resolveEffectiveMechanisms`), nevis singular lauku

## v1.2.2

**Projektu arhīvs un stale brīdinājumu precizēšana**

- **Arhīvs** — poga `fa-archive` blakus **Jauns projekts** (`project-page-actions.tsx`); skats `/?archive=1` ar visiem projektiem
- **Statusa filtrs** — radio rinda pirms saraksta: **Visi**, **Aktīvie**, **Procesā** (`approved`), **Pabeigtie**, **Noraidītie** (`project-status-filter.tsx`, `filter-projects.ts`)
- **Repository** — `listAllProjects()` visiem statusiem; galvenais saraksts joprojām filtrē `active` + `approved`
- **Stale brīdinājumi** — `shouldShowStaleCatalogPriceWarnings()` tikai `active`; noraidītiem (un apstiprinātiem/pabeigtiem) bez sarkanās apmales, banera un **Atjaunot cenas**
- **Noņemts** — `add-project-button.tsx` (aizstāts ar `project-page-actions.tsx`)

## v1.2.1

**Kopēt vienmēr un pabeigts projekts**

- **Kopēt** — `fa-copy` redzama **vienmēr** (arī apstiprinātiem projektiem), lai var klonēt tāmi kā tā bija
- **Pabeigts** — jauna poga `fa-check-double` apstiprinātiem projektiem (`approved` → `completed`); pēc apstiprināšanas modālā projekts pazūd no `/` saraksta, bet paliek DB; atverams caur tiešu saiti `/{id}`
- **Kartes darbības** — Labot/Dzēst un Noraidīts tikai `active`; Apstiprināts tikai `active`; Pabeigts tikai `approved`
- **Statusa loģika** — `isProjectVisibleInList`: `active` + `approved`; `isProjectEstimateLocked`: `approved` + `completed`
- **Supabase** — `027_project_completed_status.sql` (paplašina `projects_status_check` ar `completed`)
- **UI** — `IconActionButton` variants `complete` (teal hover)

## v1.2.0

**Novecojušas cenas, tāmes apstiprināšana un projekta statuss**

- **Novecojušas kataloga cenas** — saglabātām projekta tāmēm (`meta.savedAt` vai legacy heuristika) salīdzina iesaldētās cenas ar katalogu; **sarkanās šūnas** materiālu/mehanismu vienības un apjoma kolonnās (`stale-catalog-price.ts`, `resolveStaleCatalogPriceHints`)
- **Projektu saraksts** — sarkanā kartes apmale + **Ir jauninājumi izcenojumos** (`listProjectIdsWithStaleCatalogPrices`); apstiprinātie projekti izlaisti
- **Projekta lapa** — baneris **Pieejami jauni izcenojumi**; **Atjaunot cenas** atjaunina cenas tabulā no kataloga bez DB saglabāšanas (**Saglabāt** paliek dirty, ja ir izmaiņas)
- **Apstiprināts** — `updateProjectStatusAction` → `approved`; tāme read-only (`estimateLocked`); zaļš statusa baneris; bez stale brīdinājumiem un **Atjaunot cenas**; backend bloķē `saveProjectEstimate` / datumu labošanu; kartē paslēpti Kopēt/Labot/Dzēst
- **Noraidīts** — `rejected`; pazūd no `/` saraksta (`isProjectVisibleInList`), ieraksts DB paliek; pēc apstiprināšanas `router.push("/")`
- **Supabase** — `026_project_status.sql` (`projects.status`, check constraint, index); `npm run db:migrate` obligāts pirms statusa pogām
- **Repository** — progresīvs `SELECT` fallback, ja trūkst `status` vai `project_description` kolonnas (līdz migrācijai / PostgREST schema reload)
- **UI** — `ConfirmModal` apstiprināšanai/noraidīšanai; piesaistītais moduļa lielums zem nosaukuma (`footer`); kājene **Kopā** ar `formatAmountDisplay` (bez `€`)

## v1.1.32

**Projekta kopēšana ar tāmi**

- **Kopēt** — jauna ikonu poga (`fa-copy`) projekta kartē (`project-card-actions.tsx`); atver **Jauns projekts** modāli ar tukšiem kontaktu laukiem un avota moduli iepriekš aizpildītu
- **Tāmes klons** — izveides laikā jaunā tāme tiek klonēta no avota projekta (`createProject` + `copyEstimateFromProjectId`), nevis no Sagataves; izmanto `cloneSagataveDocumentForProject` ar jauniem ID un `multiOptionLinks`
- **UI / API** — `ProjectFormModal` `copyFromProject`; `CreateProjectInput.copyEstimateFromProjectId`; `IconActionButton` variants `copy`

## v1.1.31

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

## v1.1.30

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

## v1.1.29

**Pozicijas — materiāli/mehānismi, filtrs un cenas attēlojums**

- **`/positions`** — katalogā tikai **Materiāls** un **Mehānismi** (darba rindas slēptas; pievienot/labot tikai šos veidus); **Darbs** joprojām no **Uzstādījumi** stundas likmes tāmēs
- **Veida filtrs** — kompakts radio zem meklēšanas: **Visi** / **Materiāls** / **Mehānismi** (kopā ar meklēšanu)
- **Cena** — ja nav iedota, rāda `- EUR / gab.` (nevis `—`)
- **Lib / UI** — `CATALOG_POSITION_COST_TYPES`, `filterCatalogPositions`, `PositionCostTypeFilter`; `PositionCostTypeField` ar `catalogOnly`; `position-cost-type-filter.tsx`

## v1.1.28

**Frontoni, moduļa apjomi piedāvājumā un tāmes UX**

- **Frontoni** (`Projekta apraksts` → Sienas) — vairāki frontoni ar augstumu, **Skaits** un **Pamata plakne** (pamata platums/dziļums; L formā **L Pamata platums** / **L Pamata dziļums**); laukums `platums × augstums / 2 × skaits`; pieskaitīts **Ārsienu kvadratūra (neto)**; moduļa lielumu kopsavilkumā (`gablePediments` JSON)
- **Piedāvājums** (`/[id]`) — `moduleSizeAttachment` apjoms **Apj.** kolonnā (read-only); sinhronizācija no sagataves/moduļa (`sync-module-size-quantities.ts`); multi tikai opciju select (bez modāļa/dzēšanas/**+ Multi**)
- **Apjomi** — apaļošana līdz 2 cipariem (`roundToTwoDecimals`, `variable-quantity.ts`, moduļa lielumu kopsavilkums)
- **Tabula** — materiālu un mehānismu nosaukumi labajā pusē (sagatave + projekts)
- **UI** — visur **Gabali** → **Skaits** (frontoni, logi, durvis, jumts)
- **Lib** — `foundation-plane-options.ts`; `project-description-calculations.ts` frontonu formula un ārsienu neto

## v1.1.27

**Sagatave — moduļa lieluma piesaiste un piedāvājuma redzamība**

- **Piesaisīt moduļa lielumu** — darba pozīcijām `fa-clipboard-list`; modālis ar moduļu `project_description` lielumiem (Pamats, izgriezumi, Sienas, Logi, Durvis, Jumts); viens piesaistes slēdzis; **+** korekcijas (`adjustments`) tikai tāmes rindai, modulis nemainās; atvasināto lielumu pārrēķins; auto-saglabāšana ar toast; apjoms zem nosaukuma (`moduleSizeAttachment` JSON)
- **Subkategorija** — `fa-eye` / `fa-eye-slash` nosaukuma šūnā; `hiddenInOffer` sagataves JSON (piedāvājuma lietošana vēlāk)
- **Toast** — `FeedbackToastProvider` `app/layout.tsx` un `(protected)/layout.tsx`
- **Lib / UI** — `format-module-size-summary.ts`, `apply-module-size-adjustments.ts`, `module-size-attachment.ts`, `has-defined-labor.ts`, `attach-module-size-*`, `attached-module-size-label.tsx`, `subcategory-offer-visibility-toggle.tsx`; `listBuildingModuleSizeOptions()`; `EstimateLineItemNameField` `footer` slot

## v1.1.26

**Projekta apraksts un moduļu datu indikators**

- **Projekta apraksts** — pilna forma moduļa detaļā (`/modules/[id]`) un individuālajam projektam (`/[id]/module-data`): Pamats (perimetrs, tilpums, L veida paplašinājums, izgriezumi), Sienas, Logi, Durvis, Jumts (plaknes, tekne, notekas, kopsummas); **Saglabāt** ar dirty stāvokli; JSON `project_description` uz `building_modules` un `projects`
- **`/modules` saraksts** — sarkana **`fa-house-damage`** ikona, ja trūkst vizualizāciju vai projekta PDF; tooltip **Nav ievadīti moduļu dati** (`module-missing-data-icon.tsx`, `isBuildingModuleDataComplete`)
- **Supabase** — `025_project_description.sql`; `missing-column` fallback, ja migrācija vēl nav palaista
- **Lib / UI** — `project-description-types.ts`, `project-description-calculations.ts`, `parse-project-description.ts`, `module-project-description-form.tsx`, `building-module-data.ts`; `Tooltip` `labelClassName` platākiem tooltipiem

## v1.1.25

**Projekta tāme — sagatave, Apjoma cena un read-only kataloga rindas**

- **Jauns projekts** — tāme klonēta no **Sagatave** (`clone-sagatave-for-project.ts`, `project-estimate-base.ts`); `multiOptionLinks` nodoti uz `EstimateTable`; tukšām tāmēm fallback no sagataves
- **Tabula** (`/[id]`) — **Apj.** kolonna vienmēr redzama; **Apjoma cena** (Darbs / Materiāls / Mehānismi / Kopā) = `apjoms × vienības cena` tikai **mainīgs apjoms** rindām; kājene summē komponentus apjoma kolonnās, **Kopā** apjoma sadaļā
- **Read-only** — kataloga saistītām rindām nosaukums, mērvienība un **vienības cena**; cenas no kataloga / stundas likmes (`calculate-totals` saskaņots ar attēlojumu)
- **Multi piedāvājums** — viena rinda ar opciju **select**, **Multi** badge + nosaukums zem select (ne visas opcijas + radio)
- **Attēlojums** — `formatAmountDisplay` / `formatMoneyDisplay`: **0** → **—** visās tāmes summu šūnās
- **UI** — `estimate-volume-sum-cells.tsx`, `estimate-quantity-input.tsx`; galvenē pozīciju/rindu skaits un **+ Tāmes pozīcija**

## v1.1.24

**Multi opciju saites (nevis visu multi bloku)**

- **Opciju līmeņa saite** — `fa-link` uz katras aizpildītas multi opcijas rindas; velc uz opciju **citā** multi (ne uz vienu un to pašu multi); var apvienot 2+ opcijas vienā grupā
- **UI** — zem opcijas nosaukuma pelēks saraksts ar saistītajām (`multi nosaukums · opcija`); `fa-times` atvieno abos virzienos
- **Piedāvājums** (`/[id]`) — radio izvēle vienā multi **divvirzienu** ieslēdz atbilstošās saistītās opcijas citos multi; **Neviena opcija** notīra saistīto grupu
- **Persist** — sagatavē `multiOptionLinks` JSON (`estimate_positions.sections` kā `{ sections, multiOptionLinks }` vai tikai masīvs bez saitēm); atpakaļsaderība ar veco masīva formātu
- **Lib / UI** — `multi-position-links.ts`, `multi-position-link-handle.tsx`; `serialize-document.ts` parse/build wrapper

## v1.1.23

**Multi-pozīcijas, sekciju sakļaušana un mainīgs apjoms**

- **Multi-pozīcija** — **+ Multi** pie tāmes pozīcijas vai subkategorijas (sagatave + projekta tāme); modālis ar nosaukumu, kataloga opcijām (OPCIJA 1, 2, …), drag-reorder opcijām, automātiska tukša nākamā rinda; klikšķis uz nosaukuma vai poga **Labot**; visa multi bloka pārvietošana tabulā ar grip; piedāvājumā radio izvēle — no citām multi **paslēptas tikai izvēlētās** opcijas; vienā multi aizliegti dublikāti, bet tā pati kataloga pozīcija atļauta dažādās multi
- **Sakļaušana** — chevron uz tāmes pozīcijas un subkategorijas rindām; stāvoklis cookie `eb_estimate_collapsed_{documentId}`; **+ Sub** / **+ Multi** / **+ Pozīcija** atver sakļauto vecāku
- **Mainīgs apjoms** — `/positions` pievienošanas/labošanas modāļos; `position_prices.variable_quantity` (`024`); projekta tāmē **Daudz.** kolonna tikai saistītām pozīcijām ar šo karodziņu; kopsummā `quantity × unit price`
- **Tabula / DnD** — katra sortējama vienība savā `<tbody>` (derīgs HTML5, bez hydration kļūdām); `AppModal` renderē caur `createPortal` uz `document.body`
- **Lib / UI** — `multi-position.ts`, `multi-position-modal.tsx`, `estimate-multi-position-row.tsx`, `collapsed-sections-cookie.ts`, `use-collapsed-estimate-sections.ts`, `variable-quantity.ts`, `PositionVariableQuantityField`

## v1.1.22

**Sagatave — subkategorijas un tikai lasāmas cenas**

- **Sagatave** (`/estimate`) — **+ Sub** un subkategoriju rindas kā projekta tāmē (`/[id]`); pozīcijas zem tāmes pozīcijas vai subkategorijas; DnD (sekcijas, subkategorijas, rindas) caur `reorderEstimate`
- **Vienības cena** sagatavē — **read-only**; darbs no **Uzstādījumi** stundas likmes, materiāli/mehānismi no **Pozicijas**; `forceCatalogPrices` ielādē un saglabā
- **Struktūra** — `EstimatePositionSection` = `EstimateCategory` (`subcategories` + `items`); `normalizeEstimatePositionSection` migrē vecos JSON ierakstus; `hydrateSectionsWithCatalogLinks` apstrādā arī subkategoriju rindas

## v1.1.21

**Noņemts legacy maršruts `/estimate-positions`**

- Dzēsts `app/(protected)/estimate-positions/` (redirect uz `/estimate` vairs nav); sagatave tikai **`/estimate`**
- `app/lib/estimate-positions/` — bez izmaiņām (DB un tabulas loģika)

## v1.1.20

**Sagatave — cenas pēc veida, bez kopsummas rindas**

- **Kataloga cenas** — Materiāls / Mehānismi / Darbs iet attiecīgajā **Vienības cena** kolonnā (ielāde, hint izvēle, blur, saglabāšana); `buildUnitPriceForCatalogPosition`, `hydrateLineItemWithCatalog`
- **Sagatave** (`/estimate`) — noņemta apakšējā **Kopā** kopsummu rinda (`estimate-position-table`); projekta tāmē (`/[id]`) kopsumma paliek
- **Dokumentācija** — `app/(protected)/estimate-positions/` tikai legacy redirect; `app/lib/estimate-positions/` sagataves loģika

## v1.1.19

**Sagatave table, catalog hints & Pozicijas sync**

- **Tāmes tabula** (sagatave + projekts) — noņemtas **Daudz.** un **Apjoma summa** kolonnas; paliek **Vienības cena**; projekta tāmē kopsummas rindā summētas vienības cenas
- **Kataloga hinti** — rindas nosaukuma laukā autocomplete no `/positions`; izvēle aizpilda mērvienību un cenas (darbs no stundas likmes, materiāli/mehānismi no kataloga)
- **Sagatave** — **Saglabāt**, dirty stāvoklis, modālis pie navigācijas prom; `estimate_positions` (`020`–`021`)
- **Sinhronizācija** — sagatavē vai projekta tāmē mainīts nosaukums/mērvienība atjaunina saistīto ierakstu `/positions` (`positionPriceId`, automātiska saite ielādē, sync pie blur/saglabāšanas)

## v1.1.18

**Route — Sagatave `/estimate`**

- **Sagatave** maršruts: `/estimate-positions` → **`/estimate`**; vecie URL pārvirza uz jauno

## v1.1.17

**Sagatave — viena sagatave, tieša tabula**

- **`/estimate-positions`** — atver tāmes tabulu uzreiz (nav kartīšu saraksta); `ensureDefaultEstimatePosition()` izmanto vienu DB ierakstu vai izveido **Sagatave**
- **`/estimate-positions/[id]`** — pārvirza uz `/estimate-positions`
- **Noņemts** — vairāku sagatavju CRUD UI (kartītes, pievienošanas modālis, dzēšana)

## v1.1.16

**Nav — Sagatave**

- **Nav** label **Tāmes pozicijas** → **Sagatave** (`/estimate-positions` route unchanged); list page title and back link updated

## v1.1.15

**Nav — noņemta Sagatave**

- **Nav** — no top menu: **Sagatave** (`/blanks`)
- **Removed** — `app/(protected)/blanks/page.tsx`, `app/lib/blanks/sample-blocks.ts`

## v1.1.14

**Pozicijas — cenu vēsture**

- **`/positions`** — row action **Vēsture** (`fa-history`, sky hover); extra-wide read-only modal lists each saved unit price (newest first) with `dd.mm.yy` date, amount + optional **No …** delta vs previous entry
- **Veikals** column in history — line 1: store · contact; line 2: phone + email with Font Awesome icons
- **Atjaunot cenu** — every save appends a row to `position_price_history` (price, date, supplier snapshot)
- **Supabase** — `022_position_price_history.sql` (table + backfill from existing `position_prices`); RLS deny for clients
- **Lib / UI** — `listPositionPriceHistory`, `getPositionPriceHistoryAction`, `PositionPriceHistoryModal`; `IconActionButton` variant `history`

## v1.1.13

**Nav split, position cost types & settings hourly rate**

- **Nav** — **Pozicijas** (`/positions`, was **Tāmes Pozīcijas**); new **Tāmes pozicijas** (`/estimate-positions`, placeholder); order: Ēku moduļi → Sagatave → Tāmes pozicijas → Pozicijas
- **Pozicijas** — **Izmaksu veids** per row: Darbs / Materiāls / Mehānismi (`cost_type`); table column **Veids**; add/edit modals use horizontal radio-style row above name + unit
- **Uzstādījumi** — **Darbinieka standarta stundas likme** with currency suffix in input; preview sidebar shows saved rate
- **Supabase** — `018_company_settings_default_hourly_rate.sql`; `019_position_prices_cost_type.sql`
- **Lib** — `position-cost-type.ts`, `default-hourly-rate.ts`, `PositionCostTypeField`

## v1.1.12

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

## v1.1.11

**Projects — building module link & smarter modal exit**

- **Jauns projekts / Labot** — required **Modulis** select (catalog modules + **Individuāls projekts**); persisted as `projects.building_module_id` (nullable FK); server validation on create/update
- **Project cards** — module name shown above client name on `/`
- **`AppModal`** — optional `dirty` prop; backdrop click closes **without** confirm when form unchanged; all form modals pass `dirty` (project, module, position, invite, price update)
- **Supabase** — migration `015_project_building_module.sql`
- **Cursor** — `modal-confirm-exit.mdc` documents `dirty` behaviour

## v1.1.10

**Ēku moduļi — catalog, detail, files & outline**

- **`/modules`** — Supabase-backed list; **Pievienot Moduli** (name); cards with link to detail, **Labot**, **Dzēst**; empty state text
- **`/modules/[id]`** — two-column layout: left **Vizualizācijas** (images only, 2-column thumbnail grid, drag reorder) stacked above **Projekts** (PDF only, same grid); right **Projekta apraksts** placeholder inputs (not saved yet); outline categories below (no “Aptaksts” header)
- **File uploads** — `module-assets` Storage bucket; `visualization_blocks` / `project_blocks` JSON on `building_modules`; server actions; delete removes storage files
- **PDF previews** — `pdfjs-dist` legacy canvas render via `/api/modules/asset` proxy; `<embed>` fallback; `postinstall` copies worker to `public/`; `proxy.ts` excludes worker from session middleware
- **Modals** — `AppModal` Enter submits forms; `ConfirmModal` Enter confirms (focus-safe); `ConfirmModal` uses refs for stable `useEffect` deps
- **Supabase** — migrations `010`–`014` (`building_modules`, outline, blocks, `module-assets` bucket)

## v1.1.9

**Tāmes pozicijas — catalog, prices & supplier tooltips**

- **`/positions`** — renamed nav label **Tāmes pozicijas**; searchable table (name, price as `amount EUR / unit` + `dd.mm.yy` date, actions); zebra rows + muted dark-green hover
- **Pievienot / Labot** — wider modals; name + unit (80/20, unit hints via portal dropdown, auto-focus on add)
- **Atjaunot cenu** — extra-wide modal; unit price or volume × total calc; currency/unit input suffixes from company settings; supplier store, contact, email, phone; section cards; **Atcelt** before save
- **Supplier tooltip** on price hover (`cursor: help` on price, `default` elsewhere); white card with icons; phone shown as `+371 29123456` via `formatDisplayPhone`
- **Supabase** — `position_prices` table + seed (`008_position_prices.sql`); supplier columns (`009_position_price_supplier.sql`); server actions + `app/lib/positions/repository.ts`
- **`ModalFormActions`** — shared **Atcelt** + primary button row on all form modals (`AppModal` optional `panelMaxWidthClassName`)
- **`AppModal`** — backdrop click confirm (“Izbeigt darbību?”); configurable panel width presets

## v1.1.8

**Estimate editor — map + meta header layout**

- Project page (`/[id]`): document meta moved **above** the table block; **Google Maps** (left) and meta fields (right) in a **50/50** grid; map height matches meta column
- Meta fields: **Objekts** full-width textarea; **Sagatavotājs**, **Datums**, **Tāmes termiņš** below in one row
- Shared `AddressMapEmbed` + `buildGoogleMapsEmbedUrl` (used in estimate header and address autocomplete)
- Cursor rule: `typecheck` + `build` required before GitHub commit/push

## v1.1.7

**Users invite, estimate termiņš & local auth fixes**

- **Lietotāji** — **Uzaicināt** button + modal; `inviteUserAction` / `inviteUserByEmail`; `validateRequiredEmail` on client and server
- Estimate meta: editable **Tāmes termiņš** (`meta.deadline`); default +30 days on new project; header total label **Kopā**
- **Labot projektu** — Google Maps embed for pre-filled address (debounced preview)
- Settings preview sidebar widened (+15%)
- Fix missing `calculate-totals.ts` module (build error)
- Mitigate localhost **431** cookie bloat: larger HTTP header limit in `dev`/`start`; middleware purges foreign `sb-*` cookies (`storage-key.ts`)

## v1.1.6

**Projects — edit, delete & card actions**

- **Labot** on project card opens `ProjectFormModal` pre-filled with client contact data; **Saglabāt** updates `projects` and syncs estimate title/meta
- **Dzēst** opens `ConfirmModal`; confirm removes project from DB (estimate cascades)
- Shared `ProjectFormModal` for create and edit; `parseStoredPhone` splits stored number for edit form; `PhoneField` skips geo lookup when editing
- `IconActionButton` variants (edit/delete/approve/reject) — colored background and icon on hover only
- Global `cursor: pointer` on buttons in `globals.css`; Cursor rule `button-cursor-pointer.mdc`

## v1.1.5

**Projects — create flow, cards & address autocomplete**

- **Jauns projekts** on `/` — modal (`AppModal`) with client name, phone, email, address; creates `projects` row + empty `estimates` document
- Phone: country code from IP (`/api/geo/calling-code`), selectable prefix; email/phone validation; invalid fields highlighted
- Address: Google **Places API (New)** via server `/api/places/autocomplete` (Referer header for restricted keys); dropdown above modal
- Project cards: name, email + phone (one line), address; action icons (Edit, Delete, X) with black tooltips
- Migration `007_project_client_contact` — `phone`, `email` on `projects`
- `IconActionButton`, `ProjectCard`, `FeedbackToast`; CSP updates for Google; Cursor rules for modals, tooltips, toasts

## v1.1.4

**Bank IBAN auto-fill & RLS hardening**

- Settings: Latvian IBAN auto-fills bank name and SWIFT (`resolve-bank-from-account.ts`); account field first, bank row appears below
- Migration `006_rls_deny_client_access` — replace `using (true)` policies with client deny (fixes Supabase “RLS Policy Always True”)
- `supabase-migration-security.mdc` — document lint traps; forbid blanket `true` policies

## v1.1.3

**Settings, nav refresh & DB security**

- English routes: `/`, `/modules`, `/blanks`, `/positions`, `/users`, `/settings`; labels Sagataves, Cenu pozicijas, Ēku moduļi
- Top nav: user avatar, name, sign-out; minimal underline active state
- **Lietotāji** — real Supabase Auth users with Google avatars (`app/lib/users/repository.ts`)
- **Uzstādījumi** — company form (name, address, reg/VAT, bank, contacts, currency) + drag-and-drop logo upload to Storage
- Migrations: `003_company_settings`, `004_company_logo`, `005_security_hardening` (RLS policies, `set_updated_at` search_path, storage listing fix)
- `db:migrate` tracks applied files in `schema_migrations`; bootstraps existing DBs; applies pending only
- Cursor rules: auto-migrate after SQL, Supabase security checklist for new migrations

## v1.1.2

**Google login & DB migrations**

- Full-page login gate: centered “Pierakstīties ar Google” when not authenticated; app hidden until sign-in
- Google OAuth via Supabase (`signInWithGoogle`, `/auth/callback`, `LoginGate`)
- Protected routes moved to `app/(protected)/` with server-side session check
- `db:migrate` tries Supabase pooler (session + transaction) before direct host; `SUPABASE_DB_REGION` in `.env.example`

## v1.1.1

**README & release workflow**

- README: env security note (secrets in `.env.local` only), roadmap, corrected project structure tree
- Cursor rule: `README update` trigger with default **patch** (+0.0.1) bump; minor/major only when explicitly requested

## v1.1.0

**Supabase integration**

- `@supabase/ssr` clients (browser, server, admin) and session refresh via `proxy.ts`
- Migrations: `projects` + `estimates` tables with seed data
- Project list and detail load from Supabase when configured; sample fallback otherwise
- `npm run db:migrate` and `npm run db:test` scripts

## v1.0.0

**Initial release**

- Next.js estimate editor with categories, subcategories, and line items
- Unit price and volume breakdown (labor, materials, mechanisms)
- Drag-and-drop reorder with cross-container item moves and drop line indicator
- Top navigation: Projekti, Eku moduļi, Definētie bloki, Poziciju Cenas, Lietotāji
- Project list with name/address cards; estimate opens at `/projekti/[id]`
- Shared list-page layout (`SectionPage`, `ListEntryCard`) across sections
- Sample data for projects, modules, blocks, prices, and users
