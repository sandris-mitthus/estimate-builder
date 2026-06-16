"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/app/components/user-avatar";
import type { NavPermissionKey } from "@/app/lib/auth/permissions";
import type { UserDisplay } from "@/app/lib/auth/map-user-display";
import { signOut } from "@/app/lib/auth/sign-out";

type NavItem = {
  key: NavPermissionKey;
  href: string;
  label: string;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { key: "projects", href: "/", label: "Projekti" },
  { key: "modules", href: "/modules", label: "Ēku moduļi" },
  { key: "estimate", href: "/estimate", label: "Sagatave" },
  { key: "positions", href: "/positions", label: "Pozīcijas" },
  { key: "excluded_positions", href: "/excluded-positions", label: "Neiekļautās pozīcijas" },
  { key: "users", href: "/users", label: "Lietotāji" },
  { key: "settings", href: "/settings", label: "Uzstādījumi" },
];

function isProjectsNavActive(pathname: string) {
  return pathname === "/";
}

function NavUserSection({ user }: { user: UserDisplay }) {
  const [signingOut, setSigningOut] = useState(false);

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
      <div className="hidden items-center gap-2.5 sm:flex">
        <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="xs" />
        <span className="max-w-[140px] truncate text-sm text-zinc-700">
          {user.name}
        </span>
      </div>
      <div className="sm:hidden">
        <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="xs" />
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        aria-label="Iziet no sistēmas"
        title="Iziet"
        className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <i className="fas fa-right-from-bracket text-[13px]" aria-hidden="true" />
      </button>
    </>
  );
}

type AppNavProps = {
  currentUser?: UserDisplay | null;
  allowedNavKeys?: NavPermissionKey[] | null;
};

export function AppNav({
  currentUser = null,
  allowedNavKeys = null,
}: AppNavProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const navItems =
    allowedNavKeys === null
      ? ALL_NAV_ITEMS
      : ALL_NAV_ITEMS.filter((item) => allowedNavKeys.includes(item.key));

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
                  {item.label}
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
          <div className="flex shrink-0 items-center gap-2 self-center border-l border-zinc-200 pl-4 md:gap-3 md:pl-5">
            <NavUserSection user={currentUser} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
