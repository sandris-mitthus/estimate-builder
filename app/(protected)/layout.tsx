import { cookies } from "next/headers";
import { ActionPermissionsProvider } from "@/app/components/action-permissions-context";
import { AppNav } from "@/app/components/app-nav";
import { AssignedMaterialsBannerLoader } from "@/app/components/assigned-materials-banner-loader";
import { LoginGate } from "@/app/components/login-gate";
import { SystemAdminProvider } from "@/app/components/system-admin-context";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import { createFullPermissions } from "@/app/lib/auth/permissions";
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
      translations = await getSiteTranslationDictionary(activeLanguageCode);

      return (
        <TranslationsProvider
          languageCode={activeLanguageCode}
          translations={translations}
        >
          <LoginGate
            systemName={siteSettings.systemName}
            slogan={siteSettings.slogan}
            languages={languages}
            activeLanguageCode={activeLanguageCode}
          />
        </TranslationsProvider>
      );
    }

    const currentUserDisplay = mapUserDisplay(user);
    currentUser = currentUserDisplay;
    currentUserId = user.id;

    const [adminFlag, languagesResult, activeLanguageCodeResult, session] =
      await Promise.all([
        isSystemAdminUser(user),
        listSiteLanguages({ activeOnly: true }),
        getUserActiveLanguageCode(user.id),
        getCurrentUserAccess(),
      ]);
    isSystemAdmin = adminFlag;
    languages = languagesResult;
    activeLanguageCode = activeLanguageCodeResult;

    const [translationsResult, companyNameResult, navCountsResult] = await Promise.all([
      getSiteTranslationDictionary(activeLanguageCode),
      isSystemAdmin ? Promise.resolve(null) : getCompanyDisplayName(),
      getNavigationCounts({ isSystemAdmin, activeLanguageCode }),
    ]);
    translations = translationsResult;
    companyName = companyNameResult;
    navCounts = navCountsResult;
    initialSidebarCollapsed =
      (await cookies()).get(SIDEBAR_COLLAPSED_COOKIE)?.value === "1";

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
              companyName={companyName}
              allowedNavKeys={allowedNavKeys}
              isSystemAdmin={isSystemAdmin}
              languages={languages}
              activeLanguageCode={activeLanguageCode}
              initialSidebarCollapsed={initialSidebarCollapsed}
              navCounts={navCounts}
            />
            <div className="min-w-0 pl-[86px] transition-[padding] duration-200 peer-data-[expanded=true]/sidebar:pl-[284px]">
              {currentUser && currentUserId ? <AssignedMaterialsBannerLoader /> : null}
              {children}
            </div>
          </div>
        </TranslationsProvider>
      </SystemAdminProvider>
    </ActionPermissionsProvider>
  );
}
