import { redirect } from "next/navigation";
import { ForgotPasswordScreen } from "@/app/components/forgot-password-screen";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getResendSettingsPublic } from "@/app/lib/email/resend-config";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { isLandingPageEnabled } from "@/app/lib/integrations/landing-page";
import { getSiteSettings, listSiteLanguages } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const [
    user,
    siteSettings,
    resendSettings,
    landingEnabled,
    languages,
    { languageCode },
  ] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getResendSettingsPublic(),
    isLandingPageEnabled(),
    listSiteLanguages({ activeOnly: true }),
    getServerTranslations(),
  ]);

  if (user) {
    redirect("/");
  }

  if (!resendSettings.enabled) {
    redirect("/login");
  }

  return (
    <ForgotPasswordScreen
      systemName={siteSettings.systemName}
      logoUrl={siteSettings.logoUrl}
      languages={languages}
      activeLanguageCode={languageCode}
      showHomeLink={landingEnabled}
    />
  );
}
