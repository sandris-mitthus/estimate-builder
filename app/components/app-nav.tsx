"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/projekti", label: "Projekti" },
  { href: "/eku-moduli", label: "Eku moduļi" },
  { href: "/definetie-bloki", label: "Definētie bloki" },
  { href: "/poziciju-cenas", label: "Poziciju Cenas" },
  { href: "/lietotaji", label: "Lietotāji" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-8 px-4 md:px-6">
        <Link
          href="/projekti"
          className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900"
        >
          Estimate Builder
        </Link>
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/projekti" && pathname === "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
