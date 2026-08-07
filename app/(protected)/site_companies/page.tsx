import { SectionPage } from "@/app/components/section-page";
import { SiteCompaniesModulesManager } from "@/app/components/site-companies-modules-manager";
import { addThousandSeparators } from "@/app/lib/estimates/calculate-line";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteCompanies } from "@/app/lib/site-admin/repository";
import { listCompanyFrontendModuleAssignmentsForCompanies } from "@/app/lib/frontend-modules/company-repository";
import {
  isPaymentPlansEnabled,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";

function formatCount(value: number): string {
  return addThousandSeparators(String(value));
}

export default async function SiteCompaniesPage() {
  await assertSystemAdminAccess();
  const [companies, paymentPlansEnabled, paymentPlans, { t }] =
    await Promise.all([
      listSiteCompanies(),
      isPaymentPlansEnabled(),
      listPaymentPlans(),
      getServerTranslations(),
    ]);

  // Always load company module assignments: used when plans are OFF, and for VIP
  // companies when plans are ON (VIP still uses individual module switches).
  // Batched: one modules catalog + one IN query (not N+1 per company).
  const initialAssignmentsByCompanyId =
    companies.length > 0
      ? await listCompanyFrontendModuleAssignmentsForCompanies(
          companies.map((company) => company.id),
        )
      : {};

  return (
    <SectionPage
      title={t("site_companies.page.title", "Uzņēmumi")}
      subtitle={t("site_companies.page.subtitle", "{count} uzņēmumi sistēmā", {
        count: formatCount(companies.length),
      })}
    >
      {companies.length > 0 ? (
        <SiteCompaniesModulesManager
          companies={companies}
          initialAssignmentsByCompanyId={initialAssignmentsByCompanyId}
          paymentPlansEnabled={paymentPlansEnabled}
          paymentPlans={paymentPlans}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          {t("site_companies.empty", "Nav atrasts neviens uzņēmums.")}
        </div>
      )}
    </SectionPage>
  );
}
