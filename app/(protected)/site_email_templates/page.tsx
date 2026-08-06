import { SectionPage } from "@/app/components/section-page";
import { SiteEmailTemplatesForm } from "@/app/components/site-email-templates-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { getResendSettingsPublic } from "@/app/lib/email/resend-config";
import { listEmailTemplateDrafts } from "@/app/lib/email/templates";

export default async function SiteEmailTemplatesPage() {
  await assertSystemAdminAccess();
  const [resendSettings, languages, { t }] = await Promise.all([
    getResendSettingsPublic(),
    // All system languages (same as translations editor), not only active.
    listSiteLanguages(),
    getServerTranslations(),
  ]);
  const templates = await listEmailTemplateDrafts(languages);

  return (
    <SectionPage
      title={t("nav.system_admin.site_email_templates", "E-pasta šabloni")}
      subtitle={t(
        "site_email_templates.page.subtitle",
        "Resend integrācija un e-pastu teksti, kas tiek sūtīti lietotājiem",
      )}
    >
      <SiteEmailTemplatesForm
        initialResend={resendSettings}
        initialTemplates={templates}
        languages={languages}
      />
    </SectionPage>
  );
}
