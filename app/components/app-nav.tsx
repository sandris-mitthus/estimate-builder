"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserAvatar } from "@/app/components/user-avatar";
import type { UserDisplay } from "@/app/lib/auth/map-user-display";
import { signOut } from "@/app/lib/auth/sign-out";

const NAV_ITEMS = [
  { href: "/", label: "Projekti" },
  { href: "/modules", label: "Ēku moduļi" },
  { href: "/blanks", label: "Sagataves" },
  { href: "/positions", label: "Cenu pozicijas" },
  { href: "/users", label: "Lietotāji" },
  { href: "/settings", label: "Uzstādījumi" },
] as const;

const OTHER_NAV_PREFIXES = NAV_ITEMS.map((item) => item.href).filter(
  (href) => href !== "/",
);

function isProjectsNavActive(pathname: string) {
  if (pathname === "/") return true;
  return !OTHER_NAV_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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
};

export function AppNav({ currentUser = null }: AppNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white">
      <div className="mx-auto flex h-[52px] max-w-[1480px] items-stretch justify-between gap-4 px-4 md:px-6">
        <nav className="flex min-w-0 flex-1 items-stretch overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? isProjectsNavActive(pathname)
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex shrink-0 items-center whitespace-nowrap px-3 text-[13px] transition-colors md:px-3.5 ${
                    isActive
                      ? "font-medium text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {item.label}
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
