import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/app/components/site-footer";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { publicPageSeo } from "@/app/lib/seo/public-page-metadata";
import { SEARCH_CRAWL_SITEMAP_ENTRIES } from "@/app/lib/seo/search-crawl";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const title = t("sitemap.title", "Lapas karte");
  const description = t(
    "sitemap.description",
    "Visas publiskās lapas — sākums, dokumentācija un juridiskā informācija.",
  );

  return publicPageSeo("/sitemap", {
    title: `${title} | ${settings.systemName}`,
    description,
  });
}

export default async function HtmlSitemapPage() {
  const [{ t }, settings, user] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
    isSupabaseConfigured() ? getCurrentUser() : Promise.resolve(null),
  ]);

  const backLabel = user
    ? t("legal.nav.back_to_app", "Atpakaļ uz sistēmu")
    : t("legal.nav.back_to_login", "Atpakaļ uz pieslēgšanos");

  const machineLinks = [
    { href: "/sitemap.xml", label: "sitemap.xml" },
    { href: "/robots.txt", label: "robots.txt" },
    { href: "/llms.txt", label: "llms.txt" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
        >
          <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
          {backLabel}
        </Link>

        <header className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            {settings.systemName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-zinc-950">
            {t("sitemap.title", "Lapas karte")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {t(
              "sitemap.description",
              "Visas publiskās lapas — sākums, dokumentācija un juridiskā informācija.",
            )}
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-7 shadow-[0_16px_45px_rgba(24,24,27,0.08)] md:p-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("sitemap.section.pages", "Publiskās lapas")}
          </h2>
          <ul className="mt-4 space-y-2">
            {SEARCH_CRAWL_SITEMAP_ENTRIES.filter(
              (entry) => entry.path !== "/sitemap",
            ).map((entry) => (
              <li key={entry.path}>
                <Link
                  href={entry.path}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <span>{t(entry.titleKey, entry.titleFallback)}</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {entry.path === "/" ? "/" : entry.path}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("sitemap.section.machine", "Meklētājiem un AI")}
          </h2>
          <ul className="mt-4 space-y-2">
            {machineLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {link.href}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <SiteFooter systemName={settings.systemName} />
    </div>
  );
}
