-- Privātuma politika, lietošanas noteikumi, sīkdatņu politika, kājene un sīkdatņu piekrišanas UI.

with translations (translation_key, namespace, description, lv, en) as (
  values
    -- Kājene
    (
      'footer.copyright',
      'footer',
      'Footer copyright line',
      '© {year} {systemName}',
      '© {year} {systemName}'
    ),
    (
      'footer.nav_label',
      'footer',
      'Footer legal navigation aria label',
      'Juridiskā informācija',
      'Legal information'
    ),
    (
      'footer.cookie_settings',
      'footer',
      'Reopen cookie consent settings',
      'Sīkdatņu iestatījumi',
      'Cookie settings'
    ),

    -- Sīkdatņu piekrišanas paziņojums
    (
      'cookie_consent.banner.title',
      'cookie_consent',
      'Cookie banner title',
      'Mēs izmantojam sīkdatnes',
      'We use cookies'
    ),
    (
      'cookie_consent.banner.description',
      'cookie_consent',
      'Cookie banner description',
      'Obligātās sīkdatnes ir nepieciešamas, lai sistēma darbotos un tu varētu pieslēgties. Preferenču, statistikas un mārketinga sīkdatnes izmantojam tikai ar tavu piekrišanu, un to vari mainīt jebkurā laikā.',
      'Strictly necessary cookies are required for the system to work and for you to sign in. Preference, statistics and marketing cookies are used only with your consent, and you can change your choice at any time.'
    ),
    (
      'cookie_consent.banner.customize',
      'cookie_consent',
      'Open cookie settings from banner',
      'Pielāgot',
      'Customise'
    ),
    (
      'cookie_consent.actions.accept_all',
      'cookie_consent',
      'Accept all cookie categories',
      'Piekrist visām',
      'Accept all'
    ),
    (
      'cookie_consent.actions.reject_all',
      'cookie_consent',
      'Reject all optional cookie categories',
      'Atteikt neobligātās',
      'Reject optional'
    ),
    (
      'cookie_consent.actions.save',
      'cookie_consent',
      'Save selected cookie categories',
      'Saglabāt izvēli',
      'Save choice'
    ),
    (
      'cookie_consent.settings.title',
      'cookie_consent',
      'Cookie settings modal title',
      'Sīkdatņu iestatījumi',
      'Cookie settings'
    ),
    (
      'cookie_consent.settings.description',
      'cookie_consent',
      'Cookie settings modal description',
      'Izvēlies, kuras sīkdatņu kategorijas atļaut. Izvēli vari mainīt jebkurā laikā kājenē.',
      'Choose which cookie categories to allow. You can change your choice at any time in the footer.'
    ),
    (
      'cookie_consent.settings.always_on',
      'cookie_consent',
      'Badge for the necessary category',
      'Vienmēr ieslēgtas',
      'Always on'
    ),
    (
      'cookie_consent.category.necessary.title',
      'cookie_consent',
      'Necessary cookie category title',
      'Obligātās sīkdatnes',
      'Strictly necessary cookies'
    ),
    (
      'cookie_consent.category.necessary.description',
      'cookie_consent',
      'Necessary cookie category description',
      'Nodrošina pieslēgšanos, drošību, izvēlēto valodu un tavas piekrišanas saglabāšanu. Bez tām sistēma nedarbojas, tāpēc tās nav iespējams izslēgt.',
      'They keep you signed in, protect the system, remember your chosen language and store your consent. The system does not work without them, so they cannot be switched off.'
    ),
    (
      'cookie_consent.category.preferences.title',
      'cookie_consent',
      'Preference cookie category title',
      'Preferenču sīkdatnes',
      'Preference cookies'
    ),
    (
      'cookie_consent.category.preferences.description',
      'cookie_consent',
      'Preference cookie category description',
      'Atceras tavas izvēles saskarnē, piemēram, sakļautu sānjoslu vai sakļautas tāmes sadaļas. Bez šīs piekrišanas izvēles darbojas tikai līdz lapas pārlādei.',
      'They remember your interface choices, such as a collapsed sidebar or collapsed estimate sections. Without this consent your choices only last until the page is reloaded.'
    ),
    (
      'cookie_consent.category.analytics.title',
      'cookie_consent',
      'Analytics cookie category title',
      'Statistikas sīkdatnes',
      'Statistics cookies'
    ),
    (
      'cookie_consent.category.analytics.description',
      'cookie_consent',
      'Analytics cookie category description',
      'Ļauj anonīmi mērīt sistēmas lietojumu, lai uzlabotu funkcionalitāti. Šobrīd sistēmā netiek izmantots neviens statistikas rīks.',
      'They allow anonymous measurement of how the system is used so we can improve it. No statistics tool is currently used in the system.'
    ),
    (
      'cookie_consent.category.marketing.title',
      'cookie_consent',
      'Marketing cookie category title',
      'Mārketinga sīkdatnes',
      'Marketing cookies'
    ),
    (
      'cookie_consent.category.marketing.description',
      'cookie_consent',
      'Marketing cookie category description',
      'Ļauj rādīt personalizētu reklāmu un mērīt kampaņas. Šobrīd sistēmā netiek izmantota neviena mārketinga sīkdatne.',
      'They allow personalised advertising and campaign measurement. No marketing cookie is currently used in the system.'
    ),

    -- Juridisko lapu navigācija
    (
      'legal.nav.title',
      'legal',
      'Legal pages sidebar title',
      'Juridiskā informācija',
      'Legal information'
    ),
    (
      'legal.nav.back_to_app',
      'legal',
      'Back link for signed in users',
      'Atpakaļ uz sistēmu',
      'Back to the system'
    ),
    (
      'legal.nav.back_to_login',
      'legal',
      'Back link for anonymous users',
      'Atpakaļ uz pieslēgšanos',
      'Back to sign in'
    ),
    (
      'legal.nav.updated_at',
      'legal',
      'Legal document last updated label',
      'Atjaunināts {date}',
      'Last updated {date}'
    ),

    -- Pārziņa rekvizīti (aizpilda administrators tulkojumu sadaļā)
    (
      'legal.common.updated_at',
      'legal',
      'Legal documents effective date',
      '05.08.2026',
      '05.08.2026'
    ),
    (
      'legal.common.controller_name',
      'legal',
      'Data controller legal name; empty value falls back to the system name',
      '',
      ''
    ),
    (
      'legal.common.controller_registration_number',
      'legal',
      'Data controller registration number',
      '[reģistrācijas numurs]',
      '[registration number]'
    ),
    (
      'legal.common.controller_address',
      'legal',
      'Data controller legal address',
      '[juridiskā adrese]',
      '[registered address]'
    ),
    (
      'legal.common.controller_email',
      'legal',
      'Data controller contact email',
      '[e-pasta adrese]',
      '[email address]'
    ),
    (
      'legal.common.supervisory_authority',
      'legal',
      'Competent data protection supervisory authority',
      'Datu valsts inspekcija (www.dvi.gov.lv)',
      'State Data Inspectorate of Latvia (www.dvi.gov.lv)'
    ),
    (
      'legal.controller.label.name',
      'legal',
      'Controller details row label',
      'Pārzinis',
      'Controller'
    ),
    (
      'legal.controller.label.registration_number',
      'legal',
      'Controller details row label',
      'Reģistrācijas numurs',
      'Registration number'
    ),
    (
      'legal.controller.label.address',
      'legal',
      'Controller details row label',
      'Adrese',
      'Address'
    ),
    (
      'legal.controller.label.email',
      'legal',
      'Controller details row label',
      'E-pasts',
      'Email'
    ),
    (
      'legal.controller.label.supervisory_authority',
      'legal',
      'Controller details row label',
      'Uzraudzības iestāde',
      'Supervisory authority'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();

-- Privātuma politika
with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'legal.privacy.title',
      'legal',
      'Privacy policy title',
      'Privātuma politika',
      'Privacy policy'
    ),
    (
      'legal.privacy.intro',
      'legal',
      'Privacy policy intro',
      'Šajā privātuma politikā skaidrojam, kādus personas datus apstrādājam, kad izmanto sistēmu {systemName}, kāpēc to darām un kādas ir tavas tiesības saskaņā ar Vispārīgo datu aizsardzības regulu (ES) 2016/679 (VDAR).',
      'This privacy policy explains what personal data we process when you use {systemName}, why we do it and what rights you have under the General Data Protection Regulation (EU) 2016/679 (GDPR).'
    ),
    (
      'legal.privacy.controller.title',
      'legal',
      'Privacy section title',
      '1. Datu pārzinis',
      '1. Data controller'
    ),
    (
      'legal.privacy.controller.p1',
      'legal',
      'Privacy paragraph',
      'Par personas datu apstrādi sistēmā atbild datu pārzinis, kura rekvizīti norādīti šīs lapas sadaļā ar pārziņa informāciju. Ar pārzini vari sazināties par jebkuru ar datu apstrādi saistītu jautājumu, izmantojot norādīto e-pasta adresi.',
      'Personal data processing in the system is the responsibility of the data controller whose details are listed in the controller section of this page. You can contact the controller about any data processing question using the email address provided.'
    ),
    (
      'legal.privacy.controller.p2',
      'legal',
      'Privacy paragraph',
      'Ja izmanto sistēmu sava darba devēja vai klienta uzdevumā, par tāmēs un projektos ievadītajiem datiem pārzinis var būt attiecīgais uzņēmums, bet mēs šos datus apstrādājam kā apstrādātājs uzņēmuma uzdevumā.',
      'If you use the system on behalf of your employer or client, the controller of the data entered into estimates and projects may be that company, and we process such data as a processor acting on the company instructions.'
    ),
    (
      'legal.privacy.data.title',
      'legal',
      'Privacy section title',
      '2. Kādus datus apstrādājam',
      '2. What data we process'
    ),
    (
      'legal.privacy.data.p1',
      'legal',
      'Privacy paragraph',
      'Konta dati: vārds, uzvārds, e-pasta adrese, profila attēls un identifikators, ko saņemam no Google pieslēgšanās pakalpojuma, kā arī tev piešķirtā lietotāja grupa, tiesības un izvēlētā valoda.',
      'Account data: first name, last name, email address, profile picture and identifier received from the Google sign-in service, as well as your assigned user group, permissions and selected language.'
    ),
    (
      'legal.privacy.data.p2',
      'legal',
      'Privacy paragraph',
      'Darba dati: uzņēmuma un projektu informācija, tāmes, pozīcijas, materiāli, cenas, darba laika plānojums un citi dati, ko tu vai tava organizācija ievada sistēmā.',
      'Work data: company and project information, estimates, positions, materials, prices, work schedules and other data that you or your organisation enter into the system.'
    ),
    (
      'legal.privacy.data.p3',
      'legal',
      'Privacy paragraph',
      'Tehniskie dati: pieslēgšanās laiks, IP adrese, pārlūka un ierīces informācija, kā arī sistēmas darbības žurnāli, kas nepieciešami drošībai un kļūdu novēršanai.',
      'Technical data: sign-in time, IP address, browser and device information, and system logs required for security and troubleshooting.'
    ),
    (
      'legal.privacy.data.p4',
      'legal',
      'Privacy paragraph',
      'Piekrišanas dati: tava izvēle par sīkdatņu kategorijām un tās veikšanas laiks.',
      'Consent data: your choice of cookie categories and the time when it was made.'
    ),
    (
      'legal.privacy.purposes.title',
      'legal',
      'Privacy section title',
      '3. Apstrādes mērķi un juridiskais pamats',
      '3. Purposes and legal bases'
    ),
    (
      'legal.privacy.purposes.p1',
      'legal',
      'Privacy paragraph',
      'Pakalpojuma sniegšana un konta pārvaldība — pamats ir līguma izpilde vai pasākumi pirms līguma noslēgšanas (VDAR 6. panta 1. punkta b) apakšpunkts).',
      'Providing the service and managing your account — the basis is performance of a contract or steps taken before entering into a contract (GDPR Article 6(1)(b)).'
    ),
    (
      'legal.privacy.purposes.p2',
      'legal',
      'Privacy paragraph',
      'Sistēmas drošība, kļūdu novēršana un ļaunprātīgas izmantošanas novēršana — pamats ir mūsu leģitīmās intereses (VDAR 6. panta 1. punkta f) apakšpunkts).',
      'System security, troubleshooting and prevention of abuse — the basis is our legitimate interests (GDPR Article 6(1)(f)).'
    ),
    (
      'legal.privacy.purposes.p3',
      'legal',
      'Privacy paragraph',
      'Neobligātās sīkdatnes un tām līdzīgas tehnoloģijas — pamats ir tava piekrišana (VDAR 6. panta 1. punkta a) apakšpunkts), kuru vari atsaukt jebkurā laikā.',
      'Optional cookies and similar technologies — the basis is your consent (GDPR Article 6(1)(a)), which you can withdraw at any time.'
    ),
    (
      'legal.privacy.purposes.p4',
      'legal',
      'Privacy paragraph',
      'Grāmatvedības un citu normatīvo prasību izpilde — pamats ir juridisko pienākumu izpilde (VDAR 6. panta 1. punkta c) apakšpunkts).',
      'Accounting and other statutory requirements — the basis is compliance with a legal obligation (GDPR Article 6(1)(c)).'
    ),
    (
      'legal.privacy.cookies.title',
      'legal',
      'Privacy section title',
      '4. Sīkdatnes',
      '4. Cookies'
    ),
    (
      'legal.privacy.cookies.p1',
      'legal',
      'Privacy paragraph',
      'Sistēmā izmantojam obligātās sīkdatnes, kas nepieciešamas pieslēgšanās un drošības nodrošināšanai, kā arī neobligātās sīkdatnes, kurām lūdzam tavu piekrišanu. Pilns saraksts un piekrišanas pārvaldība ir aprakstīta sīkdatņu politikā.',
      'The system uses strictly necessary cookies required for sign-in and security, and optional cookies for which we ask your consent. The full list and consent management are described in the cookie policy.'
    ),
    (
      'legal.privacy.recipients.title',
      'legal',
      'Privacy section title',
      '5. Datu saņēmēji un apstrādātāji',
      '5. Recipients and processors'
    ),
    (
      'legal.privacy.recipients.p1',
      'legal',
      'Privacy paragraph',
      'Datus apstrādā tikai pilnvaroti lietotāji tavā organizācijā atbilstoši piešķirtajām tiesībām, kā arī mūsu piesaistītie IT pakalpojumu sniedzēji, kas darbojas uz datu apstrādes līguma pamata.',
      'Data is processed only by authorised users in your organisation according to their permissions, and by our IT service providers acting under a data processing agreement.'
    ),
    (
      'legal.privacy.recipients.p2',
      'legal',
      'Privacy paragraph',
      'Galvenie apstrādātāji ir mākoņinfrastruktūras un datubāzes pakalpojuma sniedzējs (Supabase), lietotņu mitināšanas pakalpojuma sniedzējs un Google kā pieslēgšanās identitātes nodrošinātājs.',
      'The main processors are our cloud infrastructure and database provider (Supabase), our application hosting provider and Google as the sign-in identity provider.'
    ),
    (
      'legal.privacy.recipients.p3',
      'legal',
      'Privacy paragraph',
      'Datus nepārdodam un nenododam trešajām personām mārketinga nolūkiem.',
      'We do not sell your data and do not share it with third parties for marketing purposes.'
    ),
    (
      'legal.privacy.transfers.title',
      'legal',
      'Privacy section title',
      '6. Datu nodošana ārpus EEZ',
      '6. Transfers outside the EEA'
    ),
    (
      'legal.privacy.transfers.p1',
      'legal',
      'Privacy paragraph',
      'Datus primāri glabājam Eiropas Savienībā. Ja atsevišķos gadījumos dati tiek nodoti ārpus Eiropas Ekonomikas zonas, to darām, balstoties uz Eiropas Komisijas lēmumu par aizsardzības līmeņa pietiekamību vai Eiropas Komisijas apstiprinātajām standarta līguma klauzulām.',
      'Data is primarily stored in the European Union. Where data is transferred outside the European Economic Area, we rely on an adequacy decision of the European Commission or on the standard contractual clauses approved by the European Commission.'
    ),
    (
      'legal.privacy.retention.title',
      'legal',
      'Privacy section title',
      '7. Glabāšanas termiņi',
      '7. Retention periods'
    ),
    (
      'legal.privacy.retention.p1',
      'legal',
      'Privacy paragraph',
      'Konta un darba datus glabājam, kamēr ir aktīvs konts vai līgums ar tavu organizāciju. Pēc konta slēgšanas datus dzēšam vai anonimizējam saprātīgā termiņā, ja vien normatīvie akti neparedz ilgāku glabāšanu.',
      'Account and work data is retained while the account or the contract with your organisation is active. After the account is closed we delete or anonymise the data within a reasonable period, unless law requires longer retention.'
    ),
    (
      'legal.privacy.retention.p2',
      'legal',
      'Privacy paragraph',
      'Tehniskos žurnālus glabājam līdz 12 mēnešiem, bet sīkdatņu piekrišanas ierakstu — līdz 6 mēnešiem, pēc tam lūdzam piekrišanu atkārtoti.',
      'Technical logs are kept for up to 12 months, and the cookie consent record for up to 6 months, after which we ask for consent again.'
    ),
    (
      'legal.privacy.rights.title',
      'legal',
      'Privacy section title',
      '8. Tavas tiesības',
      '8. Your rights'
    ),
    (
      'legal.privacy.rights.p1',
      'legal',
      'Privacy paragraph',
      'Tev ir tiesības piekļūt saviem datiem, labot neprecīzus datus, pieprasīt dzēšanu vai apstrādes ierobežošanu, iebilst pret apstrādi, kas balstīta uz leģitīmām interesēm, kā arī saņemt datus strukturētā, mašīnlasāmā formātā (datu pārnesamība).',
      'You have the right to access your data, to rectify inaccurate data, to request erasure or restriction of processing, to object to processing based on legitimate interests, and to receive your data in a structured, machine-readable format (data portability).'
    ),
    (
      'legal.privacy.rights.p2',
      'legal',
      'Privacy paragraph',
      'Ja apstrāde balstās uz piekrišanu, to vari atsaukt jebkurā laikā, neietekmējot pirms atsaukšanas veiktās apstrādes likumību. Sīkdatņu piekrišanu vari mainīt, izmantojot saiti “Sīkdatņu iestatījumi” lapas kājenē.',
      'Where processing is based on consent, you can withdraw it at any time without affecting the lawfulness of processing carried out before the withdrawal. You can change your cookie consent using the "Cookie settings" link in the page footer.'
    ),
    (
      'legal.privacy.rights.p3',
      'legal',
      'Privacy paragraph',
      'Lai izmantotu savas tiesības, raksti uz norādīto pārziņa e-pasta adresi. Uz pieprasījumu atbildēsim viena mēneša laikā. Ja uzskati, ka tavas tiesības ir pārkāptas, vari iesniegt sūdzību uzraudzības iestādei.',
      'To exercise your rights, write to the controller email address provided. We will respond within one month. If you believe your rights have been infringed, you can lodge a complaint with the supervisory authority.'
    ),
    (
      'legal.privacy.security.title',
      'legal',
      'Privacy section title',
      '9. Drošība',
      '9. Security'
    ),
    (
      'legal.privacy.security.p1',
      'legal',
      'Privacy paragraph',
      'Izmantojam šifrētu datu pārraidi, piekļuves kontroli pēc lietotāju grupām un tiesībām, datubāzes līmeņa piekļuves ierobežojumus un regulāras drošības pārbaudes. Par personas datu aizsardzības pārkāpumu, kas rada augstu risku, informēsim tevi un uzraudzības iestādi normatīvajos aktos noteiktajā termiņā.',
      'We use encrypted data transmission, access control based on user groups and permissions, database-level access restrictions and regular security checks. In the event of a personal data breach that poses a high risk, we will notify you and the supervisory authority within the period required by law.'
    ),
    (
      'legal.privacy.automated.title',
      'legal',
      'Privacy section title',
      '10. Automatizēta lēmumu pieņemšana',
      '10. Automated decision-making'
    ),
    (
      'legal.privacy.automated.p1',
      'legal',
      'Privacy paragraph',
      'Neveicam automatizētu lēmumu pieņemšanu vai profilēšanu, kas tev radītu juridiskas sekas vai citādi būtiski tevi ietekmētu.',
      'We do not carry out automated decision-making or profiling that would produce legal effects concerning you or otherwise significantly affect you.'
    ),
    (
      'legal.privacy.changes.title',
      'legal',
      'Privacy section title',
      '11. Politikas izmaiņas',
      '11. Changes to this policy'
    ),
    (
      'legal.privacy.changes.p1',
      'legal',
      'Privacy paragraph',
      'Politiku varam laika gaitā precizēt. Par būtiskām izmaiņām informēsim sistēmā vai pa e-pastu. Šīs lapas augšpusē vienmēr ir norādīts pēdējās atjaunināšanas datums.',
      'We may update this policy over time. We will notify you of material changes in the system or by email. The date of the latest update is always shown at the top of this page.'
    ),
    (
      'legal.privacy.contact.title',
      'legal',
      'Privacy section title',
      '12. Kontakti',
      '12. Contact'
    ),
    (
      'legal.privacy.contact.p1',
      'legal',
      'Privacy paragraph',
      'Jautājumus par privātumu un datu apstrādi sūti uz pārziņa e-pasta adresi, kas norādīta šīs lapas pārziņa sadaļā.',
      'Send questions about privacy and data processing to the controller email address listed in the controller section of this page.'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();

-- Lietošanas noteikumi
with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'legal.terms.title',
      'legal',
      'Terms of service title',
      'Lietošanas noteikumi',
      'Terms of service'
    ),
    (
      'legal.terms.intro',
      'legal',
      'Terms intro',
      'Šie lietošanas noteikumi nosaka kārtību, kādā vari izmantot sistēmu {systemName}. Izveidojot kontu vai pieslēdzoties sistēmai, tu apliecini, ka esi izlasījis un piekrīti šiem noteikumiem.',
      'These terms of service set out how you may use {systemName}. By creating an account or signing in you confirm that you have read and accept these terms.'
    ),
    (
      'legal.terms.scope.title',
      'legal',
      'Terms section title',
      '1. Piemērošanas joma',
      '1. Scope'
    ),
    (
      'legal.terms.scope.p1',
      'legal',
      'Terms paragraph',
      'Noteikumi attiecas uz visiem sistēmas lietotājiem. Ja izmanto sistēmu uzņēmuma vārdā, tu apliecini, ka esi pilnvarots uzņemties šos noteikumus uzņēmuma vārdā.',
      'These terms apply to all users of the system. If you use the system on behalf of a company, you confirm that you are authorised to accept these terms on its behalf.'
    ),
    (
      'legal.terms.scope.p2',
      'legal',
      'Terms paragraph',
      'Ja starp pakalpojuma sniedzēju un tavu uzņēmumu ir noslēgts atsevišķs līgums, pretrunu gadījumā noteicošais ir šis līgums.',
      'If a separate agreement has been concluded between the service provider and your company, that agreement prevails in the event of a conflict.'
    ),
    (
      'legal.terms.service.title',
      'legal',
      'Terms section title',
      '2. Pakalpojuma apraksts',
      '2. Description of the service'
    ),
    (
      'legal.terms.service.p1',
      'legal',
      'Terms paragraph',
      'Sistēma ir tīmekļa rīks būvniecības tāmju, materiālu, cenu un darbu grafiku veidošanai un pārvaldīšanai. Funkcionalitātes apjoms var atšķirties atkarībā no lietotājam piešķirtajām tiesībām un ieslēgtajiem moduļiem.',
      'The system is a web tool for creating and managing construction estimates, materials, prices and work schedules. Available functionality may differ depending on your permissions and the modules that are enabled.'
    ),
    (
      'legal.terms.service.p2',
      'legal',
      'Terms paragraph',
      'Sistēmā veiktie aprēķini ir palīglīdzeklis. Par galīgo tāmju, cenu un piedāvājumu pareizību atbild lietotājs.',
      'Calculations made in the system are a supporting tool. The user is responsible for the correctness of final estimates, prices and offers.'
    ),
    (
      'legal.terms.account.title',
      'legal',
      'Terms section title',
      '3. Konts un piekļuve',
      '3. Account and access'
    ),
    (
      'legal.terms.account.p1',
      'legal',
      'Terms paragraph',
      'Pieslēgšanās notiek, izmantojot Google kontu. Tu atbildi par savas pieslēgšanās informācijas drošību un par visām darbībām, kas veiktas ar tavu kontu.',
      'Sign-in is performed using a Google account. You are responsible for keeping your sign-in credentials secure and for all activity carried out under your account.'
    ),
    (
      'legal.terms.account.p2',
      'legal',
      'Terms paragraph',
      'Par aizdomām par nesankcionētu piekļuvi nekavējoties jāinformē pakalpojuma sniedzējs. Mums ir tiesības apturēt piekļuvi kontam, ja tas nepieciešams drošības apsvērumu dēļ vai noteikumu pārkāpuma gadījumā.',
      'You must notify the service provider immediately if you suspect unauthorised access. We may suspend access to an account where necessary for security reasons or in the event of a breach of these terms.'
    ),
    (
      'legal.terms.acceptable_use.title',
      'legal',
      'Terms section title',
      '4. Atļautā lietošana',
      '4. Acceptable use'
    ),
    (
      'legal.terms.acceptable_use.p1',
      'legal',
      'Terms paragraph',
      'Sistēmu drīkst izmantot tikai likumīgiem mērķiem. Aizliegts apiet piekļuves kontroli, veikt drošības testus bez saskaņojuma, ievadīt ļaunatūru, veikt automatizētu datu izgūšanu vai radīt nesamērīgu slodzi sistēmai.',
      'The system may be used for lawful purposes only. You must not bypass access controls, run security tests without prior approval, upload malware, scrape data automatically or place a disproportionate load on the system.'
    ),
    (
      'legal.terms.acceptable_use.p2',
      'legal',
      'Terms paragraph',
      'Aizliegts ievadīt saturu, kas pārkāpj trešo personu tiesības vai normatīvos aktus, kā arī sensitīvas personas datu kategorijas, ja tas nav nepieciešams pakalpojuma sniegšanai.',
      'You must not enter content that infringes third party rights or applicable law, nor special categories of personal data unless this is necessary for providing the service.'
    ),
    (
      'legal.terms.customer_data.title',
      'legal',
      'Terms section title',
      '5. Klienta dati',
      '5. Customer data'
    ),
    (
      'legal.terms.customer_data.p1',
      'legal',
      'Terms paragraph',
      'Dati, ko tu vai tava organizācija ievada sistēmā, paliek jūsu īpašumā. Mēs tos izmantojam tikai, lai sniegtu pakalpojumu, nodrošinātu tā drošību un izpildītu normatīvās prasības.',
      'Data that you or your organisation enter into the system remains yours. We use it only to provide the service, keep it secure and comply with statutory requirements.'
    ),
    (
      'legal.terms.customer_data.p2',
      'legal',
      'Terms paragraph',
      'Tu atbildi par ievadīto datu precizitāti un par to, ka tev ir tiesības šos datus apstrādāt sistēmā.',
      'You are responsible for the accuracy of the data you enter and for having the right to process that data in the system.'
    ),
    (
      'legal.terms.ip.title',
      'legal',
      'Terms section title',
      '6. Intelektuālais īpašums',
      '6. Intellectual property'
    ),
    (
      'legal.terms.ip.p1',
      'legal',
      'Terms paragraph',
      'Sistēma, tās pirmkods, dizains un dokumentācija ir pakalpojuma sniedzēja intelektuālais īpašums. Tev tiek piešķirtas neekskluzīvas, nenododamas tiesības izmantot sistēmu tās paredzētajam mērķim šo noteikumu spēkā esamības laikā.',
      'The system, its source code, design and documentation are the intellectual property of the service provider. You are granted a non-exclusive, non-transferable right to use the system for its intended purpose while these terms are in force.'
    ),
    (
      'legal.terms.availability.title',
      'legal',
      'Terms section title',
      '7. Pieejamība un atbalsts',
      '7. Availability and support'
    ),
    (
      'legal.terms.availability.p1',
      'legal',
      'Terms paragraph',
      'Cenšamies nodrošināt nepārtrauktu pakalpojuma pieejamību, taču negarantējam, ka sistēma darbosies bez pārtraukumiem. Plānotos uzturēšanas darbus, ja iespējams, veicam ārpus darba laika un par tiem informējam iepriekš.',
      'We aim to keep the service continuously available but do not guarantee uninterrupted operation. Where possible, planned maintenance is carried out outside business hours and announced in advance.'
    ),
    (
      'legal.terms.availability.p2',
      'legal',
      'Terms paragraph',
      'Mums ir tiesības attīstīt un mainīt sistēmas funkcionalitāti. Par būtiskām izmaiņām, kas samazina funkcionalitātes apjomu, informēsim iepriekš.',
      'We may develop and change the functionality of the system. We will give advance notice of material changes that reduce the scope of functionality.'
    ),
    (
      'legal.terms.fees.title',
      'legal',
      'Terms section title',
      '8. Maksa par pakalpojumu',
      '8. Fees'
    ),
    (
      'legal.terms.fees.p1',
      'legal',
      'Terms paragraph',
      'Ja pakalpojums ir maksas, maksa, norēķinu periods un apmaksas kārtība tiek noteikta atsevišķā līgumā vai pasūtījumā. Nokavētu maksājumu gadījumā mums ir tiesības ierobežot piekļuvi pēc iepriekšēja brīdinājuma.',
      'Where the service is paid, the fee, billing period and payment terms are set out in a separate agreement or order. In the event of overdue payment we may restrict access after prior warning.'
    ),
    (
      'legal.terms.liability.title',
      'legal',
      'Terms section title',
      '9. Atbildība',
      '9. Liability'
    ),
    (
      'legal.terms.liability.p1',
      'legal',
      'Terms paragraph',
      'Pakalpojuma sniedzējs atbild par tiešiem zaudējumiem, kas radušies tā vainas dēļ, normatīvajos aktos noteiktajā apjomā. Netiek ierobežota atbildība par tīšu rīcību, rupju neuzmanību vai personas dzīvības un veselības aizskārumu.',
      'The service provider is liable for direct damage caused by its fault to the extent provided by law. Liability for intent, gross negligence or harm to life and health is not limited.'
    ),
    (
      'legal.terms.liability.p2',
      'legal',
      'Terms paragraph',
      'Neatbildam par netiešiem zaudējumiem, negūto peļņu vai zaudējumiem, kas radušies no lietotāja veiktiem aprēķiniem, ievadītajiem datiem vai pieņemtajiem komerciālajiem lēmumiem.',
      'We are not liable for indirect damage, lost profit or damage arising from calculations performed by the user, data entered by the user or commercial decisions taken by the user.'
    ),
    (
      'legal.terms.term.title',
      'legal',
      'Terms section title',
      '10. Darbības termiņš un izbeigšana',
      '10. Term and termination'
    ),
    (
      'legal.terms.term.p1',
      'legal',
      'Terms paragraph',
      'Noteikumi ir spēkā, kamēr izmanto sistēmu. Tu vari jebkurā laikā pārtraukt lietošanu un pieprasīt konta slēgšanu. Mēs varam izbeigt piekļuvi, ja tiek būtiski pārkāpti šie noteikumi vai beidzas līgums.',
      'These terms apply for as long as you use the system. You may stop using it at any time and request closure of your account. We may terminate access in the event of a material breach of these terms or expiry of the agreement.'
    ),
    (
      'legal.terms.confidentiality.title',
      'legal',
      'Terms section title',
      '11. Konfidencialitāte',
      '11. Confidentiality'
    ),
    (
      'legal.terms.confidentiality.p1',
      'legal',
      'Terms paragraph',
      'Puses apņemas neizpaust trešajām personām konfidenciālu informāciju, kas kļuvusi zināma sadarbības laikā, izņemot gadījumus, kad to pieprasa normatīvie akti.',
      'The parties undertake not to disclose to third parties confidential information learned during the cooperation, except where disclosure is required by law.'
    ),
    (
      'legal.terms.personal_data.title',
      'legal',
      'Terms section title',
      '12. Personas datu apstrāde',
      '12. Processing of personal data'
    ),
    (
      'legal.terms.personal_data.p1',
      'legal',
      'Terms paragraph',
      'Personas datus apstrādājam saskaņā ar privātuma politiku, kas ir šo noteikumu neatņemama sastāvdaļa. Sīkdatņu izmantošana ir aprakstīta sīkdatņu politikā.',
      'We process personal data in accordance with the privacy policy, which forms an integral part of these terms. The use of cookies is described in the cookie policy.'
    ),
    (
      'legal.terms.consumer.title',
      'legal',
      'Terms section title',
      '13. Patērētāja tiesības',
      '13. Consumer rights'
    ),
    (
      'legal.terms.consumer.p1',
      'legal',
      'Terms paragraph',
      'Ja izmanto pakalpojumu kā patērētājs, tev ir tiesības 14 dienu laikā atkāpties no distances līguma bez pamatojuma. Ja skaidri pieprasi pakalpojuma sniegšanu pirms šī termiņa beigām un pakalpojums tiek sniegts pilnībā, atteikuma tiesības izbeidzas.',
      'If you use the service as a consumer, you have the right to withdraw from the distance contract within 14 days without giving a reason. If you expressly request performance before the end of that period and the service is fully performed, the right of withdrawal ends.'
    ),
    (
      'legal.terms.consumer.p2',
      'legal',
      'Terms paragraph',
      'Strīdu gadījumā patērētājs var vērsties Patērētāju tiesību aizsardzības centrā vai izmantot Eiropas Savienības strīdu izšķiršanas platformu tiešsaistē.',
      'In the event of a dispute, a consumer may contact the Consumer Rights Protection Centre or use the online dispute resolution platform of the European Union.'
    ),
    (
      'legal.terms.law.title',
      'legal',
      'Terms section title',
      '14. Piemērojamie tiesību akti un strīdi',
      '14. Governing law and disputes'
    ),
    (
      'legal.terms.law.p1',
      'legal',
      'Terms paragraph',
      'Noteikumiem piemērojami Latvijas Republikas tiesību akti un Eiropas Savienības tiesības. Strīdus risinām pārrunu ceļā, bet, ja vienošanās netiek panākta, tos izšķir Latvijas Republikas tiesa. Patērētāja tiesības vērsties savas mītnes valsts tiesā netiek ierobežotas.',
      'These terms are governed by the laws of the Republic of Latvia and European Union law. Disputes are settled by negotiation and, failing agreement, by the courts of the Republic of Latvia. A consumer right to bring proceedings in the courts of their country of residence is not limited.'
    ),
    (
      'legal.terms.changes.title',
      'legal',
      'Terms section title',
      '15. Noteikumu izmaiņas',
      '15. Changes to these terms'
    ),
    (
      'legal.terms.changes.p1',
      'legal',
      'Terms paragraph',
      'Noteikumus varam grozīt. Par būtiskām izmaiņām informēsim vismaz 30 dienas iepriekš sistēmā vai pa e-pastu. Ja turpini lietot sistēmu pēc izmaiņu spēkā stāšanās, uzskatām, ka tām piekrīti.',
      'We may amend these terms. We will give at least 30 days notice of material changes in the system or by email. If you continue to use the system after the changes take effect, you are deemed to accept them.'
    ),
    (
      'legal.terms.contact.title',
      'legal',
      'Terms section title',
      '16. Kontakti',
      '16. Contact'
    ),
    (
      'legal.terms.contact.p1',
      'legal',
      'Terms paragraph',
      'Jautājumus par noteikumiem sūti uz pakalpojuma sniedzēja e-pasta adresi, kas norādīta privātuma politikas pārziņa sadaļā.',
      'Send questions about these terms to the service provider email address listed in the controller section of the privacy policy.'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();

-- Sīkdatņu politika
with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'legal.cookies.title',
      'legal',
      'Cookie policy title',
      'Sīkdatņu politika',
      'Cookie policy'
    ),
    (
      'legal.cookies.intro',
      'legal',
      'Cookie policy intro',
      'Šī politika skaidro, kādas sīkdatnes un līdzīgas tehnoloģijas izmanto sistēma {systemName}, kāpēc tās ir vajadzīgas un kā vari pārvaldīt savu piekrišanu.',
      'This policy explains which cookies and similar technologies {systemName} uses, why they are needed and how you can manage your consent.'
    ),
    (
      'legal.cookies.what.title',
      'legal',
      'Cookie section title',
      '1. Kas ir sīkdatnes',
      '1. What cookies are'
    ),
    (
      'legal.cookies.what.p1',
      'legal',
      'Cookie paragraph',
      'Sīkdatnes ir nelieli teksta faili, ko tīmekļa vietne saglabā tavā ierīcē. Tās ļauj atcerēties, ka esi pieslēdzies, saglabāt izvēlēto valodu un citas izvēles. Līdzīgi darbojas arī pārlūka lokālā krātuve (local storage).',
      'Cookies are small text files that a website stores on your device. They make it possible to remember that you are signed in, to keep your chosen language and other choices. Browser local storage works in a similar way.'
    ),
    (
      'legal.cookies.legal_basis.title',
      'legal',
      'Cookie section title',
      '2. Juridiskais pamats',
      '2. Legal basis'
    ),
    (
      'legal.cookies.legal_basis.p1',
      'legal',
      'Cookie paragraph',
      'Obligātās sīkdatnes izmantojam bez piekrišanas, jo tās ir tehniski nepieciešamas, lai nodrošinātu tavu pieprasīto pakalpojumu. Visas pārējās sīkdatnes izmantojam tikai pēc tam, kad esi devis skaidru piekrišanu (ePrivacy direktīva 2002/58/EK un VDAR 6. panta 1. punkta a) apakšpunkts).',
      'Strictly necessary cookies are used without consent because they are technically required to deliver the service you requested. All other cookies are used only after you have given explicit consent (ePrivacy Directive 2002/58/EC and GDPR Article 6(1)(a)).'
    ),
    (
      'legal.cookies.legal_basis.p2',
      'legal',
      'Cookie paragraph',
      'Neobligātās sīkdatnes pēc noklusējuma ir izslēgtas. Atteikšanās neietekmē sistēmas pamatfunkcionalitāti, tikai ērtības.',
      'Optional cookies are switched off by default. Refusing them does not affect core functionality, only convenience.'
    ),
    (
      'legal.cookies.categories.title',
      'legal',
      'Cookie section title',
      '3. Sīkdatņu kategorijas',
      '3. Cookie categories'
    ),
    (
      'legal.cookies.categories.p1',
      'legal',
      'Cookie paragraph',
      'Obligātās sīkdatnes nodrošina pieslēgšanos, drošību, izvēlēto valodu un tavas piekrišanas saglabāšanu. Preferenču sīkdatnes atceras saskarnes izvēles. Statistikas un mārketinga sīkdatnes šobrīd sistēmā netiek izmantotas, bet kategorijas ir pieejamas, lai varētu tās ieslēgt tikai ar tavu piekrišanu.',
      'Strictly necessary cookies handle sign-in, security, the chosen language and storing your consent. Preference cookies remember interface choices. Statistics and marketing cookies are not currently used in the system, but the categories are available so that they could only ever be enabled with your consent.'
    ),
    (
      'legal.cookies.categories.p2',
      'legal',
      'Cookie paragraph',
      'Zemāk redzams pilns saraksts ar sīkdatnēm, ko sistēma var saglabāt tavā ierīcē.',
      'Below is the full list of cookies that the system may store on your device.'
    ),
    (
      'legal.cookies.manage.title',
      'legal',
      'Cookie section title',
      '4. Kā pārvaldīt piekrišanu',
      '4. Managing your consent'
    ),
    (
      'legal.cookies.manage.p1',
      'legal',
      'Cookie paragraph',
      'Piekrišanu vari mainīt vai atsaukt jebkurā laikā, izmantojot saiti “Sīkdatņu iestatījumi” lapas kājenē. Ja atsauc preferenču sīkdatņu piekrišanu, jau saglabātās preferenču sīkdatnes tiek nekavējoties izdzēstas no tavas ierīces.',
      'You can change or withdraw your consent at any time using the "Cookie settings" link in the page footer. If you withdraw consent for preference cookies, any preference cookies already stored are deleted from your device immediately.'
    ),
    (
      'legal.cookies.manage.p2',
      'legal',
      'Cookie paragraph',
      'Piekrišanas ierakstu glabājam līdz 6 mēnešiem, pēc tam paziņojums parādīsies atkārtoti.',
      'The consent record is stored for up to 6 months, after which the banner is shown again.'
    ),
    (
      'legal.cookies.browser.title',
      'legal',
      'Cookie section title',
      '5. Pārlūka iestatījumi',
      '5. Browser settings'
    ),
    (
      'legal.cookies.browser.p1',
      'legal',
      'Cookie paragraph',
      'Sīkdatnes vari dzēst vai bloķēt arī pārlūka iestatījumos. Ņem vērā, ka, bloķējot obligātās sīkdatnes, pieslēgšanās sistēmai vairs nedarbosies.',
      'You can also delete or block cookies in your browser settings. Note that blocking strictly necessary cookies will prevent you from signing in.'
    ),
    (
      'legal.cookies.third_party.title',
      'legal',
      'Cookie section title',
      '6. Trešo pušu sīkdatnes',
      '6. Third party cookies'
    ),
    (
      'legal.cookies.third_party.p1',
      'legal',
      'Cookie paragraph',
      'Pieslēgšanās notiek ar Google konta palīdzību, tāpēc pieslēgšanās brīdī Google var saglabāt savas sīkdatnes atbilstoši Google privātuma politikai. Citus trešo pušu izsekošanas rīkus neizmantojam.',
      'Sign-in uses a Google account, so during sign-in Google may set its own cookies in line with the Google privacy policy. We do not use any other third party tracking tools.'
    ),
    (
      'legal.cookies.changes.title',
      'legal',
      'Cookie section title',
      '7. Politikas izmaiņas',
      '7. Changes to this policy'
    ),
    (
      'legal.cookies.changes.p1',
      'legal',
      'Cookie paragraph',
      'Ja mainām izmantoto sīkdatņu sarakstu vai kategorijas, atjaunināsim šo politiku un lūgsim piekrišanu atkārtoti.',
      'If we change the list of cookies or the categories we use, we will update this policy and ask for your consent again.'
    ),

    -- Sīkdatņu tabula
    (
      'legal.cookies.table.name',
      'legal',
      'Cookie table column',
      'Nosaukums',
      'Name'
    ),
    (
      'legal.cookies.table.category',
      'legal',
      'Cookie table column',
      'Kategorija',
      'Category'
    ),
    (
      'legal.cookies.table.purpose',
      'legal',
      'Cookie table column',
      'Mērķis',
      'Purpose'
    ),
    (
      'legal.cookies.table.retention',
      'legal',
      'Cookie table column',
      'Glabāšanas laiks',
      'Retention'
    ),
    (
      'legal.cookies.table.auth_token.purpose',
      'legal',
      'Cookie purpose',
      'Uztur pieslēgšanās sesiju, lai nebūtu jāpieslēdzas atkārtoti katrā lapā.',
      'Keeps your sign-in session so you do not have to sign in on every page.'
    ),
    (
      'legal.cookies.table.auth_token.retention',
      'legal',
      'Cookie retention',
      'Līdz izrakstīšanās brīdim vai sesijas beigām',
      'Until sign-out or session expiry'
    ),
    (
      'legal.cookies.table.code_verifier.purpose',
      'legal',
      'Cookie purpose',
      'Nodrošina drošu Google pieslēgšanās plūsmu (OAuth PKCE pārbaude).',
      'Secures the Google sign-in flow (OAuth PKCE verification).'
    ),
    (
      'legal.cookies.table.code_verifier.retention',
      'legal',
      'Cookie retention',
      'Tikai pieslēgšanās laikā',
      'Only during sign-in'
    ),
    (
      'legal.cookies.table.consent.purpose',
      'legal',
      'Cookie purpose',
      'Saglabā tavu izvēli par sīkdatņu kategorijām, lai paziņojums netiktu rādīts atkārtoti.',
      'Stores your cookie category choice so the banner is not shown again.'
    ),
    (
      'legal.cookies.table.consent.retention',
      'legal',
      'Cookie retention',
      '6 mēneši',
      '6 months'
    ),
    (
      'legal.cookies.table.language.purpose',
      'legal',
      'Cookie purpose',
      'Atceras tavu izvēlēto saskarnes valodu pirms pieslēgšanās.',
      'Remembers the interface language you selected before signing in.'
    ),
    (
      'legal.cookies.table.language.retention',
      'legal',
      'Cookie retention',
      '12 mēneši',
      '12 months'
    ),
    (
      'legal.cookies.table.sidebar.purpose',
      'legal',
      'Cookie purpose',
      'Atceras, vai kreisā navigācijas josla ir sakļauta.',
      'Remembers whether the left navigation sidebar is collapsed.'
    ),
    (
      'legal.cookies.table.sidebar.retention',
      'legal',
      'Cookie retention',
      '12 mēneši',
      '12 months'
    ),
    (
      'legal.cookies.table.estimate_collapsed.purpose',
      'legal',
      'Cookie purpose',
      'Atceras, kuras tāmes kategorijas un apakškategorijas ir sakļautas.',
      'Remembers which estimate categories and subcategories are collapsed.'
    ),
    (
      'legal.cookies.table.estimate_collapsed.retention',
      'legal',
      'Cookie retention',
      '12 mēneši',
      '12 months'
    ),
    (
      'legal.cookies.table.materials_banner.purpose',
      'legal',
      'Cookie purpose',
      'Atceras, vai piešķirto materiālu paziņojumu josla ir sakļauta.',
      'Remembers whether the assigned materials notice bar is collapsed.'
    ),
    (
      'legal.cookies.table.materials_banner.retention',
      'legal',
      'Cookie retention',
      '12 mēneši',
      '12 months'
    ),
    (
      'legal.cookies.table.todo_storage.purpose',
      'legal',
      'Local storage purpose',
      'Glabā sistēmas administratora uzdevumu saraksta saturu tavā pārlūkā. Nepieciešams, lai attiecīgā funkcija darbotos.',
      'Stores the content of the system administrator task board in your browser. Required for that feature to work.'
    ),
    (
      'legal.cookies.table.todo_storage.retention',
      'legal',
      'Local storage retention',
      'Līdz pārlūka datu notīrīšanai',
      'Until you clear browser data'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();
