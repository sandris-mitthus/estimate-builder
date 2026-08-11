import { redirect } from "next/navigation";
import { AuthScreen } from "@/app/components/auth-screen";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getResendSettingsPublic } from "@/app/lib/email/resend-config";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { isGoogleAuthEnabled } from "@/app/lib/integrations/google-auth";
import { isLandingPageEnabled } from "@/app/lib/integrations/landing-page";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { getSiteSettings, listSiteLanguages } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [
    user,
    siteSettings,
    resendSettings,
    googleAuthEnabled,
    landingEnabled,
    languages,
    { languageCode },
    params,
  ] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getResendSettingsPublic(),
    isGoogleAuthEnabled(),
    isLandingPageEnabled(),
    listSiteLanguages({ activeOnly: true }),
    getServerTranslations(),
    searchParams,
  ]);

  if (user) {
    redirect("/");
  }

  return (
    <AuthScreen
      mode="signup"
      returnPath={getSafeRedirectPath(params.next ?? null)}
      systemName={siteSettings.systemName}
      logoUrl={siteSettings.logoUrl}
      languages={languages}
      activeLanguageCode={languageCode}
      emailAuthEnabled={resendSettings.enabled}
      googleAuthEnabled={googleAuthEnabled}
      showHomeLink={landingEnabled}
    />
  );
}
