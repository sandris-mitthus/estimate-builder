import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type LegalDocumentContent = {
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
};

export type LegalControllerDetails = {
  name: string;
  registrationNumber: string;
  address: string;
  email: string;
  supervisoryAuthority: string;
};

type SectionSpec = {
  id: string;
  titleKey: string;
  titleFallback: string;
  paragraphs: { key: string; fallback: string }[];
};

function buildSections(t: Translate, specs: SectionSpec[]): LegalSection[] {
  return specs.map((spec) => ({
    id: spec.id,
    title: t(spec.titleKey, spec.titleFallback),
    paragraphs: spec.paragraphs.map((paragraph) =>
      t(paragraph.key, paragraph.fallback),
    ),
  }));
}

export function getLegalUpdatedAt(t: Translate): string {
  return t("legal.common.updated_at", "05.08.2026");
}

export type LegalControllerSettings = {
  systemName: string;
  controllerName: string;
  controllerRegistrationNumber: string;
  controllerAddress: string;
  controllerEmail: string;
};

export function getLegalControllerDetails(
  t: Translate,
  settings: LegalControllerSettings,
): LegalControllerDetails {
  const notProvided = t("legal.controller.not_configured", "Nav norādīts");
  const orNotProvided = (value: string) => value.trim() || notProvided;

  return {
    name: settings.controllerName.trim() || settings.systemName,
    registrationNumber: orNotProvided(settings.controllerRegistrationNumber),
    address: orNotProvided(settings.controllerAddress),
    email: orNotProvided(settings.controllerEmail),
    supervisoryAuthority: t(
      "legal.common.supervisory_authority",
      "Datu valsts inspekcija (www.dvi.gov.lv)",
    ),
  };
}

export function getPrivacyPolicyContent(
  t: Translate,
  systemName: string,
): LegalDocumentContent {
  return {
    title: t("legal.privacy.title", "Privātuma politika"),
    updatedAt: getLegalUpdatedAt(t),
    intro: t(
      "legal.privacy.intro",
      "Šajā privātuma politikā skaidrojam, kādus personas datus apstrādājam, kad izmanto sistēmu {systemName}, kāpēc to darām un kādas ir tavas tiesības saskaņā ar Vispārīgo datu aizsardzības regulu (ES) 2016/679 (VDAR).",
      { systemName },
    ),
    sections: buildSections(t, [
      {
        id: "controller",
        titleKey: "legal.privacy.controller.title",
        titleFallback: "1. Datu pārzinis",
        paragraphs: [
          {
            key: "legal.privacy.controller.p1",
            fallback:
              "Par personas datu apstrādi sistēmā atbild datu pārzinis, kura rekvizīti norādīti šīs lapas sadaļā ar pārziņa informāciju. Ar pārzini vari sazināties par jebkuru ar datu apstrādi saistītu jautājumu, izmantojot norādīto e-pasta adresi.",
          },
          {
            key: "legal.privacy.controller.p2",
            fallback:
              "Ja izmanto sistēmu sava darba devēja vai klienta uzdevumā, par tāmēs un projektos ievadītajiem datiem pārzinis var būt attiecīgais uzņēmums, bet mēs šos datus apstrādājam kā apstrādātājs uzņēmuma uzdevumā.",
          },
        ],
      },
      {
        id: "data",
        titleKey: "legal.privacy.data.title",
        titleFallback: "2. Kādus datus apstrādājam",
        paragraphs: [
          {
            key: "legal.privacy.data.p1",
            fallback:
              "Konta dati: vārds, uzvārds, e-pasta adrese, profila attēls un identifikators, ko saņemam no Google pieslēgšanās pakalpojuma, kā arī tev piešķirtā lietotāja grupa, tiesības un izvēlētā valoda.",
          },
          {
            key: "legal.privacy.data.p2",
            fallback:
              "Darba dati: uzņēmuma un projektu informācija, tāmes, pozīcijas, materiāli, cenas, darba laika plānojums un citi dati, ko tu vai tava organizācija ievada sistēmā.",
          },
          {
            key: "legal.privacy.data.p3",
            fallback:
              "Tehniskie dati: pieslēgšanās laiks, IP adrese, pārlūka un ierīces informācija, kā arī sistēmas darbības žurnāli, kas nepieciešami drošībai un kļūdu novēršanai.",
          },
          {
            key: "legal.privacy.data.p4",
            fallback:
              "Piekrišanas dati: tava izvēle par sīkdatņu kategorijām un tās veikšanas laiks.",
          },
        ],
      },
      {
        id: "purposes",
        titleKey: "legal.privacy.purposes.title",
        titleFallback: "3. Apstrādes mērķi un juridiskais pamats",
        paragraphs: [
          {
            key: "legal.privacy.purposes.p1",
            fallback:
              "Pakalpojuma sniegšana un konta pārvaldība — pamats ir līguma izpilde vai pasākumi pirms līguma noslēgšanas (VDAR 6. panta 1. punkta b) apakšpunkts).",
          },
          {
            key: "legal.privacy.purposes.p2",
            fallback:
              "Sistēmas drošība, kļūdu novēršana un ļaunprātīgas izmantošanas novēršana — pamats ir mūsu leģitīmās intereses (VDAR 6. panta 1. punkta f) apakšpunkts).",
          },
          {
            key: "legal.privacy.purposes.p3",
            fallback:
              "Neobligātās sīkdatnes un tām līdzīgas tehnoloģijas — pamats ir tava piekrišana (VDAR 6. panta 1. punkta a) apakšpunkts), kuru vari atsaukt jebkurā laikā.",
          },
          {
            key: "legal.privacy.purposes.p4",
            fallback:
              "Grāmatvedības un citu normatīvo prasību izpilde — pamats ir juridisko pienākumu izpilde (VDAR 6. panta 1. punkta c) apakšpunkts).",
          },
        ],
      },
      {
        id: "cookies",
        titleKey: "legal.privacy.cookies.title",
        titleFallback: "4. Sīkdatnes",
        paragraphs: [
          {
            key: "legal.privacy.cookies.p1",
            fallback:
              "Sistēmā izmantojam obligātās sīkdatnes, kas nepieciešamas pieslēgšanās un drošības nodrošināšanai, kā arī neobligātās sīkdatnes, kurām lūdzam tavu piekrišanu. Pilns saraksts un piekrišanas pārvaldība ir aprakstīta sīkdatņu politikā.",
          },
        ],
      },
      {
        id: "recipients",
        titleKey: "legal.privacy.recipients.title",
        titleFallback: "5. Datu saņēmēji un apstrādātāji",
        paragraphs: [
          {
            key: "legal.privacy.recipients.p1",
            fallback:
              "Datus apstrādā tikai pilnvaroti lietotāji tavā organizācijā atbilstoši piešķirtajām tiesībām, kā arī mūsu piesaistītie IT pakalpojumu sniedzēji, kas darbojas uz datu apstrādes līguma pamata.",
          },
          {
            key: "legal.privacy.recipients.p2",
            fallback:
              "Galvenie apstrādātāji ir mākoņinfrastruktūras un datubāzes pakalpojuma sniedzējs (Supabase), lietotņu mitināšanas pakalpojuma sniedzējs un Google kā pieslēgšanās identitātes nodrošinātājs.",
          },
          {
            key: "legal.privacy.recipients.p3",
            fallback:
              "Datus nepārdodam un nenododam trešajām personām mārketinga nolūkiem.",
          },
        ],
      },
      {
        id: "transfers",
        titleKey: "legal.privacy.transfers.title",
        titleFallback: "6. Datu nodošana ārpus EEZ",
        paragraphs: [
          {
            key: "legal.privacy.transfers.p1",
            fallback:
              "Datus primāri glabājam Eiropas Savienībā. Ja atsevišķos gadījumos dati tiek nodoti ārpus Eiropas Ekonomikas zonas, to darām, balstoties uz Eiropas Komisijas lēmumu par aizsardzības līmeņa pietiekamību vai Eiropas Komisijas apstiprinātajām standarta līguma klauzulām.",
          },
        ],
      },
      {
        id: "retention",
        titleKey: "legal.privacy.retention.title",
        titleFallback: "7. Glabāšanas termiņi",
        paragraphs: [
          {
            key: "legal.privacy.retention.p1",
            fallback:
              "Konta un darba datus glabājam, kamēr ir aktīvs konts vai līgums ar tavu organizāciju. Pēc konta slēgšanas datus dzēšam vai anonimizējam saprātīgā termiņā, ja vien normatīvie akti neparedz ilgāku glabāšanu.",
          },
          {
            key: "legal.privacy.retention.p2",
            fallback:
              "Tehniskos žurnālus glabājam līdz 12 mēnešiem, bet sīkdatņu piekrišanas ierakstu — līdz 6 mēnešiem, pēc tam lūdzam piekrišanu atkārtoti.",
          },
        ],
      },
      {
        id: "rights",
        titleKey: "legal.privacy.rights.title",
        titleFallback: "8. Tavas tiesības",
        paragraphs: [
          {
            key: "legal.privacy.rights.p1",
            fallback:
              "Tev ir tiesības piekļūt saviem datiem, labot neprecīzus datus, pieprasīt dzēšanu vai apstrādes ierobežošanu, iebilst pret apstrādi, kas balstīta uz leģitīmām interesēm, kā arī saņemt datus strukturētā, mašīnlasāmā formātā (datu pārnesamība).",
          },
          {
            key: "legal.privacy.rights.p2",
            fallback:
              "Ja apstrāde balstās uz piekrišanu, to vari atsaukt jebkurā laikā, neietekmējot pirms atsaukšanas veiktās apstrādes likumību. Sīkdatņu piekrišanu vari mainīt, izmantojot saiti “Sīkdatņu iestatījumi” lapas kājenē.",
          },
          {
            key: "legal.privacy.rights.p3",
            fallback:
              "Lai izmantotu savas tiesības, raksti uz norādīto pārziņa e-pasta adresi. Uz pieprasījumu atbildēsim viena mēneša laikā. Ja uzskati, ka tavas tiesības ir pārkāptas, vari iesniegt sūdzību uzraudzības iestādei.",
          },
        ],
      },
      {
        id: "security",
        titleKey: "legal.privacy.security.title",
        titleFallback: "9. Drošība",
        paragraphs: [
          {
            key: "legal.privacy.security.p1",
            fallback:
              "Izmantojam šifrētu datu pārraidi, piekļuves kontroli pēc lietotāju grupām un tiesībām, datubāzes līmeņa piekļuves ierobežojumus un regulāras drošības pārbaudes. Par personas datu aizsardzības pārkāpumu, kas rada augstu risku, informēsim tevi un uzraudzības iestādi normatīvajos aktos noteiktajā termiņā.",
          },
        ],
      },
      {
        id: "automated",
        titleKey: "legal.privacy.automated.title",
        titleFallback: "10. Automatizēta lēmumu pieņemšana",
        paragraphs: [
          {
            key: "legal.privacy.automated.p1",
            fallback:
              "Neveicam automatizētu lēmumu pieņemšanu vai profilēšanu, kas tev radītu juridiskas sekas vai citādi būtiski tevi ietekmētu.",
          },
        ],
      },
      {
        id: "changes",
        titleKey: "legal.privacy.changes.title",
        titleFallback: "11. Politikas izmaiņas",
        paragraphs: [
          {
            key: "legal.privacy.changes.p1",
            fallback:
              "Politiku varam laika gaitā precizēt. Par būtiskām izmaiņām informēsim sistēmā vai pa e-pastu. Šīs lapas augšpusē vienmēr ir norādīts pēdējās atjaunināšanas datums.",
          },
        ],
      },
      {
        id: "contact",
        titleKey: "legal.privacy.contact.title",
        titleFallback: "12. Kontakti",
        paragraphs: [
          {
            key: "legal.privacy.contact.p1",
            fallback:
              "Jautājumus par privātumu un datu apstrādi sūti uz pārziņa e-pasta adresi, kas norādīta šīs lapas pārziņa sadaļā.",
          },
        ],
      },
    ]),
  };
}

export function getTermsContent(
  t: Translate,
  systemName: string,
): LegalDocumentContent {
  return {
    title: t("legal.terms.title", "Lietošanas noteikumi"),
    updatedAt: getLegalUpdatedAt(t),
    intro: t(
      "legal.terms.intro",
      "Šie lietošanas noteikumi nosaka kārtību, kādā vari izmantot sistēmu {systemName}. Izveidojot kontu vai pieslēdzoties sistēmai, tu apliecini, ka esi izlasījis un piekrīti šiem noteikumiem.",
      { systemName },
    ),
    sections: buildSections(t, [
      {
        id: "scope",
        titleKey: "legal.terms.scope.title",
        titleFallback: "1. Piemērošanas joma",
        paragraphs: [
          {
            key: "legal.terms.scope.p1",
            fallback:
              "Noteikumi attiecas uz visiem sistēmas lietotājiem. Ja izmanto sistēmu uzņēmuma vārdā, tu apliecini, ka esi pilnvarots uzņemties šos noteikumus uzņēmuma vārdā.",
          },
          {
            key: "legal.terms.scope.p2",
            fallback:
              "Ja starp pakalpojuma sniedzēju un tavu uzņēmumu ir noslēgts atsevišķs līgums, pretrunu gadījumā noteicošais ir šis līgums.",
          },
        ],
      },
      {
        id: "service",
        titleKey: "legal.terms.service.title",
        titleFallback: "2. Pakalpojuma apraksts",
        paragraphs: [
          {
            key: "legal.terms.service.p1",
            fallback:
              "Sistēma ir tīmekļa rīks būvniecības tāmju, materiālu, cenu un darbu grafiku veidošanai un pārvaldīšanai. Funkcionalitātes apjoms var atšķirties atkarībā no lietotājam piešķirtajām tiesībām un ieslēgtajiem moduļiem.",
          },
          {
            key: "legal.terms.service.p2",
            fallback:
              "Sistēmā veiktie aprēķini ir palīglīdzeklis. Par galīgo tāmju, cenu un piedāvājumu pareizību atbild lietotājs.",
          },
        ],
      },
      {
        id: "account",
        titleKey: "legal.terms.account.title",
        titleFallback: "3. Konts un piekļuve",
        paragraphs: [
          {
            key: "legal.terms.account.p1",
            fallback:
              "Pieslēgšanās notiek, izmantojot Google kontu. Tu atbildi par savas pieslēgšanās informācijas drošību un par visām darbībām, kas veiktas ar tavu kontu.",
          },
          {
            key: "legal.terms.account.p2",
            fallback:
              "Par aizdomām par nesankcionētu piekļuvi nekavējoties jāinformē pakalpojuma sniedzējs. Mums ir tiesības apturēt piekļuvi kontam, ja tas nepieciešams drošības apsvērumu dēļ vai noteikumu pārkāpuma gadījumā.",
          },
        ],
      },
      {
        id: "acceptable_use",
        titleKey: "legal.terms.acceptable_use.title",
        titleFallback: "4. Atļautā lietošana",
        paragraphs: [
          {
            key: "legal.terms.acceptable_use.p1",
            fallback:
              "Sistēmu drīkst izmantot tikai likumīgiem mērķiem. Aizliegts apiet piekļuves kontroli, veikt drošības testus bez saskaņojuma, ievadīt ļaunatūru, veikt automatizētu datu izgūšanu vai radīt nesamērīgu slodzi sistēmai.",
          },
          {
            key: "legal.terms.acceptable_use.p2",
            fallback:
              "Aizliegts ievadīt saturu, kas pārkāpj trešo personu tiesības vai normatīvos aktus, kā arī sensitīvas personas datu kategorijas, ja tas nav nepieciešams pakalpojuma sniegšanai.",
          },
        ],
      },
      {
        id: "customer_data",
        titleKey: "legal.terms.customer_data.title",
        titleFallback: "5. Klienta dati",
        paragraphs: [
          {
            key: "legal.terms.customer_data.p1",
            fallback:
              "Dati, ko tu vai tava organizācija ievada sistēmā, paliek jūsu īpašumā. Mēs tos izmantojam tikai, lai sniegtu pakalpojumu, nodrošinātu tā drošību un izpildītu normatīvās prasības.",
          },
          {
            key: "legal.terms.customer_data.p2",
            fallback:
              "Tu atbildi par ievadīto datu precizitāti un par to, ka tev ir tiesības šos datus apstrādāt sistēmā.",
          },
        ],
      },
      {
        id: "ip",
        titleKey: "legal.terms.ip.title",
        titleFallback: "6. Intelektuālais īpašums",
        paragraphs: [
          {
            key: "legal.terms.ip.p1",
            fallback:
              "Sistēma, tās pirmkods, dizains un dokumentācija ir pakalpojuma sniedzēja intelektuālais īpašums. Tev tiek piešķirtas neekskluzīvas, nenododamas tiesības izmantot sistēmu tās paredzētajam mērķim šo noteikumu spēkā esamības laikā.",
          },
        ],
      },
      {
        id: "availability",
        titleKey: "legal.terms.availability.title",
        titleFallback: "7. Pieejamība un atbalsts",
        paragraphs: [
          {
            key: "legal.terms.availability.p1",
            fallback:
              "Cenšamies nodrošināt nepārtrauktu pakalpojuma pieejamību, taču negarantējam, ka sistēma darbosies bez pārtraukumiem. Plānotos uzturēšanas darbus, ja iespējams, veicam ārpus darba laika un par tiem informējam iepriekš.",
          },
          {
            key: "legal.terms.availability.p2",
            fallback:
              "Mums ir tiesības attīstīt un mainīt sistēmas funkcionalitāti. Par būtiskām izmaiņām, kas samazina funkcionalitātes apjomu, informēsim iepriekš.",
          },
        ],
      },
      {
        id: "fees",
        titleKey: "legal.terms.fees.title",
        titleFallback: "8. Maksa par pakalpojumu",
        paragraphs: [
          {
            key: "legal.terms.fees.p1",
            fallback:
              "Ja pakalpojums ir maksas, maksa, norēķinu periods un apmaksas kārtība tiek noteikta atsevišķā līgumā vai pasūtījumā. Nokavētu maksājumu gadījumā mums ir tiesības ierobežot piekļuvi pēc iepriekšēja brīdinājuma.",
          },
        ],
      },
      {
        id: "liability",
        titleKey: "legal.terms.liability.title",
        titleFallback: "9. Atbildība",
        paragraphs: [
          {
            key: "legal.terms.liability.p1",
            fallback:
              "Pakalpojuma sniedzējs atbild par tiešiem zaudējumiem, kas radušies tā vainas dēļ, normatīvajos aktos noteiktajā apjomā. Netiek ierobežota atbildība par tīšu rīcību, rupju neuzmanību vai personas dzīvības un veselības aizskārumu.",
          },
          {
            key: "legal.terms.liability.p2",
            fallback:
              "Neatbildam par netiešiem zaudējumiem, negūto peļņu vai zaudējumiem, kas radušies no lietotāja veiktiem aprēķiniem, ievadītajiem datiem vai pieņemtajiem komerciālajiem lēmumiem.",
          },
        ],
      },
      {
        id: "term",
        titleKey: "legal.terms.term.title",
        titleFallback: "10. Darbības termiņš un izbeigšana",
        paragraphs: [
          {
            key: "legal.terms.term.p1",
            fallback:
              "Noteikumi ir spēkā, kamēr izmanto sistēmu. Tu vari jebkurā laikā pārtraukt lietošanu un pieprasīt konta slēgšanu. Mēs varam izbeigt piekļuvi, ja tiek būtiski pārkāpti šie noteikumi vai beidzas līgums.",
          },
        ],
      },
      {
        id: "confidentiality",
        titleKey: "legal.terms.confidentiality.title",
        titleFallback: "11. Konfidencialitāte",
        paragraphs: [
          {
            key: "legal.terms.confidentiality.p1",
            fallback:
              "Puses apņemas neizpaust trešajām personām konfidenciālu informāciju, kas kļuvusi zināma sadarbības laikā, izņemot gadījumus, kad to pieprasa normatīvie akti.",
          },
        ],
      },
      {
        id: "personal_data",
        titleKey: "legal.terms.personal_data.title",
        titleFallback: "12. Personas datu apstrāde",
        paragraphs: [
          {
            key: "legal.terms.personal_data.p1",
            fallback:
              "Personas datus apstrādājam saskaņā ar privātuma politiku, kas ir šo noteikumu neatņemama sastāvdaļa. Sīkdatņu izmantošana ir aprakstīta sīkdatņu politikā.",
          },
        ],
      },
      {
        id: "consumer",
        titleKey: "legal.terms.consumer.title",
        titleFallback: "13. Patērētāja tiesības",
        paragraphs: [
          {
            key: "legal.terms.consumer.p1",
            fallback:
              "Ja izmanto pakalpojumu kā patērētājs, tev ir tiesības 14 dienu laikā atkāpties no distances līguma bez pamatojuma. Ja skaidri pieprasi pakalpojuma sniegšanu pirms šī termiņa beigām un pakalpojums tiek sniegts pilnībā, atteikuma tiesības izbeidzas.",
          },
          {
            key: "legal.terms.consumer.p2",
            fallback:
              "Strīdu gadījumā patērētājs var vērsties Patērētāju tiesību aizsardzības centrā vai izmantot Eiropas Savienības strīdu izšķiršanas platformu tiešsaistē.",
          },
        ],
      },
      {
        id: "law",
        titleKey: "legal.terms.law.title",
        titleFallback: "14. Piemērojamie tiesību akti un strīdi",
        paragraphs: [
          {
            key: "legal.terms.law.p1",
            fallback:
              "Noteikumiem piemērojami Latvijas Republikas tiesību akti un Eiropas Savienības tiesības. Strīdus risinām pārrunu ceļā, bet, ja vienošanās netiek panākta, tos izšķir Latvijas Republikas tiesa. Patērētāja tiesības vērsties savas mītnes valsts tiesā netiek ierobežotas.",
          },
        ],
      },
      {
        id: "changes",
        titleKey: "legal.terms.changes.title",
        titleFallback: "15. Noteikumu izmaiņas",
        paragraphs: [
          {
            key: "legal.terms.changes.p1",
            fallback:
              "Noteikumus varam grozīt. Par būtiskām izmaiņām informēsim vismaz 30 dienas iepriekš sistēmā vai pa e-pastu. Ja turpini lietot sistēmu pēc izmaiņu spēkā stāšanās, uzskatām, ka tām piekrīti.",
          },
        ],
      },
      {
        id: "contact",
        titleKey: "legal.terms.contact.title",
        titleFallback: "16. Kontakti",
        paragraphs: [
          {
            key: "legal.terms.contact.p1",
            fallback:
              "Jautājumus par noteikumiem sūti uz pakalpojuma sniedzēja e-pasta adresi, kas norādīta privātuma politikas pārziņa sadaļā.",
          },
        ],
      },
    ]),
  };
}

export function getCookiePolicyContent(
  t: Translate,
  systemName: string,
): LegalDocumentContent {
  return {
    title: t("legal.cookies.title", "Sīkdatņu politika"),
    updatedAt: getLegalUpdatedAt(t),
    intro: t(
      "legal.cookies.intro",
      "Šī politika skaidro, kādas sīkdatnes un līdzīgas tehnoloģijas izmanto sistēma {systemName}, kāpēc tās ir vajadzīgas un kā vari pārvaldīt savu piekrišanu.",
      { systemName },
    ),
    sections: buildSections(t, [
      {
        id: "what",
        titleKey: "legal.cookies.what.title",
        titleFallback: "1. Kas ir sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.what.p1",
            fallback:
              "Sīkdatnes ir nelieli teksta faili, ko tīmekļa vietne saglabā tavā ierīcē. Tās ļauj atcerēties, ka esi pieslēdzies, saglabāt izvēlēto valodu un citas izvēles. Līdzīgi darbojas arī pārlūka lokālā krātuve (local storage).",
          },
        ],
      },
      {
        id: "legal_basis",
        titleKey: "legal.cookies.legal_basis.title",
        titleFallback: "2. Juridiskais pamats",
        paragraphs: [
          {
            key: "legal.cookies.legal_basis.p1",
            fallback:
              "Obligātās sīkdatnes izmantojam bez piekrišanas, jo tās ir tehniski nepieciešamas, lai nodrošinātu tavu pieprasīto pakalpojumu. Visas pārējās sīkdatnes izmantojam tikai pēc tam, kad esi devis skaidru piekrišanu (ePrivacy direktīva 2002/58/EK un VDAR 6. panta 1. punkta a) apakšpunkts).",
          },
          {
            key: "legal.cookies.legal_basis.p2",
            fallback:
              "Neobligātās sīkdatnes pēc noklusējuma ir izslēgtas. Atteikšanās neietekmē sistēmas pamatfunkcionalitāti, tikai ērtības.",
          },
        ],
      },
      {
        id: "categories",
        titleKey: "legal.cookies.categories.title",
        titleFallback: "3. Sīkdatņu kategorijas",
        paragraphs: [
          {
            key: "legal.cookies.categories.p1",
            fallback:
              "Obligātās sīkdatnes nodrošina pieslēgšanos, drošību, izvēlēto valodu un tavas piekrišanas saglabāšanu. Preferenču sīkdatnes atceras saskarnes izvēles. Statistikas un mārketinga sīkdatnes šobrīd sistēmā netiek izmantotas, bet kategorijas ir pieejamas, lai varētu tās ieslēgt tikai ar tavu piekrišanu.",
          },
          {
            key: "legal.cookies.categories.p2",
            fallback:
              "Zemāk redzams pilns saraksts ar sīkdatnēm, ko sistēma var saglabāt tavā ierīcē.",
          },
        ],
      },
      {
        id: "manage",
        titleKey: "legal.cookies.manage.title",
        titleFallback: "4. Kā pārvaldīt piekrišanu",
        paragraphs: [
          {
            key: "legal.cookies.manage.p1",
            fallback:
              "Piekrišanu vari mainīt vai atsaukt jebkurā laikā, izmantojot saiti “Sīkdatņu iestatījumi” lapas kājenē. Ja atsauc preferenču sīkdatņu piekrišanu, jau saglabātās preferenču sīkdatnes tiek nekavējoties izdzēstas no tavas ierīces.",
          },
          {
            key: "legal.cookies.manage.p2",
            fallback:
              "Piekrišanas ierakstu glabājam līdz 6 mēnešiem, pēc tam paziņojums parādīsies atkārtoti.",
          },
        ],
      },
      {
        id: "browser",
        titleKey: "legal.cookies.browser.title",
        titleFallback: "5. Pārlūka iestatījumi",
        paragraphs: [
          {
            key: "legal.cookies.browser.p1",
            fallback:
              "Sīkdatnes vari dzēst vai bloķēt arī pārlūka iestatījumos. Ņem vērā, ka, bloķējot obligātās sīkdatnes, pieslēgšanās sistēmai vairs nedarbosies.",
          },
        ],
      },
      {
        id: "third_party",
        titleKey: "legal.cookies.third_party.title",
        titleFallback: "6. Trešo pušu sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.third_party.p1",
            fallback:
              "Pieslēgšanās notiek ar Google konta palīdzību, tāpēc pieslēgšanās brīdī Google var saglabāt savas sīkdatnes atbilstoši Google privātuma politikai. Citus trešo pušu izsekošanas rīkus neizmantojam.",
          },
        ],
      },
      {
        id: "changes",
        titleKey: "legal.cookies.changes.title",
        titleFallback: "7. Politikas izmaiņas",
        paragraphs: [
          {
            key: "legal.cookies.changes.p1",
            fallback:
              "Ja mainām izmantoto sīkdatņu sarakstu vai kategorijas, atjaunināsim šo politiku un lūgsim piekrišanu atkārtoti.",
          },
        ],
      },
    ]),
  };
}
