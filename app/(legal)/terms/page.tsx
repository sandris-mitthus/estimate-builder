import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getTermsContent } from "@/app/lib/legal/documents";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const title = t("legal.terms.title", "Lietošanas noteikumi");

  return {
    title: `${title} — ${settings.systemName}`,
  };
}

export default async function TermsPage() {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);

  const content = getTermsContent(t, settings.systemName);

  return (
    <LegalDocumentView
      content={content}
      updatedAtLabel={t("legal.nav.updated_at", "Atjaunināts {date}", {
        date: content.updatedAt,
      })}
    />
  );
}
