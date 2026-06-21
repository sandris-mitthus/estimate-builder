import { SectionPage } from "@/app/components/section-page";
import { SiteSettingsForm } from "@/app/components/site-settings-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export default async function SiteSettingsPage() {
  await assertSystemAdminAccess();
  const [settings, { t }] = await Promise.all([
    getSiteSettings(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_settings", "Sistēmas uzstādījumi")}
      subtitle={t(
        "site_settings.page.subtitle",
        "Sistēmas nosaukums, slogans un head metadati",
      )}
    >
      <SiteSettingsForm initialSettings={settings} />
    </SectionPage>
  );
}
