import Link from "next/link";
import { LegalNav } from "@/app/components/legal-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ t }, settings, user] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
    isSupabaseConfigured() ? getCurrentUser() : Promise.resolve(null),
  ]);

  const backLabel = user
    ? t("legal.nav.back_to_app", "Atpakaļ uz sistēmu")
    : t("legal.nav.back_to_login", "Atpakaļ uz pieslēgšanos");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="shrink-0 lg:w-72">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.08)]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
              >
                <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
                {backLabel}
              </Link>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {settings.systemName}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
                {t("legal.nav.title", "Juridiskā informācija")}
              </p>
              <div className="mt-6">
                <LegalNav />
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-[0_16px_45px_rgba(24,24,27,0.08)] md:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>

      <SiteFooter systemName={settings.systemName} />
    </div>
  );
}
