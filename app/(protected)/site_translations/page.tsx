import { SectionPage } from "@/app/components/section-page";
import { SiteTranslationsManager } from "@/app/components/site-translations-manager";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  listSiteLanguages,
  listSiteTranslations,
} from "@/app/lib/site-admin/repository";

export default async function SiteTranslationsPage() {
  await assertSystemAdminAccess();
  const [translations, languages, { t }] = await Promise.all([
    listSiteTranslations(),
    listSiteLanguages(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_translations", "Tulkojumi")}
      subtitle={t(
        "site_translations.page.subtitle",
        "Sistēmas tulkojumu key pārskats un rediģēšana pa valodām",
      )}
    >
      <SiteTranslationsManager
        translations={translations}
        languages={languages}
      />
    </SectionPage>
  );
}
