import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ActionPermissionsProvider } from "@/app/components/action-permissions-context";
import { AppNav } from "@/app/components/app-nav";
import { AssignedMaterialsBannerLoader } from "@/app/components/assigned-materials-banner-loader";
import { RegisterCompanyView } from "@/app/components/register-company-view";
import { PendingCompanyInviteView } from "@/app/components/pending-company-invite-view";
import { LandingPage } from "@/app/components/landing-page";
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
import {
  DEFAULT_SITE_LANGUAGES,
  getSiteSettings,
  getSiteTranslationDictionary,
  getUserActiveLanguageCode,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { getAnonymousActiveLanguageCode } from "@/app/lib/i18n/anonymous-language";
import { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";
import { getNavigationCounts, type NavCountMap } from "@/app/lib/navigation/nav-counts";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/app/lib/navigation/sidebar-cookie";
import { CompanyAccessLockOverlay } from "@/app/components/company-access-lock-overlay";
import { filterNavKeysByFrontendModules } from "@/app/lib/frontend-modules/access";
import { isLandingPageEnabled } from "@/app/lib/integrations/landing-page";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import {
  getCompanyAccessLockReasonForCompany,
  getEarlyBirdSettings,
  getTrialSettings,
  isEarlyBirdOfferAvailable,
  isPaymentPlansEnabled,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";
import type {
  CompanyAccessLockReason,
  PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";
import { getCompanyDisplayName } from "@/app/lib/settings/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";
import type { NavPermissionKey } from "@/app/lib/auth/permissions";

export const dynamic = "force-dynamic";

/** Plans are only shown on the public landing page when payment plans are on. */
async function getLandingPricingProps(): Promise<{
  paymentPlans: PaymentPlanSummary[];
  trialDays: number | null;
  trialPlanId: string | null;
  earlyBirdAvailable: boolean;
  earlyBirdRemaining: number | null;
}> {
  if (!(await isPaymentPlansEnabled())) {
    return {
      paymentPlans: [],
      trialDays: null,
      trialPlanId: null,
      earlyBirdAvailable: false,
      earlyBirdRemaining: null,
    };
  }

  const [paymentPlans, trial, earlyBird] = await Promise.all([
    listPaymentPlans(),
    getTrialSettings(),
    getEarlyBirdSettings(),
  ]);

  const earlyBirdAvailable = isEarlyBirdOfferAvailable(earlyBird);

  return {
    paymentPlans,
    trialDays: trial.trialPlanId ? trial.trialDays : null,
    trialPlanId: trial.trialPlanId,
    earlyBirdAvailable,
    earlyBirdRemaining: earlyBirdAvailable
      ? Math.max(0, earlyBird.limit - earlyBird.claimed)
      : null,
  };
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
  let accessLockReason: CompanyAccessLockReason | null = null;
  let languages = DEFAULT_SITE_LANGUAGES.filter((language) => language.isActive);
  let activeLanguageCode = "lv";
  let translations = {};
  let initialSidebarCollapsed = false;
  let navCounts: NavCountMap = {};
  let delegatedOrdersModuleEnabled = false;

  const [siteSettings, user] = await Promise.all([
    getSiteSettings(),
    isSupabaseConfigured() ? getCurrentUser() : Promise.resolve(null),
  ]);

  if (isSupabaseConfigured()) {
    if (!user) {
      if (!(await isLandingPageEnabled())) {
        redirect("/login");
      }

      languages = await listSiteLanguages({ activeOnly: true });
      activeLanguageCode = await getAnonymousActiveLanguageCode(languages);
      const [translationsResult, pricing] = await Promise.all([
        getSiteTranslationDictionary(activeLanguageCode),
        getLandingPricingProps(),
      ]);
      translations = translationsResult;

      return (
        <TranslationsProvider
          languageCode={activeLanguageCode}
          translations={translations}
        >
          <LandingPage
            systemName={siteSettings.systemName}
            slogan={resolveLocalizedValue(
              siteSettings.sloganValues,
              activeLanguageCode,
            )}
            logoUrl={siteSettings.logoUrl}
            languages={languages}
            activeLanguageCode={activeLanguageCode}
            paymentPlans={pricing.paymentPlans}
            trialDays={pricing.trialDays}
            trialPlanId={pricing.trialPlanId}
            earlyBirdAvailable={pricing.earlyBirdAvailable}
            earlyBirdRemaining={pricing.earlyBirdRemaining}
          />
        </TranslationsProvider>
      );
    }

    const currentUserDisplay = mapUserDisplay(user);
    currentUser = currentUserDisplay;
    currentUserId = user.id;

    // Invited → active promotion happens inside the company membership read,
    // so it costs no extra round trip here.
    const [
      adminFlag,
      languagesResult,
      activeLanguageCodeResult,
      companyId,
      pendingInvite,
      cookieStore,
    ] = await Promise.all([
      isSystemAdminUser(user),
      listSiteLanguages({ activeOnly: true }),
      getUserActiveLanguageCode(user.id),
      getCurrentCompanyId(),
      hasPendingCompanyInvite(),
      cookies(),
    ]);
    isSystemAdmin = adminFlag;
    languages = languagesResult;
    activeLanguageCode = activeLanguageCodeResult;
    translations = await getSiteTranslationDictionary(activeLanguageCode);
    pendingCompanyInvite = !isSystemAdmin && !companyId && pendingInvite;
    needsCompanyRegistration =
      !isSystemAdmin && !companyId && !pendingInvite;

    initialSidebarCollapsed =
      cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "1";

    if (needsCompanyRegistration || pendingCompanyInvite) {
      // Čaula paliek; saturs = reģistrācija vai gaidošs uzaicinājums.
      allowedNavKeys = [];
      actionPermissions = createFullPermissions(false).actions;
      navCounts = {};
    } else {
      // The module check also warms the request cache the nav filter below reads.
      const [
        session,
        companyNameResult,
        navCountsResult,
        lockReason,
        delegatedOrdersEnabled,
      ] = await Promise.all([
        getCurrentUserAccess(),
        isSystemAdmin ? Promise.resolve(null) : getCompanyDisplayName(),
        getNavigationCounts({ isSystemAdmin, activeLanguageCode }),
        !isSystemAdmin && companyId
          ? getCompanyAccessLockReasonForCompany(companyId)
          : Promise.resolve(null),
        isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.delegatedOrders),
      ]);
      companyName = companyNameResult;
      navCounts = navCountsResult;
      accessLockReason = lockReason;
      delegatedOrdersModuleEnabled = delegatedOrdersEnabled;

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
        <LandingPage
          systemName={siteSettings.systemName}
          slogan={resolveLocalizedValue(
            siteSettings.sloganValues,
            activeLanguageCode,
          )}
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
          <div className="relative min-h-screen bg-zinc-100">
            <div
              className={
                accessLockReason
                  ? "pointer-events-none select-none blur-sm"
                  : undefined
              }
              aria-hidden={accessLockReason ? true : undefined}
            >
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
                delegatedOrdersModuleEnabled &&
                !needsCompanyRegistration &&
                !pendingCompanyInvite &&
                !accessLockReason ? (
                  <AssignedMaterialsBannerLoader />
                ) : null}
                <div className="min-w-0 flex-1">
                  {needsCompanyRegistration ? (
                    <RegisterCompanyView userEmail={user?.email ?? ""} />
                  ) : pendingCompanyInvite ? (
                    <PendingCompanyInviteView />
                  ) : accessLockReason ? null : (
                    children
                  )}
                </div>
                <SiteFooter systemName={siteSettings.systemName} />
              </div>
            </div>
            {accessLockReason ? (
              <CompanyAccessLockOverlay reason={accessLockReason} />
            ) : null}
          </div>
        </TranslationsProvider>
      </SystemAdminProvider>
    </ActionPermissionsProvider>
  );
}
