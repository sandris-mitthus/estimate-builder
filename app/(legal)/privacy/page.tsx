import type { Metadata } from "next";
import { LegalControllerDetailsCard } from "@/app/components/legal-controller-details";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import {
  getLegalControllerDetails,
  getPrivacyPolicyContent,
} from "@/app/lib/legal/documents";
import { publicPageSeo } from "@/app/lib/seo/public-page-metadata";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const title = t("legal.privacy.title", "Privātuma politika");

  return publicPageSeo("/privacy", {
    title: `${title} — ${settings.systemName}`,
  });
}

export default async function PrivacyPolicyPage() {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);

  const content = getPrivacyPolicyContent(t, settings.systemName);
  const controller = getLegalControllerDetails(t, settings);

  return (
    <LegalDocumentView
      content={content}
      updatedAtLabel={t("legal.nav.updated_at", "Atjaunināts {date}", {
        date: content.updatedAt,
      })}
      sectionExtras={{
        controller: (
          <LegalControllerDetailsCard
            details={controller}
            labels={{
              name: t("legal.controller.label.name", "Pārzinis"),
              registrationNumber: t(
                "legal.controller.label.registration_number",
                "Reģistrācijas numurs",
              ),
              address: t("legal.controller.label.address", "Adrese"),
              email: t("legal.controller.label.email", "E-pasts"),
              supervisoryAuthority: t(
                "legal.controller.label.supervisory_authority",
                "Uzraudzības iestāde",
              ),
            }}
          />
        ),
      }}
    />
  );
}
