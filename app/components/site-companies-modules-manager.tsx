"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { setCompanyFrontendModuleEnabledAction } from "@/app/(protected)/site_companies/actions";
import { AppModal } from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { CompanyFrontendModuleAssignment } from "@/app/lib/frontend-modules/company-repository";
import type { SiteCompanySummary } from "@/app/lib/site-admin/repository";
import { addThousandSeparators } from "@/app/lib/estimates/calculate-line";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";

function formatCount(value: number): string {
  return addThousandSeparators(String(value));
}

function formatCompanyName(company: SiteCompanySummary) {
  return company.settingsCompanyName || company.name || "—";
}

function moduleLabel(
  moduleKey: string,
  t: ReturnType<typeof useTranslations>["t"],
): string {
  return t(`frontend_modules.label.${moduleKey}`, moduleKey);
}

function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function SiteCompaniesModulesManager({
  companies,
  initialAssignmentsByCompanyId,
}: {
  companies: SiteCompanySummary[];
  initialAssignmentsByCompanyId: Record<
    string,
    CompanyFrontendModuleAssignment[]
  >;
}) {
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [assignmentsByCompany, setAssignmentsByCompany] = useState(
    initialAssignmentsByCompanyId,
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAssignmentsByCompany(initialAssignmentsByCompanyId);
  }, [initialAssignmentsByCompanyId]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const assignments = selectedCompanyId
    ? (assignmentsByCompany[selectedCompanyId] ?? [])
    : [];

  const assignableModules = assignments.filter(
    (module) => module.globalEnabled,
  );
  const unavailableModules = assignments.filter(
    (module) => !module.globalEnabled,
  );

  function handleToggle(moduleKey: string, nextEnabled: boolean) {
    if (!selectedCompanyId || pendingKey) return;
    clearFeedback();

    const previous = assignmentsByCompany[selectedCompanyId] ?? [];
    setAssignmentsByCompany((current) => ({
      ...current,
      [selectedCompanyId]: (current[selectedCompanyId] ?? []).map((module) =>
        module.moduleKey === moduleKey
          ? { ...module, companyEnabled: nextEnabled }
          : module,
      ),
    }));

    startTransition(async () => {
      setPendingKey(moduleKey);
      const result = await setCompanyFrontendModuleEnabledAction({
        companyId: selectedCompanyId,
        moduleKey,
        isEnabled: nextEnabled,
      });
      setPendingKey(null);

      if (!result.ok) {
        setAssignmentsByCompany((current) => ({
          ...current,
          [selectedCompanyId]: previous,
        }));
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t(
          "site_companies.modules.saved",
          "Uzņēmuma moduļa statuss saglabāts.",
        ),
      });
    });
  }

  return (
    <>
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
              {companies.map((company) => {
                const enabledCount = (
                  assignmentsByCompany[company.id] ?? []
                ).filter(
                  (module) => module.globalEnabled && module.companyEnabled,
                ).length;

                return (
                  <tr
                    key={company.id}
                    className="align-top cursor-pointer transition hover:bg-zinc-50"
                    onClick={() => {
                      clearFeedback();
                      setSelectedCompanyId(company.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        clearFeedback();
                        setSelectedCompanyId(company.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${formatCompanyName(company)} — ${t(
                      "site_companies.modules.open_hint",
                      "Atvērt moduļus",
                    )}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-xl object-contain ring-1 ring-zinc-200"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900">
                            {formatCompanyName(company)}
                          </p>
                          <div className="mt-1 space-y-0.5 text-xs text-zinc-500">
                            {company.registrationNumber.trim() ? (
                              <p>
                                {t(
                                  "site_companies.registration_number",
                                  "Reģ. Nr.",
                                )}{" "}
                                {company.registrationNumber}
                              </p>
                            ) : null}
                            {company.address.trim() ? (
                              <p>{company.address}</p>
                            ) : null}
                            {company.email.trim() || company.phone.trim() ? (
                              <p>
                                {[company.email, company.phone]
                                  .filter((value) => value.trim().length > 0)
                                  .join(" · ")}
                              </p>
                            ) : null}
                            <p className="pt-1 font-medium text-zinc-600">
                              {t(
                                "site_companies.modules.open_hint",
                                "Atvērt moduļus",
                              )}
                              {enabledCount > 0
                                ? ` · ${formatCount(enabledCount)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-900">
                        {formatCount(company.userCount)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
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
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("common.edited", "Labots")}{" "}
                        {formatDisplayDateDdMmYy(company.updatedAt) || "—"}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        open={selectedCompany !== null}
        onOpenChange={(open) => {
          if (!open && !isPending && !pendingKey) {
            setSelectedCompanyId(null);
          }
        }}
        title={t("site_companies.modules.modal_title", "Uzņēmuma moduļi")}
        description={
          selectedCompany
            ? `${formatCompanyName(selectedCompany)}. ${t(
                "site_companies.modules.modal_description",
                "Ieslēdz, ar kuriem sistēmas frontend moduļiem šis uzņēmums drīkst strādāt. Globāli izslēgtie moduļi nav pieejami.",
              )}`
            : undefined
        }
        dirty={false}
        panelMaxWidthClassName="max-w-lg"
      >
        <div className="space-y-4">
          {assignableModules.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
              {t(
                "site_companies.modules.empty",
                "Nav globāli ieslēgtu frontend moduļu, ko piešķirt uzņēmumam.",
              )}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
              {assignableModules.map((module) => {
                const label = moduleLabel(module.moduleKey, t);
                const busy = pendingKey === module.moduleKey || isPending;
                return (
                  <li
                    key={module.moduleKey}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">
                        {label}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-zinc-400">
                        {module.moduleKey}
                      </p>
                    </div>
                    <Switch
                      checked={module.companyEnabled}
                      disabled={busy}
                      label={label}
                      onChange={(checked) =>
                        handleToggle(module.moduleKey, checked)
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {unavailableModules.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t("site_companies.modules.global_off", "Globāli izslēgts")}
              </p>
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-zinc-50/80">
                {unavailableModules.map((module) => (
                  <li
                    key={module.moduleKey}
                    className="flex items-center justify-between gap-4 px-4 py-3 opacity-70"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-700">
                        {moduleLabel(module.moduleKey, t)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-zinc-400">
                        {module.moduleKey}
                      </p>
                    </div>
                    <Switch
                      checked={false}
                      disabled
                      label={moduleLabel(module.moduleKey, t)}
                      onChange={() => {}}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </AppModal>
    </>
  );
}
