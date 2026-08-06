import { SectionPage } from "@/app/components/section-page";
import { SiteCompaniesModulesManager } from "@/app/components/site-companies-modules-manager";
import { addThousandSeparators } from "@/app/lib/estimates/calculate-line";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteCompanies } from "@/app/lib/site-admin/repository";
import { listCompanyFrontendModuleAssignments } from "@/app/lib/frontend-modules/company-repository";
import type { CompanyFrontendModuleAssignment } from "@/app/lib/frontend-modules/company-repository";

function formatCount(value: number): string {
  return addThousandSeparators(String(value));
}

export default async function SiteCompaniesPage() {
  await assertSystemAdminAccess();
  const [companies, { t }] = await Promise.all([
    listSiteCompanies(),
    getServerTranslations(),
  ]);

  const assignmentsEntries = await Promise.all(
    companies.map(async (company) => {
      const assignments = await listCompanyFrontendModuleAssignments(
        company.id,
      );
      return [company.id, assignments] as const;
    }),
  );
  const initialAssignmentsByCompanyId: Record<
    string,
    CompanyFrontendModuleAssignment[]
  > = Object.fromEntries(assignmentsEntries);

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
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          {t("site_companies.empty", "Nav atrasts neviens uzņēmums.")}
        </div>
      )}
    </SectionPage>
  );
}
