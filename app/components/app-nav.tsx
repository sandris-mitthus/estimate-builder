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
import { writePreferenceCookie } from "@/app/lib/consent/client";
import type { NavCountMap } from "@/app/lib/navigation/nav-counts";
import { SIDEBAR_COLLAPSED_COOKIE, SIDEBAR_LAYOUT_CHANGE_EVENT } from "@/app/lib/navigation/sidebar-cookie";

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
const TODO_STORAGE_KEY = "estimate-builder-system-admin-todo-list";
const TODO_COUNT_CHANGE_EVENT = "estimate-builder-todo-count-change";
const DEFAULT_TODO_COUNT = 3;
const SYSTEM_ADMIN_BOTTOM_NAV_KEYS = new Set<NavItem["key"]>([
  "system_admin:site_settings",
]);
const USER_BOTTOM_NAV_KEYS = new Set<NavItem["key"]>([
  "todo",
  "users",
  "settings",
]);
const ESTIMATE_NAV_GROUP_KEYS = new Set<NavPermissionKey>([
  "estimate",
  "positions",
  "excluded_positions",
]);

type TopNavEntry =
  | { kind: "item"; item: NavItem }
  | {
      kind: "group";
      id: string;
      labelKey: string;
      fallbackLabel: string;
      items: NavItem[];
    };

function buildTopNavEntries(items: NavItem[]): TopNavEntry[] {
  const entries: TopNavEntry[] = [];
  let estimateGroup: NavItem[] = [];

  const flushEstimateGroup = () => {
    if (estimateGroup.length === 0) {
      return;
    }

    entries.push({
      kind: "group",
      id: "estimate",
      labelKey: "nav.group.estimate",
      fallbackLabel: "Tāme",
      items: estimateGroup,
    });
    estimateGroup = [];
  };

  for (const item of items) {
    if (ESTIMATE_NAV_GROUP_KEYS.has(item.key as NavPermissionKey)) {
      estimateGroup.push(item);
      continue;
    }

    flushEstimateGroup();
    entries.push({ kind: "item", item });
  }

  flushEstimateGroup();
  return entries;
}

const ALL_NAV_ITEMS: PermissionNavItem[] = [
  {
    key: "projects",
    href: "/",
    icon: "fas fa-folder-open",
    labelKey: "nav.projects",
    fallbackLabel: "Projekti",
  },
  {
    key: "timeline_graph",
    href: "/timeline-graph",
    icon: "fas fa-chart-line",
    labelKey: "nav.timeline_graph",
    fallbackLabel: "Laika grafiks",
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
    key: "workers",
    href: "/workers",
    icon: "fas fa-id-card",
    labelKey: "nav.workers",
    fallbackLabel: "Darbinieki",
  },
  {
    key: "tools",
    href: "/tools",
    icon: "fas fa-screwdriver-wrench",
    labelKey: "nav.tools",
    fallbackLabel: "Instrumenti",
  },
  {
    key: "todo",
    href: "/tasks",
    icon: "fas fa-clipboard-list",
    labelKey: "nav.todo",
    fallbackLabel: "Darāmo darbu saraksts",
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
    key: "system_admin:site_user_groups",
    href: "/site_user_groups",
    icon: "fas fa-shield-halved",
    labelKey: "nav.system_admin.site_user_groups",
    fallbackLabel: "Grupas",
  },
  {
    key: "system_admin:site_docs",
    href: "/site_docs",
    icon: "fas fa-book-open",
    labelKey: "nav.system_admin.site_docs",
    fallbackLabel: "Docs",
  },
  {
    key: "system_admin:todo",
    href: "/todo",
    icon: "fas fa-clipboard-list",
    labelKey: "nav.system_admin.todo",
    fallbackLabel: "Todo",
  },
  {
    key: "system_admin:site_frontend_modules",
    href: "/site_frontend_modules",
    icon: "fas fa-puzzle-piece",
    labelKey: "nav.system_admin.site_frontend_modules",
    fallbackLabel: "Frontend moduļi",
  },
  {
    key: "system_admin:site_payment_plans",
    href: "/site_payment_plans",
    icon: "fas fa-credit-card",
    labelKey: "nav.system_admin.site_payment_plans",
    fallbackLabel: "Maksas plāni",
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
  {
    key: "system_admin:site_email_templates",
    href: "/site_email_templates",
    icon: "fas fa-envelope",
    labelKey: "nav.system_admin.site_email_templates",
    fallbackLabel: "E-pasta šabloni",
  },
  {
    key: "system_admin:site_settings",
    href: "/site_settings",
    icon: "fas fa-sliders",
    labelKey: "nav.system_admin.site_settings",
    fallbackLabel: "Sistēmas uzstādījumi",
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

function readTodoCountFromStorage(): number {
  try {
    const value = window.localStorage.getItem(TODO_STORAGE_KEY);
    if (!value) {
      return DEFAULT_TODO_COUNT;
    }

    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return DEFAULT_TODO_COUNT;
    }

    return parsed.filter((item) => {
      if (typeof item !== "object" || item === null) return false;
      if (!("id" in item) || !("title" in item) || !("status" in item)) return false;

      const title = String(item.title).trim();
      const status = String(item.status);
      return title && (status === "todo" || status === "in_progress");
    }).length;
  } catch {
    return DEFAULT_TODO_COUNT;
  }
}

function formatNavCount(count: number): string {
  return count > 999 ? "999+" : String(count);
}

function NavCountBadge({
  count,
  active,
  expanded,
}: {
  count: number;
  active: boolean;
  expanded: boolean;
}) {
  if (count < 0) {
    return null;
  }

  const baseClassName =
    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold leading-5";
  const expandedToneClassName = active
    ? "bg-white/20 text-white ring-1 ring-white/25"
    : "bg-zinc-200/80 text-zinc-500";
  const collapsedToneClassName = active
    ? "bg-white text-blue-700 shadow-sm ring-1 ring-white/80"
    : "bg-zinc-700 text-white shadow-sm";

  if (expanded) {
    return (
      <span className={`${baseClassName} ${expandedToneClassName} ml-auto`}>
        {formatNavCount(count)}
      </span>
    );
  }

  return (
    <span
      className={`pointer-events-none absolute right-1 top-1 z-10 min-h-[18px] min-w-[18px] px-1 text-[9px] leading-[18px] ${baseClassName} ${collapsedToneClassName}`}
    >
      {formatNavCount(count)}
    </span>
  );
}

function NavWarningBadge({
  active,
  expanded,
  label,
}: {
  active: boolean;
  expanded: boolean;
  label: string;
}) {
  const baseClassName =
    "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold leading-none";
  const expandedToneClassName = active
    ? "bg-amber-300 text-amber-950 ring-1 ring-amber-200/80"
    : "bg-amber-100 text-amber-700 ring-1 ring-amber-200/80";
  const collapsedToneClassName = active
    ? "bg-amber-300 text-amber-950 shadow-sm ring-1 ring-amber-100"
    : "bg-amber-500 text-white shadow-sm";

  if (expanded) {
    return (
      <Tooltip label={label} className="ml-auto inline-flex shrink-0">
        <span
          className={`${baseClassName} ${expandedToneClassName}`}
          aria-label={label}
        >
          !
        </span>
      </Tooltip>
    );
  }

  return (
    <span
      className={`pointer-events-none absolute right-1 top-1 z-10 ${baseClassName} ${collapsedToneClassName}`}
      aria-label={label}
    >
      !
    </span>
  );
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
  logoUrl?: string | null;
  companyName?: string | null;
  allowedNavKeys?: NavPermissionKey[] | null;
  isSystemAdmin?: boolean;
  languages?: SiteLanguageSummary[];
  activeLanguageCode?: string;
  initialSidebarCollapsed?: boolean;
  navCounts?: NavCountMap;
};

type PendingNavigation = {
  href: string;
  pathname: string;
};

export function AppNav({
  currentUser = null,
  systemName = null,
  logoUrl = null,
  companyName = null,
  allowedNavKeys = null,
  isSystemAdmin = false,
  languages = [],
  activeLanguageCode = "lv",
  initialSidebarCollapsed = false,
  navCounts = {},
}: AppNavProps) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const [manualCollapsed, setManualCollapsed] = useState(initialSidebarCollapsed);
  const [todoCount, setTodoCount] = useState<number | null>(null);
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
  const bottomNavKeys = isSystemAdmin
    ? SYSTEM_ADMIN_BOTTOM_NAV_KEYS
    : USER_BOTTOM_NAV_KEYS;
  const topNavItems = navItems.filter((item) => !bottomNavKeys.has(item.key));
  const bottomNavItems = navItems.filter((item) => bottomNavKeys.has(item.key));

  useEffect(() => {
    if (!isSystemAdmin) {
      setTodoCount(null);
      return;
    }

    const updateTodoCount = () => setTodoCount(readTodoCountFromStorage());
    updateTodoCount();

    window.addEventListener("storage", updateTodoCount);
    window.addEventListener("focus", updateTodoCount);
    window.addEventListener(TODO_COUNT_CHANGE_EVENT, updateTodoCount);
    return () => {
      window.removeEventListener("storage", updateTodoCount);
      window.removeEventListener("focus", updateTodoCount);
      window.removeEventListener(TODO_COUNT_CHANGE_EVENT, updateTodoCount);
    };
  }, [isSystemAdmin]);

  function updateManualCollapsed(collapsed: boolean) {
    setManualCollapsed(collapsed);
    writePreferenceCookie(SIDEBAR_COLLAPSED_COOKIE, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(SIDEBAR_LAYOUT_CHANGE_EVENT));
  }

  function renderNavItem(item: NavItem) {
    const isActive =
      item.href === "/"
        ? isProjectsNavActive(pathname)
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const isPending =
      pendingNavigation?.href === item.href &&
      pendingNavigation.pathname === pathname;
    const label = t(item.labelKey, item.fallbackLabel);
    const modulesIncomplete =
      item.key === "modules" ? (navCounts.modules_incomplete ?? 0) : 0;
    const showModulesWarning = modulesIncomplete > 0;
    const modulesWarningLabel = t(
      "modules.nav.incomplete_warning",
      "Dažiem moduļiem trūkst vizualizāciju vai projekta failu",
    );
    const count =
      item.key === "system_admin:todo"
        ? todoCount
        : showModulesWarning
          ? null
          : (navCounts[item.key] ?? null);
    const tooltipLabel = showModulesWarning
      ? `${label} — ${modulesWarningLabel}`
      : label;
    const ariaLabel = showModulesWarning
      ? `${label}. ${modulesWarningLabel}`
      : label;

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
        aria-label={ariaLabel}
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
        {showModulesWarning ? (
          <NavWarningBadge
            active={isActive}
            expanded={menuExpanded}
            label={modulesWarningLabel}
          />
        ) : typeof count === "number" ? (
          <NavCountBadge
            count={count}
            active={isActive}
            expanded={menuExpanded}
          />
        ) : null}
      </Link>
    );

    const itemWrapperClassName = menuExpanded
      ? "inline-flex w-full shrink-0"
      : "relative inline-flex shrink-0";

    return showNavTooltips ? (
      <Tooltip key={item.href} label={tooltipLabel} className={itemWrapperClassName} align="start">
        {navLink}
      </Tooltip>
    ) : (
      <span key={item.href} className={itemWrapperClassName}>
        {navLink}
      </span>
    );
  }

  return (
    <aside
      data-expanded={menuExpanded ? "true" : "false"}
      className={`peer/sidebar fixed inset-y-0 left-0 z-50 flex bg-zinc-100/85 p-[var(--app-sidebar-padding)] backdrop-blur transition-[width] duration-200 ${
        menuExpanded
          ? "w-[var(--app-sidebar-width-expanded)]"
          : "w-[var(--app-sidebar-width-collapsed)]"
      }`}
    >
      <div
        className={`flex min-h-0 w-full flex-col items-center gap-4 rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-zinc-200/70 ${
          menuExpanded ? "p-4" : "p-2"
        }`}
      >
        {menuExpanded ? (
          <div className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-zinc-50 to-white p-1 shadow-sm ring-1 ring-zinc-200/70">
            <span className="flex min-w-0 items-center gap-2 px-2 text-sm font-semibold text-zinc-700">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="size-7 shrink-0 rounded-lg object-contain"
                />
              ) : null}
              <span className="min-w-0 truncate">{displaySystemName}</span>
            </span>
            <Tooltip label={toggleMenuLabel} align="end">
              <button
                type="button"
                onClick={() => updateManualCollapsed(true)}
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
              onClick={() => updateManualCollapsed(false)}
              aria-label={toggleMenuLabel}
              className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-50 text-zinc-500 shadow-sm ring-1 ring-zinc-200/80 transition hover:scale-[1.03] hover:text-zinc-900"
            >
              <i className="fas fa-chevron-right text-xs" aria-hidden="true" />
            </button>
          </Tooltip>
        )}

        <nav
          className={`flex min-h-0 flex-1 flex-col gap-1.5 rounded-[1.35rem] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            menuExpanded
              ? "w-full overflow-y-auto"
              : "w-[52px] items-center overflow-y-auto overflow-x-visible py-0.5"
          }`}
        >
          {buildTopNavEntries(topNavItems).map((entry) => {
            if (entry.kind === "item") {
              return renderNavItem(entry.item);
            }

            return (
              <div
                key={entry.id}
                className={
                  menuExpanded
                    ? "flex w-full flex-col gap-1.5"
                    : "flex w-full flex-col items-center gap-1.5"
                }
              >
                {menuExpanded ? (
                  <div className="mx-2 mt-1 border-b border-zinc-200/90 px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    {t(entry.labelKey, entry.fallbackLabel)}
                  </div>
                ) : (
                  <div
                    className="w-7 border-t border-zinc-200/90"
                    aria-hidden="true"
                  />
                )}
                {entry.items.map((item) => renderNavItem(item))}
                <div
                  className={`border-t border-zinc-200/90 ${
                    menuExpanded ? "mx-2 mb-1" : "w-7"
                  }`}
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex w-full shrink-0 flex-col items-center gap-2">
          {bottomNavItems.length > 0 ? (
            <nav
              className={`flex flex-col gap-1.5 rounded-[1.35rem] p-1 ${
                menuExpanded ? "w-full" : "w-[52px] items-center overflow-x-visible py-0.5"
              }`}
            >
              {bottomNavItems.map((item) => renderNavItem(item))}
            </nav>
          ) : null}

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
