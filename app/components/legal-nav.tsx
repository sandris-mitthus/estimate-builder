"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/app/components/translations-provider";

const LEGAL_LINKS = [
  { href: "/privacy", labelKey: "legal.privacy.title", fallback: "Privātuma politika" },
  { href: "/terms", labelKey: "legal.terms.title", fallback: "Lietošanas noteikumi" },
  { href: "/cookies", labelKey: "legal.cookies.title", fallback: "Sīkdatņu politika" },
  { href: "/sitemap", labelKey: "sitemap.title", fallback: "Lapas karte" },
];

export function LegalNav() {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav
      className="space-y-1"
      aria-label={t("footer.nav_label", "Juridiskā informācija")}
    >
      {LEGAL_LINKS.map((link) => {
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            {t(link.labelKey, link.fallback)}
          </Link>
        );
      })}
    </nav>
  );
}
