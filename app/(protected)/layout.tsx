import { Suspense } from "react";
import { cookies } from "next/headers";
import { ActionPermissionsProvider } from "@/app/components/action-permissions-context";
import { AppNav } from "@/app/components/app-nav";
import { AssignedMaterialsBanner } from "@/app/components/assigned-materials-banner";
import { LoginGate } from "@/app/components/login-gate";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { resolveRelatedUserIds } from "@/app/lib/auth/resolve-related-user-ids";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import { createFullPermissions } from "@/app/lib/auth/permissions";
import { listUserAssignedMaterialGroups } from "@/app/lib/projects/list-user-assigned-materials";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import {
  getDefaultSiteLanguageCode,
  DEFAULT_SITE_LANGUAGES,
  getSiteSettings,
  getSiteTranslationDictionary,
  getUserActiveLanguageCode,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { ANONYMOUS_LANGUAGE_COOKIE } from "@/app/lib/i18n/language-cookie";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { listUsers } from "@/app/lib/users/repository";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";
import type { NavPermissionKey } from "@/app/lib/auth/permissions";
import type { UserDisplay } from "@/app/lib/auth/map-user-display";

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

async function AssignedMaterialsBannerSlot({
  currentUser,
  currentUserId,
}: {
  currentUser: UserDisplay;
  currentUserId: string;
}) {
  const [allUsers, catalogPositions, companySettings] = await Promise.all([
    listUsers(),
    listPositionPrices(),
    getCompanySettings(),
  ]);
  const currentUserFromList = allUsers.find(
    (listedUser) => listedUser.id === currentUserId,
  );
  const groups = await listUserAssignedMaterialGroups(currentUserId, {
    relatedUserIds: resolveRelatedUserIds(
      currentUserId,
      currentUserFromList?.name ?? currentUser.name,
      allUsers,
    ),
    allUsers,
    catalogPositions,
  });

  if (groups.length === 0) {
    return null;
  }

  return (
    <AssignedMaterialsBanner
      groups={groups}
      catalogPositions={catalogPositions}
      currency={companySettings.currency}
      currentUser={{
        id: currentUserId,
        name: currentUser.name,
        email: "",
        avatarUrl: currentUser.avatarUrl,
        companyStatus: "active",
      }}
    />
  );
}

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let currentUser = null;
  let currentUserId: string | null = null;
  let allowedNavKeys: NavPermissionKey[] | null = null;
  let actionPermissions = createFullPermissions(true).actions;
  let isSystemAdmin = false;
  let languages = DEFAULT_SITE_LANGUAGES.filter((language) => language.isActive);
  let activeLanguageCode = "lv";
  let translations = {};
  const siteSettings = await getSiteSettings();

  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
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
    [isSystemAdmin, languages, activeLanguageCode] = await Promise.all([
      isSystemAdminUser(user),
      listSiteLanguages({ activeOnly: true }),
      getUserActiveLanguageCode(user.id),
    ]);
    translations = await getSiteTranslationDictionary(activeLanguageCode);

    const session = await getCurrentUserAccess();
    if (session) {
      actionPermissions = session.access.permissions.actions;
      const navKeys = Object.entries(session.access.permissions.nav)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key as NavPermissionKey);
      allowedNavKeys = navKeys.length > 0 ? navKeys : null;
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
      <TranslationsProvider
        languageCode={activeLanguageCode}
        translations={translations}
      >
        <AppNav
          currentUser={currentUser}
          allowedNavKeys={allowedNavKeys}
          isSystemAdmin={isSystemAdmin}
          languages={languages}
          activeLanguageCode={activeLanguageCode}
        />
        {currentUser && currentUserId ? (
          <Suspense fallback={null}>
            <AssignedMaterialsBannerSlot
              currentUser={currentUser}
              currentUserId={currentUserId}
            />
          </Suspense>
        ) : null}
        {children}
      </TranslationsProvider>
    </ActionPermissionsProvider>
  );
}
