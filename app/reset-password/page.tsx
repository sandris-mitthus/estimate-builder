import { redirect } from "next/navigation";
import { ResetPasswordScreen } from "@/app/components/reset-password-screen";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { isLandingPageEnabled } from "@/app/lib/integrations/landing-page";
import { getSiteSettings, listSiteLanguages } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const [user, siteSettings, landingEnabled, languages, { languageCode }] =
    await Promise.all([
      getCurrentUser(),
      getSiteSettings(),
      isLandingPageEnabled(),
      listSiteLanguages({ activeOnly: true }),
      getServerTranslations(),
    ]);

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <ResetPasswordScreen
      systemName={siteSettings.systemName}
      logoUrl={siteSettings.logoUrl}
      languages={languages}
      activeLanguageCode={languageCode}
      showHomeLink={landingEnabled}
    />
  );
}
