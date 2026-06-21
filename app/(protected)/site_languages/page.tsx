import { SectionPage } from "@/app/components/section-page";
import { SiteLanguagesForm } from "@/app/components/site-languages-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";

export default async function SiteLanguagesPage() {
  await assertSystemAdminAccess();
  const [languages, { t }] = await Promise.all([
    listSiteLanguages(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_languages", "Valodas")}
      subtitle={t(
        "site_languages.page.subtitle",
        "Sistēmas UI valodas un noklusējuma valodas izvēle",
      )}
    >
      <SiteLanguagesForm initialLanguages={languages} />
    </SectionPage>
  );
}
