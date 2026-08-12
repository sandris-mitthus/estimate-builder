import type { Metadata } from "next";
import { PublicDocsView } from "@/app/components/public-docs-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { publicPageSeo } from "@/app/lib/seo/public-page-metadata";
import {
  getSiteSettings,
  listSiteDocs,
} from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);

  const title = t("wiki.docs.metadata.title", "Dokumentācija");
  const description = t(
    "wiki.docs.metadata.description",
    "Detalizēta Estimate Builder dokumentācija par projektiem, tāmēm, materiālu patēriņu, eksportu un administrēšanu.",
  );

  return publicPageSeo("/docs", {
    title: `${title} | ${settings.systemName}`,
    description,
  });
}

export default async function WikiPage() {
  const [{ t }, settings, categories] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
    listSiteDocs(),
  ]);

  return (
    <PublicDocsView
      systemName={settings.systemName}
      categories={categories}
      labels={{
        backToLogin: t("wiki.docs.back_to_login", "Atpakaļ uz pieslēgšanos"),
        title: t("wiki.docs.title", "Dokumentācija"),
        subtitle: t(
          "wiki.docs.subtitle",
          "Īss ceļvedis, ko ar sistēmu var izdarīt no projekta līdz piedāvājumam.",
        ),
        navLabel: t("wiki.docs.nav.label", "Dokumentācijas sadaļas"),
        getStartedNav: t("wiki.docs.get_started.nav", "Sākt šeit"),
        getStartedEyebrow: t("wiki.docs.get_started.eyebrow", "Sākt šeit"),
        getStartedTitle: t(
          "wiki.docs.get_started.title",
          "Ko ar sistēmu var izdarīt?",
        ),
        getStartedBody1: t(
          "wiki.docs.get_started.body_1",
          "Estimate Builder ir darba vide būvniecības uzņēmumiem: vienā vietā uzturi tāmes sagatavi un cenu katalogu, no tiem ātri izveido projekta piedāvājumu un eksportē PDF vai Excel.",
        ),
        getStartedBody2: t(
          "wiki.docs.get_started.body_2",
          "Šī dokumentācija īsi izskaidro galvenās darbības. Izvēlies tēmu sānjoslā vai zemāk, lai izlasītu detalizētāku aprakstu.",
        ),
        capabilitiesTitle: t(
          "wiki.docs.capabilities.title",
          "Galvenās iespējas",
        ),
        capabilities: [
          {
            title: t(
              "wiki.docs.capabilities.projects.title",
              "Projekti un piedāvājumi",
            ),
            description: t(
              "wiki.docs.capabilities.projects.description",
              "Izveido projektu ar klienta datiem, saņem tāmi no sagataves un pielāgo konkrētajam objektam.",
            ),
          },
          {
            title: t(
              "wiki.docs.capabilities.template.title",
              "Atkārtoti lietojama sagatave",
            ),
            description: t(
              "wiki.docs.capabilities.template.description",
              "Vienreiz uzbūvē tāmes struktūru; jaunie projekti sākas no tās, nevis no tukšas tabulas.",
            ),
          },
          {
            title: t(
              "wiki.docs.capabilities.catalog.title",
              "Cenu katalogs",
            ),
            description: t(
              "wiki.docs.capabilities.catalog.description",
              "Materiālu un mehānismu cenas vienā katalogā; sistēma brīdina, kad tāmēs cenas novecojušas.",
            ),
          },
          {
            title: t(
              "wiki.docs.capabilities.modules.title",
              "Ēku moduļi",
            ),
            description: t(
              "wiki.docs.capabilities.modules.description",
              "Piesaisti daudzumus ēkas tipam un izmēriem, lai apjomi projektā atjaunotos automātiski.",
            ),
          },
          {
            title: t(
              "wiki.docs.capabilities.exports.title",
              "PDF un Excel",
            ),
            description: t(
              "wiki.docs.capabilities.exports.description",
              "Klienta PDF piedāvājums ar zīmolu un detalizēta Excel tāme iekšējai pārbaudei.",
            ),
          },
          {
            title: t(
              "wiki.docs.capabilities.delivery.title",
              "Pēc apstiprināšanas",
            ),
            description: t(
              "wiki.docs.capabilities.delivery.description",
              "Materiālu saraksts, uzdevumi, darbinieki, instrumenti un laika grafiks vienā sistēmā.",
            ),
          },
        ],
        browseTitle: t("wiki.docs.index.title", "Detalizētākas tēmas"),
        browseSubtitle: t(
          "wiki.docs.index.subtitle",
          "Izvēlies rakstu, lai uzzinātu vairāk par konkrētu darbību vai aprēķinu loģiku.",
        ),
        categoryLabel: t("wiki.docs.category.eyebrow", "Docs kategorija"),
        emptyCategory: t("wiki.docs.category.empty", "Šajā kategorijā vēl nav docs ierakstu."),
        emptyTitle: t("wiki.docs.empty.title", "Dokumentācija vēl tiek gatavota"),
        emptyDescription: t(
          "wiki.docs.empty.description",
          "Sistēmas administrators vēl nav pievienojis publiskās dokumentācijas saturu.",
        ),
        backToList: t("wiki.docs.article.back_to_list", "Atpakaļ uz docs sarakstu"),
        openArticle: t("wiki.docs.article.open", "Atvērt docs rakstu"),
      }}
    />
  );
}
