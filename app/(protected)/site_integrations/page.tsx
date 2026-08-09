import { SectionPage } from "@/app/components/section-page";
import { SiteIntegrationsForm } from "@/app/components/site-integrations-form";
import { getResendSettingsPublic } from "@/app/lib/email/resend-config";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { isLandingPageEnabled } from "@/app/lib/integrations/landing-page";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";

export default async function SiteIntegrationsPage() {
  await assertSystemAdminAccess();
  const [landingEnabled, resend, { t }] = await Promise.all([
    isLandingPageEnabled(),
    getResendSettingsPublic(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_integrations", "Integrācijas")}
      subtitle={t(
        "site_integrations.page.subtitle",
        "Ieslēdz, izslēdz un konfigurē sistēmas integrācijas",
      )}
    >
      <SiteIntegrationsForm
        initialLandingEnabled={landingEnabled}
        initialResend={resend}
      />
    </SectionPage>
  );
}
