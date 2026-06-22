"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { updateActiveLanguageAction } from "@/app/(protected)/language-actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { NavPermissionKey } from "@/app/lib/auth/permissions";
import type { UserDisplay } from "@/app/lib/auth/map-user-display";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";
import { signOut } from "@/app/lib/auth/sign-out";

type NavItem = {
  key: NavPermissionKey | `system_admin:${string}`;
  href: string;
  icon: string;
  labelKey: string;
  fallbackLabel: string;
};

type PermissionNavItem = NavItem & {
  key: NavPermissionKey;
};

const NAV_TEXT_MEDIA_QUERY = "(min-width: 1280px)";

const ALL_NAV_ITEMS: PermissionNavItem[] = [
  {
    key: "projects",
    href: "/",
    icon: "fas fa-folder-open",
    labelKey: "nav.projects",
    fallbackLabel: "Projekti",
  },
  {
    key: "modules",
    href: "/modules",
    icon: "fas fa-layer-group",
    labelKey: "nav.modules",
    fallbackLabel: "Ēku moduļi",
  },
  {
    key: "estimate",
    href: "/estimate",
    icon: "fas fa-file-lines",
    labelKey: "nav.estimate",
    fallbackLabel: "Sagatave",
  },
  {
    key: "positions",
    href: "/positions",
    icon: "fas fa-list-check",
    labelKey: "nav.positions",
    fallbackLabel: "Pozīcijas",
  },
  {
    key: "excluded_positions",
    href: "/excluded-positions",
    icon: "fas fa-ban",
    labelKey: "nav.excluded_positions",
    fallbackLabel: "Neiekļautās pozīcijas",
  },
  {
    key: "users",
    href: "/users",
    icon: "fas fa-users",
    labelKey: "nav.users",
    fallbackLabel: "Lietotāji",
  },
  {
    key: "settings",
    href: "/settings",
    icon: "fas fa-gear",
    labelKey: "nav.settings",
    fallbackLabel: "Uzstādījumi",
  },
];

const SYSTEM_ADMIN_NAV_ITEMS: NavItem[] = [
  {
    key: "system_admin:site_companies",
    href: "/site_companies",
    icon: "fas fa-building",
    labelKey: "nav.system_admin.site_companies",
    fallbackLabel: "Uzņēmumi",
  },
  {
    key: "system_admin:site_companies_users",
    href: "/site_companies_users",
    icon: "fas fa-user-group",
    labelKey: "nav.system_admin.site_companies_users",
    fallbackLabel: "Lietotāji",
  },
  {
    key: "system_admin:site_settings",
    href: "/site_settings",
    icon: "fas fa-sliders",
    labelKey: "nav.system_admin.site_settings",
    fallbackLabel: "Sistēmas uzstādījumi",
  },
  {
    key: "system_admin:site_user_groups",
    href: "/site_user_groups",
    icon: "fas fa-shield-halved",
    labelKey: "nav.system_admin.site_user_groups",
    fallbackLabel: "Grupas",
  },
  {
    key: "system_admin:site_languages",
    href: "/site_languages",
    icon: "fas fa-language",
    labelKey: "nav.system_admin.site_languages",
    fallbackLabel: "Valodas",
  },
  {
    key: "system_admin:site_translations",
    href: "/site_translations",
    icon: "fas fa-globe",
    labelKey: "nav.system_admin.site_translations",
    fallbackLabel: "Tulkojumi",
  },
];

function isProjectsNavActive(pathname: string) {
  return pathname === "/";
}

function subscribeToNavTextVisibility(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(NAV_TEXT_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getNavTextVisibilitySnapshot() {
  return window.matchMedia(NAV_TEXT_MEDIA_QUERY).matches;
}

function getServerNavTextVisibilitySnapshot() {
  return false;
}

function LanguageLoadingOverlay() {
  const { t } = useTranslations();

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/10 px-4 backdrop-blur-sm">
      <div className="flex w-full max-w-xs flex-col items-center rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center shadow-lg">
        <span
          className="size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium leading-5 text-zinc-900">
          {t("language.switching", "Maina sistēmas valodu…")}
        </p>
      </div>
    </div>
  );
}

function SidebarLanguageSelector({
  languages,
  activeLanguageCode,
  expanded,
}: {
  languages: SiteLanguageSummary[];
  activeLanguageCode: string;
  expanded: boolean;
}) {
  const router = useRouter();
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [pendingLanguageCode, setPendingLanguageCode] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const activeLanguage =
    languages.find((language) => language.code === activeLanguageCode) ??
    languages[0] ??
    null;
  const effectivePendingLanguageCode =
    pendingLanguageCode === activeLanguageCode ? null : pendingLanguageCode;
  const isChangingLanguage = effectivePendingLanguageCode !== null || isRefreshing;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  async function handleLanguageSelect(code: string) {
    setOpen(false);

    if (code === activeLanguageCode || isChangingLanguage) {
      return;
    }

    clearFeedback();
    setPendingLanguageCode(code);

    const result = await updateActiveLanguageAction(code);
    if (!result.ok) {
      setPendingLanguageCode(null);
      showFeedback({ type: "error", text: translateActionError(t, result) });
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  if (!activeLanguage || languages.length <= 1) {
    return null;
  }

  return (
    <div ref={selectorRef} className={`relative ${expanded ? "w-full" : ""}`}>
      {expanded ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          disabled={isChangingLanguage}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-10 w-full items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 text-left text-sm text-zinc-600 shadow-sm ring-1 ring-zinc-200/70 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex min-w-0 items-center gap-2">
            <i className="fas fa-language text-xs text-zinc-400" aria-hidden="true" />
            <span className="truncate">{activeLanguage.name}</span>
          </span>
          <span className="font-mono text-xs uppercase text-zinc-400">
            {activeLanguage.code}
          </span>
        </button>
      ) : (
        <Tooltip label={t("language.selector.label", "Valoda")}>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            disabled={isChangingLanguage}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={t("language.selector.aria", "Izvēlies valodu")}
            className="inline-flex size-11 items-center justify-center rounded-2xl bg-zinc-50 text-[11px] font-bold uppercase text-zinc-500 shadow-sm ring-1 ring-zinc-200/70 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeLanguage.code}
          </button>
        </Tooltip>
      )}

      {open ? (
        <div
          role="listbox"
          aria-label={t("language.selector.aria", "Izvēlies valodu")}
          className={`absolute bottom-12 left-0 z-[70] max-h-[calc(100vh-8rem)] w-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl shadow-zinc-950/10 ${
            expanded ? "xl:w-full" : ""
          }`}
        >
          {languages.map((language) => {
            const isActive = language.code === activeLanguageCode;

            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={isChangingLanguage}
                onClick={() => void handleLanguageSelect(language.code)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActive
                    ? "bg-zinc-100 font-medium text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span>{language.name}</span>
                <span className="font-mono text-xs uppercase text-zinc-400">
                  {language.code}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isChangingLanguage ? <LanguageLoadingOverlay /> : null}
    </div>
  );
}

function NavUserSection({
  user,
  companyName,
  isSystemAdmin,
  expanded,
}: {
  user: UserDisplay;
  companyName?: string | null;
  isSystemAdmin: boolean;
  expanded: boolean;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const signOutLabel = t("auth.sign_out", "Iziet no sistēmas");
  const userMenuLabel = t("user_menu.label", "Lietotāja izvēlne");
  const userSettingsLabel = t("user_menu.settings", "Lietotāja uzstādījumi");
  const userSettingsDummyMessage = t(
    "user_menu.settings_dummy",
    "Lietotāja uzstādījumi būs pieejami drīzumā.",
  );
  const systemAdminLabel = isSystemAdmin
    ? t("roles.system_admin", "Sistēmas administrators")
    : undefined;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  function handleUserSettingsClick() {
    setMenuOpen(false);
    showFeedback({ type: "info", text: userSettingsDummyMessage });
  }

  async function handleSignOut() {
    setMenuOpen(false);
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div ref={menuRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={userMenuLabel}
          className={`w-full min-w-0 items-center gap-2.5 rounded-2xl bg-zinc-50 px-2.5 py-2 text-left transition hover:bg-zinc-100 ${
            expanded ? "hidden xl:flex" : "hidden"
          }`}
        >
          <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="xs" />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm text-zinc-700">{user.name}</span>
            {systemAdminLabel ? (
              <span className="truncate text-[11px] font-medium text-sky-700">
                {systemAdminLabel}
              </span>
            ) : companyName ? (
              <span className="truncate text-[11px] text-zinc-400">
                {companyName}
              </span>
            ) : null}
          </span>
          <i
            className="fas fa-ellipsis-vertical shrink-0 text-sm text-zinc-400"
            aria-hidden="true"
          />
        </button>

        <Tooltip
          label={userMenuLabel}
          className={`w-full justify-center ${expanded ? "xl:hidden" : ""}`}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={userMenuLabel}
            className="relative inline-flex size-11 items-center justify-center rounded-2xl bg-zinc-50 transition hover:bg-zinc-100"
          >
            <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="xs" />
            <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200">
              <i
                className="fas fa-ellipsis-vertical text-[10px]"
                aria-hidden="true"
              />
            </span>
          </button>
        </Tooltip>

        {menuOpen ? (
          <div
            role="menu"
            className={`absolute bottom-full z-[70] mb-2 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl shadow-zinc-950/10 ${
              expanded ? "left-0 xl:w-full" : "left-0"
            }`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleUserSettingsClick}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <i className="fas fa-user-gear w-4 text-center text-xs" aria-hidden="true" />
              <span>{userSettingsLabel}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i
                className={`fas ${
                  signingOut ? "fa-spinner animate-spin" : "fa-right-from-bracket"
                } w-4 text-center text-xs`}
                aria-hidden="true"
              />
              <span>{signOutLabel}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type AppNavProps = {
  currentUser?: UserDisplay | null;
  systemName?: string | null;
  companyName?: string | null;
  allowedNavKeys?: NavPermissionKey[] | null;
  isSystemAdmin?: boolean;
  languages?: SiteLanguageSummary[];
  activeLanguageCode?: string;
};

type PendingNavigation = {
  href: string;
  pathname: string;
};

export function AppNav({
  currentUser = null,
  systemName = null,
  companyName = null,
  allowedNavKeys = null,
  isSystemAdmin = false,
  languages = [],
  activeLanguageCode = "lv",
}: AppNavProps) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const navTextVisible = useSyncExternalStore(
    subscribeToNavTextVisibility,
    getNavTextVisibilitySnapshot,
    getServerNavTextVisibilitySnapshot,
  );
  const menuExpanded = navTextVisible && !manualCollapsed;
  const showNavTooltips = !menuExpanded;
  const toggleMenuLabel = menuExpanded
    ? t("nav.collapse_menu", "Sakļaut izvēlni")
    : t("nav.expand_menu", "Izvērst izvēlni");
  const displaySystemName = systemName?.trim() || "Estimate Builder";
  const permittedNavItems =
    allowedNavKeys === null
      ? ALL_NAV_ITEMS
      : ALL_NAV_ITEMS.filter((item) => allowedNavKeys.includes(item.key));
  const navItems = isSystemAdmin ? SYSTEM_ADMIN_NAV_ITEMS : permittedNavItems;

  return (
    <aside
      data-expanded={menuExpanded ? "true" : "false"}
      className={`peer/sidebar fixed inset-y-0 left-0 z-50 flex bg-zinc-100/85 p-3 backdrop-blur transition-[width] duration-200 ${
        menuExpanded ? "w-[284px]" : "w-[86px]"
      }`}
    >
      <div
        className={`flex min-h-0 w-full flex-col items-center gap-4 rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-zinc-200/70 ${
          menuExpanded ? "p-4" : "p-2"
        }`}
      >
        {menuExpanded ? (
          <div className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-zinc-50 to-white p-1 shadow-sm ring-1 ring-zinc-200/70">
            <span className="min-w-0 truncate px-3 text-sm font-semibold text-zinc-700">
              {displaySystemName}
            </span>
            <Tooltip label={toggleMenuLabel} align="end">
              <button
                type="button"
                onClick={() => setManualCollapsed(true)}
                aria-label={toggleMenuLabel}
                className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <i className="fas fa-chevron-left text-xs" aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <Tooltip label={toggleMenuLabel}>
            <button
              type="button"
              onClick={() => setManualCollapsed(false)}
              aria-label={toggleMenuLabel}
              className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-50 text-zinc-500 shadow-sm ring-1 ring-zinc-200/80 transition hover:scale-[1.03] hover:text-zinc-900"
            >
              <i className="fas fa-chevron-right text-xs" aria-hidden="true" />
            </button>
          </Tooltip>
        )}

        <nav
          className={`flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-[1.35rem] bg-zinc-50/80 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            menuExpanded ? "w-full" : "w-[52px] items-center"
          }`}
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? isProjectsNavActive(pathname)
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            const isPending =
              pendingNavigation?.href === item.href &&
              pendingNavigation.pathname === pathname;
            const label = t(item.labelKey, item.fallbackLabel);

            const navLink = (
              <Link
                href={item.href}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }

                  if (isActive || isPending) {
                    event.preventDefault();
                    return;
                  }

                  setPendingNavigation({ href: item.href, pathname });
                }}
                aria-disabled={isPending}
                aria-label={label}
                className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl text-[13px] transition-all duration-200 ${
                  isActive
                    ? "bg-blue-700 font-semibold text-white shadow-sm shadow-blue-900/20"
                    : "text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm"
                } ${
                  menuExpanded
                    ? "h-11 w-full justify-start px-4"
                    : "size-11 justify-center p-0"
                } ${
                  isPending ? "pointer-events-none opacity-70" : ""
                }`}
              >
                {isPending ? (
                  <i
                    className="fas fa-spinner animate-spin text-[13px]"
                    aria-hidden="true"
                  />
                ) : (
                  <i
                    className={`${item.icon} w-4 text-center text-[14px]`}
                    aria-hidden="true"
                  />
                )}
                {menuExpanded ? <span>{label}</span> : null}
              </Link>
            );

            return showNavTooltips ? (
              <Tooltip key={item.href} label={label} className="shrink-0">
                {navLink}
              </Tooltip>
            ) : (
              <span key={item.href} className="inline-flex w-full shrink-0">
                {navLink}
              </span>
            );
          })}
        </nav>

        <div className="mt-auto flex w-full shrink-0 flex-col items-center gap-2">
          <SidebarLanguageSelector
            languages={languages}
            activeLanguageCode={activeLanguageCode}
            expanded={menuExpanded}
          />

          {currentUser ? (
            <div
              className={`flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/80 ${
                menuExpanded ? "w-full p-2" : "w-[52px] p-1"
              }`}
            >
              <NavUserSection
                user={currentUser}
                companyName={companyName}
                isSystemAdmin={isSystemAdmin}
                expanded={menuExpanded}
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
