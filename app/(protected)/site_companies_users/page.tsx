import { SectionPage } from "@/app/components/section-page";
import { UserAvatar } from "@/app/components/user-avatar";
import { addThousandSeparators } from "@/app/lib/estimates/calculate-line";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { getServerTranslations } from "@/app/lib/i18n/server";
import type { ServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteCompanyUsers } from "@/app/lib/site-admin/repository";

function formatCount(value: number): string {
  return addThousandSeparators(String(value));
}

function roleLabel(role: string, t: ServerTranslations["t"]): string {
  if (role === "system_admin") {
    return t("roles.system_admin", "Sistēmas administrators");
  }
  if (role === "owner") return t("roles.owner", "Īpašnieks");
  if (role === "admin") return t("roles.admin", "Administrators");
  if (role === "member") return t("roles.member", "Dalībnieks");
  return t("roles.user", "Lietotājs");
}

function statusLabel(status: string, t: ServerTranslations["t"]): string {
  if (status === "disabled") return t("user_status.disabled", "Pieeja liegta");
  if (status === "invited") return t("user_status.invited", "Uzaicināts");
  return t("user_status.active", "Aktīvs");
}

function formatLastSeen(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const elapsedMs = Math.max(0, Date.now() - date.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

  if (elapsedMinutes < 60) {
    return `${Math.max(1, elapsedMinutes)} min`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${formatCount(elapsedHours)} h`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) {
    return `${formatCount(elapsedDays)} d`;
  }

  return formatDisplayDateDdMmYy(value) || "—";
}

export default async function SiteCompanyUsersPage() {
  await assertSystemAdminAccess();
  const [memberships, { t }] = await Promise.all([
    listSiteCompanyUsers(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("site_company_users.page.title", "Lietotāji")}
      subtitle={t(
        "site_company_users.page.subtitle",
        "{count} uzņēmumu lietotāju piesaistes",
        { count: formatCount(memberships.length) },
      )}
    >
      {memberships.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-5 py-3">
                    {t("site_company_users.table.user", "Lietotājs")}
                  </th>
                  <th className="px-5 py-3">
                    {t("site_company_users.table.company", "Uzņēmums")}
                  </th>
                  <th className="px-5 py-3">
                    {t("site_company_users.table.dates", "Datumi")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {memberships.map((membership) => (
                  <tr
                    key={`${membership.companyId ?? "system"}:${membership.userId}`}
                    className="align-top"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {membership.avatarUrl ? (
                          <UserAvatar
                            avatarUrl={membership.avatarUrl}
                            name={membership.userName}
                            size="sm"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900">
                            {membership.userName}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {membership.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {membership.companyLogoUrl ? (
                          <img
                            src={membership.companyLogoUrl}
                            alt={t("settings.company_logo", "Uzņēmuma logotips")}
                            className="size-9 shrink-0 rounded-lg object-contain ring-1 ring-zinc-200"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900">
                            {membership.companyName ?? "—"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {membership.roleName ?? roleLabel(membership.role, t)}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {statusLabel(membership.status, t)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-900">
                        {t("common.registered", "Reģistrēts")}{" "}
                        {formatDisplayDateDdMmYy(membership.registeredAt) || "—"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("common.edited", "Labots")}{" "}
                        {formatDisplayDateDdMmYy(membership.editedAt) || "—"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("site_company_users.last_seen", "Pēdējo reizi sistēmā")}{" "}
                        {formatLastSeen(membership.lastSeenAt)}
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
          {t(
            "site_company_users.empty",
            "Nav atrasta neviena uzņēmuma lietotāja piesaiste.",
          )}
        </div>
      )}
    </SectionPage>
  );
}
