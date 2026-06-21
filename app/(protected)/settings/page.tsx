import { CompanySettingsForm } from "@/app/components/company-settings-form";
import { SectionPage } from "@/app/components/section-page";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getCompanySettings } from "@/app/lib/settings/repository";

export default async function SettingsPage() {
  const session = await assertNavAccess("settings");
  if (!session) {
    return null;
  }

  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getCompanySettings(),
  ]);

  return (
    <SectionPage
      title={t("nav.settings", "Uzstādījumi")}
      subtitle={t(
        "settings.page.subtitle",
        "Uzņēmuma dati tāmēs un piedāvājumos",
      )}
    >
      <CompanySettingsForm initialSettings={settings} />
    </SectionPage>
  );
}
