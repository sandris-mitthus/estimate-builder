"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
  labelKey: string;
  fallbackLabel: string;
};

type PermissionNavItem = NavItem & {
  key: NavPermissionKey;
};

const ALL_NAV_ITEMS: PermissionNavItem[] = [
  { key: "projects", href: "/", labelKey: "nav.projects", fallbackLabel: "Projekti" },
  { key: "modules", href: "/modules", labelKey: "nav.modules", fallbackLabel: "Ēku moduļi" },
  { key: "estimate", href: "/estimate", labelKey: "nav.estimate", fallbackLabel: "Sagatave" },
  { key: "positions", href: "/positions", labelKey: "nav.positions", fallbackLabel: "Pozīcijas" },
  {
    key: "excluded_positions",
    href: "/excluded-positions",
    labelKey: "nav.excluded_positions",
    fallbackLabel: "Neiekļautās pozīcijas",
  },
  { key: "users", href: "/users", labelKey: "nav.users", fallbackLabel: "Lietotāji" },
  { key: "settings", href: "/settings", labelKey: "nav.settings", fallbackLabel: "Uzstādījumi" },
];

const SYSTEM_ADMIN_NAV_ITEMS: NavItem[] = [
  {
    key: "system_admin:site_companies",
    href: "/site_companies",
    labelKey: "nav.system_admin.site_companies",
    fallbackLabel: "Uzņēmumi",
  },
  {
    key: "system_admin:site_companies_users",
    href: "/site_companies_users",
    labelKey: "nav.system_admin.site_companies_users",
    fallbackLabel: "Lietotāji",
  },
  {
    key: "system_admin:site_settings",
    href: "/site_settings",
    labelKey: "nav.system_admin.site_settings",
    fallbackLabel: "Sistēmas uzstādījumi",
  },
  {
    key: "system_admin:site_user_groups",
    href: "/site_user_groups",
    labelKey: "nav.system_admin.site_user_groups",
    fallbackLabel: "Grupas",
  },
  {
    key: "system_admin:site_languages",
    href: "/site_languages",
    labelKey: "nav.system_admin.site_languages",
    fallbackLabel: "Valodas",
  },
  {
    key: "system_admin:site_translations",
    href: "/site_translations",
    labelKey: "nav.system_admin.site_translations",
    fallbackLabel: "Tulkojumi",
  },
];

function isProjectsNavActive(pathname: string) {
  return pathname === "/";
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

function LanguageSelector({
  languages,
  activeLanguageCode,
}: {
  languages: SiteLanguageSummary[];
  activeLanguageCode: string;
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
  const isChangingLanguage = pendingLanguageCode !== null || isRefreshing;

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

  useEffect(() => {
    if (pendingLanguageCode && activeLanguageCode === pendingLanguageCode) {
      setPendingLanguageCode(null);
    }
  }, [activeLanguageCode, pendingLanguageCode]);

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
    <div ref={selectorRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isChangingLanguage}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center justify-center px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 transition hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {activeLanguage.code}
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-[70] w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {t("language.selector.label", "Valoda")}
          </div>
          <div
            role="listbox"
            aria-label={t("language.selector.aria", "Izvēlies valodu")}
          >
            {languages.map((language) => {
              const isActive = language.code === activeLanguageCode;

              return (
                <button
                  key={language.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => void handleLanguageSelect(language.code)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
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
        </div>
      ) : null}

      {isChangingLanguage ? <LanguageLoadingOverlay /> : null}
    </div>
  );
}

function NavUserSection({
  user,
  languages,
  activeLanguageCode,
}: {
  user: UserDisplay;
  languages: SiteLanguageSummary[];
  activeLanguageCode: string;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const { t } = useTranslations();
  const signOutLabel = t("auth.sign_out", "Iziet no sistēmas");

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <>
      <LanguageSelector
        languages={languages}
        activeLanguageCode={activeLanguageCode}
      />
      <div className="hidden items-center gap-2.5 sm:flex">
        <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="xs" />
        <span className="max-w-[140px] truncate text-sm text-zinc-700">
          {user.name}
        </span>
      </div>
      <div className="sm:hidden">
        <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="xs" />
      </div>
      <Tooltip label={signOutLabel}>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label={signOutLabel}
          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="fas fa-right-from-bracket text-[13px]" aria-hidden="true" />
        </button>
      </Tooltip>
    </>
  );
}

type AppNavProps = {
  currentUser?: UserDisplay | null;
  allowedNavKeys?: NavPermissionKey[] | null;
  isSystemAdmin?: boolean;
  languages?: SiteLanguageSummary[];
  activeLanguageCode?: string;
};

export function AppNav({
  currentUser = null,
  allowedNavKeys = null,
  isSystemAdmin = false,
  languages = [],
  activeLanguageCode = "lv",
}: AppNavProps) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const permittedNavItems =
    allowedNavKeys === null
      ? ALL_NAV_ITEMS
      : ALL_NAV_ITEMS.filter((item) => allowedNavKeys.includes(item.key));
  const navItems = isSystemAdmin ? SYSTEM_ADMIN_NAV_ITEMS : permittedNavItems;

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white">
      <div className="mx-auto flex h-[52px] max-w-[1480px] items-stretch justify-between gap-4 px-4 md:px-6">
        <nav className="flex min-w-0 flex-1 items-stretch overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? isProjectsNavActive(pathname)
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              const isPending = pendingHref === item.href;

              return (
                <Link
                  key={item.href}
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

                    setPendingHref(item.href);
                  }}
                  aria-disabled={isPending}
                  className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-[13px] transition-colors md:px-3.5 ${
                    isActive
                      ? "font-medium text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800"
                  } ${isPending ? "pointer-events-none opacity-70" : ""}`}
                >
                  {t(item.labelKey, item.fallbackLabel)}
                  {isPending ? (
                    <i
                      className="fas fa-spinner animate-spin text-[11px]"
                      aria-hidden="true"
                    />
                  ) : null}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-zinc-900 md:inset-x-3.5"
                    />
                  ) : null}
                </Link>
              );
            })}
        </nav>

        {currentUser ? (
          <div className="flex shrink-0 items-center gap-2 self-center border-l border-zinc-200 pl-2 md:gap-2.5 md:pl-3">
            <NavUserSection
              user={currentUser}
              languages={languages}
              activeLanguageCode={activeLanguageCode}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
