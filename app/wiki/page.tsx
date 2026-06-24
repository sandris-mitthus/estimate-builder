import type { Metadata } from "next";
import { PublicDocsView } from "@/app/components/public-docs-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
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

  return {
    title: `${title} | ${settings.systemName}`,
    description,
    openGraph: {
      title: `${title} | ${settings.systemName}`,
      description,
    },
  };
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
          "Detalizēts ceļvedis par galvenajām sistēmas darbībām un aprēķinu loģiku.",
        ),
        navLabel: t("wiki.docs.nav.label", "Dokumentācijas sadaļas"),
        allDocsTitle: t("wiki.docs.index.title", "Dokumentācijas sadaļas"),
        allDocsSubtitle: t(
          "wiki.docs.index.subtitle",
          "Izvēlies kategoriju vai docs rakstu, lai atvērtu detalizētu saturu.",
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
