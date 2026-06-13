import { CompanySettingsForm } from "@/app/components/company-settings-form";
import { SectionPage } from "@/app/components/section-page";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getCompanySettings } from "@/app/lib/settings/repository";

export default async function SettingsPage() {
  await assertNavAccess("settings");

  const settings = await getCompanySettings();

  return (
    <SectionPage
      title="Uzstādījumi"
      subtitle="Uzņēmuma dati tāmēs un piedāvājumos"
    >
      <CompanySettingsForm initialSettings={settings} />
    </SectionPage>
  );
}
