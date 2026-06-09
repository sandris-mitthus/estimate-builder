import { CompanySettingsForm } from "@/app/components/company-settings-form";
import { SectionPage } from "@/app/components/section-page";
import { getCompanySettings } from "@/app/lib/settings/repository";

export default async function SettingsPage() {
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
