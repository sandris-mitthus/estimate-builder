import type { Metadata } from "next";
import { CookieRegistryTable } from "@/app/components/cookie-registry-table";
import { CookieSettingsLink } from "@/app/components/cookie-settings-link";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getCookieRegistryRows } from "@/app/lib/legal/cookie-registry";
import { getCookiePolicyContent } from "@/app/lib/legal/documents";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const title = t("legal.cookies.title", "Sīkdatņu politika");

  return {
    title: `${title} — ${settings.systemName}`,
  };
}

export default async function CookiePolicyPage() {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);

  const content = getCookiePolicyContent(t, settings.systemName);

  return (
    <LegalDocumentView
      content={content}
      updatedAtLabel={t("legal.nav.updated_at", "Atjaunināts {date}", {
        date: content.updatedAt,
      })}
      sectionExtras={{
        categories: (
          <CookieRegistryTable
            rows={getCookieRegistryRows(t)}
            labels={{
              name: t("legal.cookies.table.name", "Nosaukums"),
              category: t("legal.cookies.table.category", "Kategorija"),
              purpose: t("legal.cookies.table.purpose", "Mērķis"),
              retention: t("legal.cookies.table.retention", "Glabāšanas laiks"),
            }}
          />
        ),
        manage: <CookieSettingsLink />,
      }}
    />
  );
}
