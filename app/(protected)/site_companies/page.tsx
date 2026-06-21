import { SectionPage } from "@/app/components/section-page";
import { addThousandSeparators } from "@/app/lib/estimates/calculate-line";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteCompanies } from "@/app/lib/site-admin/repository";

function formatCount(value: number): string {
  return addThousandSeparators(String(value));
}

function formatCompanyName(company: Awaited<ReturnType<typeof listSiteCompanies>>[number]) {
  return company.settingsCompanyName || company.name || "—";
}

export default async function SiteCompaniesPage() {
  await assertSystemAdminAccess();
  const [companies, { t }] = await Promise.all([
    listSiteCompanies(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("site_companies.page.title", "Uzņēmumi")}
      subtitle={t("site_companies.page.subtitle", "{count} uzņēmumi sistēmā", {
        count: formatCount(companies.length),
      })}
    >
      {companies.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-5 py-3">
                    {t("site_companies.table.company", "Uzņēmums")}
                  </th>
                  <th className="px-5 py-3">
                    {t("site_companies.table.users", "Lietotāji")}
                  </th>
                  <th className="px-5 py-3">
                    {t("site_companies.table.dates", "Datumi")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {companies.map((company) => (
                  <tr key={company.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-900">
                        {formatCompanyName(company)}
                      </p>
                      <div className="mt-1 space-y-0.5 text-sm text-zinc-500">
                        {company.registrationNumber.trim() ? (
                          <p>
                            {t("site_companies.registration_number", "Reģ. Nr.")}{" "}
                            {company.registrationNumber}
                          </p>
                        ) : null}
                        {company.address.trim() ? <p>{company.address}</p> : null}
                        {company.email.trim() || company.phone.trim() ? (
                          <p>
                            {[company.email, company.phone]
                              .filter((value) => value.trim().length > 0)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-900">
                        {formatCount(company.userCount)}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {t("site_companies.active_users", "{count} aktīvi", {
                          count: formatCount(company.activeUserCount),
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-900">
                        {t("common.registered", "Reģistrēts")}{" "}
                        {formatDisplayDateDdMmYy(company.createdAt) || "—"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {t("common.edited", "Labots")}{" "}
                        {formatDisplayDateDdMmYy(company.updatedAt) || "—"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          {t("site_companies.empty", "Nav atrasts neviens uzņēmums.")}
        </div>
      )}
    </SectionPage>
  );
}
