import { cookies } from "next/headers";
import { ActionPermissionsProvider } from "@/app/components/action-permissions-context";
import { AppNav } from "@/app/components/app-nav";
import { AssignedMaterialsBannerLoader } from "@/app/components/assigned-materials-banner-loader";
import { RegisterCompanyView } from "@/app/components/register-company-view";
import { PendingCompanyInviteView } from "@/app/components/pending-company-invite-view";
import { LoginGate } from "@/app/components/login-gate";
import { SiteFooter } from "@/app/components/site-footer";
import { SystemAdminProvider } from "@/app/components/system-admin-context";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import { createFullPermissions } from "@/app/lib/auth/permissions";
import {
  getCurrentCompanyId,
  hasPendingCompanyInvite,
} from "@/app/lib/companies/current-company";
import { getResendSettingsPublic } from "@/app/lib/email/resend-config";
import {
  getDefaultSiteLanguageCode,
  DEFAULT_SITE_LANGUAGES,
  getSiteSettings,
  getSiteTranslationDictionary,
  getUserActiveLanguageCode,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { ANONYMOUS_LANGUAGE_COOKIE } from "@/app/lib/i18n/language-cookie";
import { getNavigationCounts, type NavCountMap } from "@/app/lib/navigation/nav-counts";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/app/lib/navigation/sidebar-cookie";
import { filterNavKeysByFrontendModules } from "@/app/lib/frontend-modules/access";
import { getCompanyDisplayName } from "@/app/lib/settings/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { activateInvitedCompanyMemberships } from "@/app/lib/users/activate-invited-membership";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";
import type { NavPermissionKey } from "@/app/lib/auth/permissions";

export const dynamic = "force-dynamic";

async function getAnonymousActiveLanguageCode(
  languages: { code: string }[],
): Promise<string> {
  const activeCodes = new Set(languages.map((language) => language.code));
  const cookieStore = await cookies();
  const cookieCode = cookieStore.get(ANONYMOUS_LANGUAGE_COOKIE)?.value?.trim() ?? "";

  if (activeCodes.has(cookieCode)) {
    return cookieCode;
  }

  const defaultCode = await getDefaultSiteLanguageCode();
  return activeCodes.has(defaultCode) ? defaultCode : (languages[0]?.code ?? "lv");
}

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let currentUser = null;
  let currentUserId: string | null = null;
  let companyName: string | null = null;
  let allowedNavKeys: NavPermissionKey[] | null = null;
  let actionPermissions = createFullPermissions(true).actions;
  let isSystemAdmin = false;
  let needsCompanyRegistration = false;
  let pendingCompanyInvite = false;
  let languages = DEFAULT_SITE_LANGUAGES.filter((language) => language.isActive);
  let activeLanguageCode = "lv";
  let translations = {};
  let initialSidebarCollapsed = false;
  let navCounts: NavCountMap = {};

  const [siteSettings, user] = await Promise.all([
    getSiteSettings(),
    isSupabaseConfigured() ? getCurrentUser() : Promise.resolve(null),
  ]);

  if (isSupabaseConfigured()) {
    if (!user) {
      languages = await listSiteLanguages({ activeOnly: true });
      activeLanguageCode = await getAnonymousActiveLanguageCode(languages);
      const [translationsResult, resendSettings] = await Promise.all([
        getSiteTranslationDictionary(activeLanguageCode),
        getResendSettingsPublic(),
      ]);
      translations = translationsResult;

      return (
        <TranslationsProvider
          languageCode={activeLanguageCode}
          translations={translations}
        >
          <LoginGate
            systemName={siteSettings.systemName}
            slogan={siteSettings.slogan}
            logoUrl={siteSettings.logoUrl}
            languages={languages}
            activeLanguageCode={activeLanguageCode}
            emailAuthEnabled={resendSettings.enabled}
          />
        </TranslationsProvider>
      );
    }

    const currentUserDisplay = mapUserDisplay(user);
    currentUser = currentUserDisplay;
    currentUserId = user.id;

    // Promote invited → active before resolving company, so the invite link
    // acceptance grants access in this same request.
    await activateInvitedCompanyMemberships(user.id);

    const [
      adminFlag,
      languagesResult,
      activeLanguageCodeResult,
      companyId,
      pendingInvite,
    ] = await Promise.all([
      isSystemAdminUser(user),
      listSiteLanguages({ activeOnly: true }),
      getUserActiveLanguageCode(user.id),
      getCurrentCompanyId(),
      hasPendingCompanyInvite(),
    ]);
    isSystemAdmin = adminFlag;
    languages = languagesResult;
    activeLanguageCode = activeLanguageCodeResult;
    translations = await getSiteTranslationDictionary(activeLanguageCode);
    pendingCompanyInvite = !isSystemAdmin && !companyId && pendingInvite;
    needsCompanyRegistration =
      !isSystemAdmin && !companyId && !pendingInvite;

    initialSidebarCollapsed =
      (await cookies()).get(SIDEBAR_COLLAPSED_COOKIE)?.value === "1";

    if (needsCompanyRegistration || pendingCompanyInvite) {
      // Čaula paliek; saturs = reģistrācija vai gaidošs uzaicinājums.
      allowedNavKeys = [];
      actionPermissions = createFullPermissions(false).actions;
      navCounts = {};
    } else {
      const [session, companyNameResult, navCountsResult] = await Promise.all([
        getCurrentUserAccess(),
        isSystemAdmin ? Promise.resolve(null) : getCompanyDisplayName(),
        getNavigationCounts({ isSystemAdmin, activeLanguageCode }),
      ]);
      companyName = companyNameResult;
      navCounts = navCountsResult;

      if (session) {
        actionPermissions = session.access.permissions.actions;
        let navKeys = Object.entries(session.access.permissions.nav)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key as NavPermissionKey);
        if (!isSystemAdmin) {
          navKeys = await filterNavKeysByFrontendModules(navKeys);
        }
        allowedNavKeys = navKeys;
      }
    }
  } else if (process.env.NODE_ENV === "production") {
    activeLanguageCode = await getAnonymousActiveLanguageCode(languages);
    translations = await getSiteTranslationDictionary(activeLanguageCode);

    return (
      <TranslationsProvider
        languageCode={activeLanguageCode}
        translations={translations}
      >
        <LoginGate
          systemName={siteSettings.systemName}
          slogan={siteSettings.slogan}
          logoUrl={siteSettings.logoUrl}
          languages={languages}
          activeLanguageCode={activeLanguageCode}
        />
      </TranslationsProvider>
    );
  }

  return (
    <ActionPermissionsProvider actions={actionPermissions}>
      <SystemAdminProvider isSystemAdmin={isSystemAdmin}>
        <TranslationsProvider
          languageCode={activeLanguageCode}
          translations={translations}
        >
          <div className="min-h-screen bg-zinc-100">
            <AppNav
              currentUser={currentUser}
              systemName={siteSettings.systemName}
              logoUrl={siteSettings.logoUrl}
              companyName={companyName}
              allowedNavKeys={allowedNavKeys}
              isSystemAdmin={isSystemAdmin}
              languages={languages}
              activeLanguageCode={activeLanguageCode}
              initialSidebarCollapsed={initialSidebarCollapsed}
              navCounts={navCounts}
            />
            <div
              data-app-main
              className="flex min-h-screen min-w-0 w-full flex-col pl-[var(--app-sidebar-width-collapsed)] transition-[padding] duration-200 peer-data-[expanded=true]/sidebar:pl-[var(--app-sidebar-width-expanded)]"
            >
              {currentUser &&
              currentUserId &&
              !needsCompanyRegistration &&
              !pendingCompanyInvite ? (
                <AssignedMaterialsBannerLoader />
              ) : null}
              <div className="min-w-0 flex-1">
                {needsCompanyRegistration ? (
                  <RegisterCompanyView userEmail={user?.email ?? ""} />
                ) : pendingCompanyInvite ? (
                  <PendingCompanyInviteView />
                ) : (
                  children
                )}
              </div>
              <SiteFooter systemName={siteSettings.systemName} />
            </div>
          </div>
        </TranslationsProvider>
      </SystemAdminProvider>
    </ActionPermissionsProvider>
  );
}
