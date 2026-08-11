"use client";

import Link from "next/link";
import { useCookieConsent } from "@/app/components/cookie-consent-context";
import { useTranslations } from "@/app/components/translations-provider";

const linkClassName =
  "text-[13px] font-medium tracking-[-0.01em] text-zinc-500 transition hover:text-zinc-900";

function LinkSeparator() {
  return (
    <span className="hidden h-3 w-px bg-zinc-200 sm:block" aria-hidden="true" />
  );
}

export function SiteFooter({
  systemName,
  bordered = true,
  /** `centered` izmanto pieslēgšanās ekrānā, kur saturs ir centrēts. */
  layout = "spread",
  className = "",
}: {
  systemName: string;
  bordered?: boolean;
  layout?: "spread" | "centered";
  className?: string;
}) {
  const { t } = useTranslations();
  const { openSettings } = useCookieConsent();

  const copyright = (
    <p className="whitespace-nowrap text-xs text-zinc-400">
      {t("footer.copyright", "© {year} {systemName}", {
        year: new Date().getFullYear(),
        systemName,
      })}
    </p>
  );

  const links = (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-5"
      aria-label={t("footer.nav_label", "Juridiskā informācija")}
    >
      <Link href="/privacy" className={linkClassName}>
        {t("legal.privacy.title", "Privātuma politika")}
      </Link>
      <LinkSeparator />
      <Link href="/terms" className={linkClassName}>
        {t("legal.terms.title", "Lietošanas noteikumi")}
      </Link>
      <LinkSeparator />
      <Link href="/cookies" className={linkClassName}>
        {t("legal.cookies.title", "Sīkdatņu politika")}
      </Link>
      <LinkSeparator />
      <Link href="/sitemap" className={linkClassName}>
        {t("sitemap.title", "Lapas karte")}
      </Link>
      <LinkSeparator />
      <button
        type="button"
        onClick={openSettings}
        className={`inline-flex items-center gap-1.5 ${linkClassName}`}
      >
        <i className="fas fa-sliders text-[10px] opacity-70" aria-hidden="true" />
        {t("footer.cookie_settings", "Sīkdatņu iestatījumi")}
      </button>
    </nav>
  );

  return (
    <footer
      className={`px-5 py-6 lg:px-8 ${bordered ? "border-t border-zinc-200" : ""} ${className}`}
    >
      {layout === "centered" ? (
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3">
          {links}
          {copyright}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-6">
          {copyright}
          {links}
        </div>
      )}
    </footer>
  );
}
