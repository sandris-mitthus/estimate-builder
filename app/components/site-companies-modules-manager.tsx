"use client";

import { ToggleSwitch } from "@/app/components/ui/toggle-switch";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  setCompanyFrontendModuleEnabledAction,
  updateCompanyPaymentPlanAction,
  updateCompanyVipAction,
} from "@/app/(protected)/site_companies/actions";
import { AppModal } from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { CompanyFrontendModuleAssignment } from "@/app/lib/frontend-modules/types";
import {
  isCompanyPaymentPlanExpired,
  resolveLocalizedValue,
  toDateInputValue,
  type PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";
import type { SiteCompanySummary } from "@/app/lib/site-admin/types";
import { addThousandSeparators } from "@/app/lib/estimates/calculate-line";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";

const fieldClassName = `mt-1.5 ${formInputFullWidthClass} ${formInputClassName()}`;

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

type CompanyPlanState = {
  paymentPlanId: string | null;
  paymentPlanUntil: string | null;
  paymentPlanPaid: boolean;
  paymentPlanIsTrial: boolean;
  accessBlocked: boolean;
};

function planStateFromCompany(company: SiteCompanySummary): CompanyPlanState {
  return {
    paymentPlanId: company.paymentPlanId,
    paymentPlanUntil: company.paymentPlanUntil,
    paymentPlanPaid: company.paymentPlanPaid,
    paymentPlanIsTrial: company.paymentPlanIsTrial,
    accessBlocked: company.accessBlocked,
  };
}

const emptyPlanState: CompanyPlanState = {
  paymentPlanId: null,
  paymentPlanUntil: null,
  paymentPlanPaid: false,
  paymentPlanIsTrial: false,
  accessBlocked: false,
};

export function SiteCompaniesModulesManager({
  companies,
  initialAssignmentsByCompanyId,
  paymentPlansEnabled = false,
  paymentPlans = [],
}: {
  companies: SiteCompanySummary[];
  initialAssignmentsByCompanyId: Record<
    string,
    CompanyFrontendModuleAssignment[]
  >;
  paymentPlansEnabled?: boolean;
  paymentPlans?: PaymentPlanSummary[];
}) {
  const { t, languageCode } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [assignmentsByCompany, setAssignmentsByCompany] = useState(
    initialAssignmentsByCompanyId,
  );
  const [planByCompany, setPlanByCompany] = useState<
    Record<string, CompanyPlanState>
  >(() =>
    Object.fromEntries(
      companies.map((company) => [company.id, planStateFromCompany(company)]),
    ),
  );
  const [vipByCompany, setVipByCompany] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        companies.map((company) => [company.id, company.isVip === true]),
      ),
  );
  const [planDraft, setPlanDraft] = useState<CompanyPlanState | null>(null);
  const [planSaved, setPlanSaved] = useState<CompanyPlanState | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAssignmentsByCompany(initialAssignmentsByCompanyId);
  }, [initialAssignmentsByCompanyId]);

  useEffect(() => {
    setPlanByCompany(
      Object.fromEntries(
        companies.map((company) => [company.id, planStateFromCompany(company)]),
      ),
    );
    setVipByCompany(
      Object.fromEntries(
        companies.map((company) => [company.id, company.isVip === true]),
      ),
    );
  }, [companies]);

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

  const planDirty =
    planDraft !== null &&
    planSaved !== null &&
    (planDraft.paymentPlanId !== planSaved.paymentPlanId ||
      (planDraft.paymentPlanUntil ?? "") !== (planSaved.paymentPlanUntil ?? "") ||
      planDraft.paymentPlanPaid !== planSaved.paymentPlanPaid ||
      planDraft.accessBlocked !== planSaved.accessBlocked);

  const plansById = useMemo(
    () => new Map(paymentPlans.map((plan) => [plan.id, plan])),
    [paymentPlans],
  );

  function openCompany(companyId: string) {
    clearFeedback();
    setSelectedCompanyId(companyId);
    if (paymentPlansEnabled) {
      const current = planByCompany[companyId] ?? emptyPlanState;
      setPlanDraft({ ...current });
      setPlanSaved({ ...current });
    }
  }

  function closeModal() {
    if (isPending || pendingKey) return;
    setSelectedCompanyId(null);
    setPlanDraft(null);
    setPlanSaved(null);
  }

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

  function handleVipToggle(
    companyId: string,
    nextVip: boolean,
    event?: React.MouseEvent,
  ) {
    event?.stopPropagation();
    if (pendingKey) return;
    clearFeedback();

    const previous = vipByCompany[companyId] === true;
    setVipByCompany((state) => ({ ...state, [companyId]: nextVip }));

    startTransition(async () => {
      setPendingKey(`vip:${companyId}`);
      const result = await updateCompanyVipAction(companyId, nextVip);
      setPendingKey(null);

      if (!result.ok) {
        setVipByCompany((state) => ({ ...state, [companyId]: previous }));
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: nextVip
          ? t(
              "site_companies.vip.on",
              "VIP ieslēgts — maksas plāna ierobežojumi neattiecas.",
            )
          : t("site_companies.vip.off", "VIP izslēgts."),
      });
    });
  }

  function handlePaidToggle(
    companyId: string,
    nextPaid: boolean,
    event?: React.MouseEvent,
  ) {
    event?.stopPropagation();
    if (pendingKey) return;
    clearFeedback();

    const current = planByCompany[companyId] ?? emptyPlanState;
    const previous = { ...current };
    // Any explicit admin decision ends the signup trial, mirroring the server.
    const next = {
      ...current,
      paymentPlanPaid: nextPaid,
      paymentPlanIsTrial: false,
    };

    setPlanByCompany((state) => ({ ...state, [companyId]: next }));
    if (selectedCompanyId === companyId && planDraft) {
      setPlanDraft({ ...next });
      setPlanSaved({ ...next });
    }

    startTransition(async () => {
      setPendingKey(`paid:${companyId}`);
      const result = await updateCompanyPaymentPlanAction(companyId, next);
      setPendingKey(null);

      if (!result.ok) {
        setPlanByCompany((state) => ({ ...state, [companyId]: previous }));
        if (selectedCompanyId === companyId) {
          setPlanDraft({ ...previous });
          setPlanSaved({ ...previous });
        }
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t(
          "site_companies.plan.saved",
          "Uzņēmuma maksas plāns saglabāts.",
        ),
      });
    });
  }

  function handleAccessBlockedToggle(
    companyId: string,
    nextBlocked: boolean,
    event?: React.MouseEvent,
  ) {
    event?.stopPropagation();
    if (pendingKey) return;
    clearFeedback();

    const current = planByCompany[companyId] ?? emptyPlanState;
    const previous = { ...current };
    const next = {
      ...current,
      accessBlocked: nextBlocked,
      paymentPlanIsTrial: false,
    };

    setPlanByCompany((state) => ({ ...state, [companyId]: next }));
    if (selectedCompanyId === companyId && planDraft) {
      setPlanDraft({ ...next });
      setPlanSaved({ ...next });
    }

    startTransition(async () => {
      setPendingKey(`blocked:${companyId}`);
      const result = await updateCompanyPaymentPlanAction(companyId, next);
      setPendingKey(null);

      if (!result.ok) {
        setPlanByCompany((state) => ({ ...state, [companyId]: previous }));
        if (selectedCompanyId === companyId) {
          setPlanDraft({ ...previous });
          setPlanSaved({ ...previous });
        }
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t(
          "site_companies.plan.saved",
          "Uzņēmuma maksas plāns saglabāts.",
        ),
      });
    });
  }

  function handleSavePlan(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCompanyId || !planDraft || !planDirty || pendingKey) return;
    clearFeedback();

    const companyId = selectedCompanyId;
    const previous = planByCompany[companyId];
    const next = {
      paymentPlanId: planDraft.paymentPlanId?.trim() || null,
      paymentPlanUntil: planDraft.paymentPlanUntil?.trim() || null,
      paymentPlanPaid: planDraft.paymentPlanPaid,
      paymentPlanIsTrial: false,
      accessBlocked: planDraft.accessBlocked,
    };

    setPlanByCompany((state) => ({ ...state, [companyId]: next }));

    startTransition(async () => {
      setPendingKey(`plan:${companyId}`);
      const result = await updateCompanyPaymentPlanAction(companyId, next);
      setPendingKey(null);

      if (!result.ok) {
        if (previous) {
          setPlanByCompany((state) => ({ ...state, [companyId]: previous }));
        }
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setPlanSaved({ ...next });
      setPlanDraft({ ...next });
      showFeedback({
        type: "success",
        text: t(
          "site_companies.plan.saved",
          "Uzņēmuma maksas plāns saglabāts.",
        ),
      });
    });
  }

  function renderPlanCell(company: SiteCompanySummary) {
    const state = planByCompany[company.id] ?? planStateFromCompany(company);
    const plan = state.paymentPlanId
      ? plansById.get(state.paymentPlanId)
      : undefined;
    const planName = plan
      ? resolveLocalizedValue(plan.nameValues, languageCode) || plan.planKey
      : t("site_companies.plan.none", "Nav plāna");
    const expired = isCompanyPaymentPlanExpired({
      paymentPlanUntil: state.paymentPlanUntil,
    });

    return (
      <td className="px-5 py-4">
        <p className="font-semibold text-zinc-900">{planName}</p>
        {state.paymentPlanIsTrial ? (
          <span className="mt-2 inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
            {t("site_companies.plan.trial", "Izmēģinājums")}
          </span>
        ) : (
          <button
            type="button"
            onClick={(event) =>
              handlePaidToggle(company.id, !state.paymentPlanPaid, event)
            }
            disabled={pendingKey === `paid:${company.id}` || isPending}
            className={`mt-2 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              state.paymentPlanPaid
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            {state.paymentPlanPaid
              ? t("site_companies.plan.paid", "Samaksāts")
              : t("site_companies.plan.unpaid", "Nav samaksāts")}
          </button>
        )}
        <p className="mt-2 text-xs text-zinc-500">
          {t("site_companies.plan.until", "Līdz")}{" "}
          {state.paymentPlanUntil
            ? formatDisplayDateDdMmYy(state.paymentPlanUntil) || "—"
            : "—"}
          {expired
            ? ` · ${t("site_companies.plan.expired", "Beidzies")}`
            : null}
        </p>
        <div
          className="mt-3 flex items-center justify-between gap-3"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-700">
              {t("site_companies.plan.access_blocked", "Bloķēt pieeju")}
            </p>
            {state.accessBlocked ? (
              <p className="mt-0.5 text-[11px] font-semibold text-red-600">
                {t(
                  "site_companies.plan.access_blocked_on",
                  "Pieeja bloķēta",
                )}
              </p>
            ) : null}
          </div>
          <ToggleSwitch
            checked={state.accessBlocked}
            disabled={
              pendingKey === `blocked:${company.id}` || isPending
            }
            label={t("site_companies.plan.access_blocked", "Bloķēt pieeju")}
            onChange={(checked) =>
              handleAccessBlockedToggle(company.id, checked)
            }
          />
        </div>
      </td>
    );
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
                {paymentPlansEnabled ? (
                  <th className="px-5 py-3">
                    {t("site_companies.table.plan", "Maksas plāns")}
                  </th>
                ) : null}
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
                const isVip = vipByCompany[company.id] === true;
                const enabledCount = (
                  assignmentsByCompany[company.id] ?? []
                ).filter(
                  (module) => module.globalEnabled && module.companyEnabled,
                ).length;
                const showModuleCount =
                  (!paymentPlansEnabled || isVip) && enabledCount > 0;

                return (
                  <tr
                    key={company.id}
                    className="align-top cursor-pointer transition hover:bg-zinc-50"
                    onClick={() => openCompany(company.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openCompany(company.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${formatCompanyName(company)} — ${
                      paymentPlansEnabled
                        ? t(
                            "site_companies.plan.open_hint",
                            "Atvērt maksas plānu",
                          )
                        : t(
                            "site_companies.modules.open_hint",
                            "Atvērt moduļus",
                          )
                    }`}
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
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-zinc-900">
                              {formatCompanyName(company)}
                            </p>
                            <button
                              type="button"
                              onClick={(event) =>
                                handleVipToggle(company.id, !isVip, event)
                              }
                              disabled={
                                pendingKey === `vip:${company.id}` || isPending
                              }
                              aria-pressed={isVip}
                              aria-label={t("site_companies.vip.label", "VIP")}
                              title={t("site_companies.vip.label", "VIP")}
                              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <i
                                className={`fas fa-star text-sm ${
                                  isVip
                                    ? "text-amber-400"
                                    : "text-zinc-300"
                                }`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
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
                              {paymentPlansEnabled
                                ? t(
                                    "site_companies.plan.open_hint",
                                    "Atvērt maksas plānu",
                                  )
                                : t(
                                    "site_companies.modules.open_hint",
                                    "Atvērt moduļus",
                                  )}
                              {showModuleCount
                                ? ` · ${formatCount(enabledCount)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    {paymentPlansEnabled ? renderPlanCell(company) : null}
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

      {paymentPlansEnabled ? (
        <AppModal
          open={selectedCompany !== null && planDraft !== null}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          title={t(
            "site_companies.plan.modal_title",
            "Uzņēmuma maksas plāns",
          )}
          description={
            selectedCompany
              ? `${formatCompanyName(selectedCompany)}. ${t(
                  "site_companies.plan.modal_description",
                  "Izvēlies plānu, derīguma termiņu un samaksas statusu.",
                )}`
              : undefined
          }
          dirty={planDirty}
          blocking={isPending || pendingKey !== null}
          panelMaxWidthClassName="max-w-lg"
        >
          {planDraft ? (
            <form onSubmit={handleSavePlan} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">
                  {t("site_companies.plan.field_plan", "Plāns")}
                </span>
                <div className="relative mt-1.5">
                  <select
                    value={planDraft.paymentPlanId ?? ""}
                    onChange={(event) =>
                      setPlanDraft((current) =>
                        current
                          ? {
                              ...current,
                              paymentPlanId: event.target.value || null,
                            }
                          : current,
                      )
                    }
                    className={`${formInputFullWidthClass} ${formInputClassName()} appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
                    disabled={isPending || pendingKey !== null}
                  >
                    <option value="">
                      {t("site_companies.plan.none", "Nav plāna")}
                    </option>
                    {paymentPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {resolveLocalizedValue(plan.nameValues, languageCode) ||
                          plan.planKey}
                      </option>
                    ))}
                  </select>
                  <i
                    className="fas fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-800">
                  {t("site_companies.plan.field_until", "Derīgs līdz")}
                </span>
                <input
                  type="date"
                  value={toDateInputValue(planDraft.paymentPlanUntil)}
                  onChange={(event) =>
                    setPlanDraft((current) =>
                      current
                        ? {
                            ...current,
                            paymentPlanUntil: event.target.value || null,
                          }
                        : current,
                    )
                  }
                  className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
                  disabled={isPending || pendingKey !== null}
                />
              </label>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
                <span className="text-sm font-medium text-zinc-800">
                  {t("site_companies.plan.field_paid", "Samaksāts")}
                </span>
                <ToggleSwitch
                  checked={planDraft.paymentPlanPaid}
                  disabled={isPending || pendingKey !== null}
                  label={t("site_companies.plan.field_paid", "Samaksāts")}
                  onChange={(checked) =>
                    setPlanDraft((current) =>
                      current
                        ? { ...current, paymentPlanPaid: checked }
                        : current,
                    )
                  }
                />
              </div>

              <div className="rounded-xl border border-zinc-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-800">
                    {t("site_companies.plan.access_blocked", "Bloķēt pieeju")}
                  </span>
                  <ToggleSwitch
                    checked={planDraft.accessBlocked}
                    disabled={isPending || pendingKey !== null}
                    label={t(
                      "site_companies.plan.access_blocked",
                      "Bloķēt pieeju",
                    )}
                    onChange={(checked) =>
                      setPlanDraft((current) =>
                        current
                          ? { ...current, accessBlocked: checked }
                          : current,
                      )
                    }
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {t(
                    "site_companies.plan.access_blocked_hint",
                    "Ārpuskārtas drošības slēdzis — liedz pieeju sistēmai arī pārbaudes laikā.",
                  )}
                </p>
              </div>

              {selectedCompanyId &&
              vipByCompany[selectedCompanyId] === true ? (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {t(
                        "site_companies.vip.modules_section",
                        "Moduļi (VIP)",
                      )}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {t(
                        "site_companies.vip.modules_hint",
                        "VIP uzņēmumam joprojām darbojas individuālie moduļu slēdži.",
                      )}
                    </p>
                  </div>
                  {assignableModules.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
                      {t(
                        "site_companies.modules.empty",
                        "Nav globāli ieslēgtu frontend moduļu, ko piešķirt uzņēmumam.",
                      )}
                    </p>
                  ) : (
                    <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                      {assignableModules.map((module) => {
                        const label = moduleLabel(module.moduleKey, t);
                        const busy =
                          pendingKey === module.moduleKey || isPending;
                        return (
                          <li
                            key={module.moduleKey}
                            className="flex items-center justify-between gap-4 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900">
                                {label}
                              </p>
                              <p className="mt-0.5 font-mono text-xs text-zinc-400">
                                {module.moduleKey}
                              </p>
                            </div>
                            <ToggleSwitch
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
                </div>
              ) : null}

              <ModalFormActions
                onCancel={closeModal}
                cancelDisabled={isPending || pendingKey !== null}
              >
                <button
                  type="submit"
                  disabled={isPending || pendingKey !== null || !planDirty}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingKey?.startsWith("plan:") ? (
                    <span className="inline-flex items-center gap-2">
                      <i
                        className="fas fa-circle-notch fa-spin text-xs"
                        aria-hidden="true"
                      />
                      {t("actions.save", "Saglabāt")}
                    </span>
                  ) : (
                    t("actions.save", "Saglabāt")
                  )}
                </button>
              </ModalFormActions>
            </form>
          ) : null}
        </AppModal>
      ) : (
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
                      <ToggleSwitch
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
                      <ToggleSwitch
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
      )}
    </>
  );
}
