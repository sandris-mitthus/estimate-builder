"use client";

import { ToggleSwitch } from "@/app/components/ui/toggle-switch";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createPaymentPlanAction,
  deletePaymentPlanAction,
  setPaymentPlansEnabledAction,
  updatePaymentPlanAction,
} from "@/app/(protected)/site_payment_plans/actions";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { FrontendModuleSummary } from "@/app/lib/frontend-modules/types";
import {
  resolveLocalizedValue,
  type LocalizedValues,
  type PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/types";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

function emptyValues(languages: SiteLanguageSummary[]): LocalizedValues {
  return Object.fromEntries(languages.map((language) => [language.code, ""]));
}

function mergeValues(
  languages: SiteLanguageSummary[],
  values: LocalizedValues,
): LocalizedValues {
  const next = emptyValues(languages);
  for (const [code, value] of Object.entries(values)) {
    next[code] = value;
  }
  return next;
}

function valuesEqual(left: LocalizedValues, right: LocalizedValues): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if ((left[key] ?? "").trim() !== (right[key] ?? "").trim()) {
      return false;
    }
  }
  return true;
}

function moduleKeysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((key) => rightSet.has(key));
}

type PlanDraft = {
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
};

function draftFromPlan(
  plan: PaymentPlanSummary | null,
  languages: SiteLanguageSummary[],
): PlanDraft {
  if (!plan) {
    return {
      planKey: "",
      nameValues: emptyValues(languages),
      descriptionValues: emptyValues(languages),
      moduleKeys: [],
    };
  }
  return {
    planKey: plan.planKey,
    nameValues: mergeValues(languages, plan.nameValues),
    descriptionValues: mergeValues(languages, plan.descriptionValues),
    moduleKeys: [...plan.moduleKeys],
  };
}

function draftsEqual(left: PlanDraft, right: PlanDraft): boolean {
  return (
    left.planKey.trim() === right.planKey.trim() &&
    valuesEqual(left.nameValues, right.nameValues) &&
    valuesEqual(left.descriptionValues, right.descriptionValues) &&
    moduleKeysEqual(left.moduleKeys, right.moduleKeys)
  );
}

function moduleLabel(
  moduleKey: string,
  t: ReturnType<typeof useTranslations>["t"],
): string {
  return t(`frontend_modules.label.${moduleKey}`, moduleKey);
}

export function SitePaymentPlansForm({
  initialEnabled,
  initialPlans,
  modules,
  languages,
}: {
  initialEnabled: boolean;
  initialPlans: PaymentPlanSummary[];
  modules: FrontendModuleSummary[];
  languages: SiteLanguageSummary[];
}) {
  const { t, languageCode } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [plans, setPlans] = useState(initialPlans);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlanSummary | null>(
    null,
  );
  const [draft, setDraft] = useState<PlanDraft>(() =>
    draftFromPlan(null, languages),
  );
  const [savedDraft, setSavedDraft] = useState<PlanDraft>(() =>
    draftFromPlan(null, languages),
  );
  const [editLang, setEditLang] = useState(
    () => languages.find((language) => language.isDefault)?.code ?? languages[0]?.code ?? "lv",
  );
  const [deleteTarget, setDeleteTarget] = useState<PaymentPlanSummary | null>(
    null,
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingKey !== null;

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  const globallyEnabledModules = useMemo(
    () => modules.filter((module) => module.isEnabled),
    [modules],
  );

  const dirty = !draftsEqual(draft, savedDraft);

  function openCreate() {
    clearFeedback();
    const next = draftFromPlan(null, languages);
    setEditingPlan(null);
    setDraft(next);
    setSavedDraft(next);
    setEditLang(
      languages.find((language) => language.isDefault)?.code ??
        languages[0]?.code ??
        "lv",
    );
    setEditorOpen(true);
  }

  function openEdit(plan: PaymentPlanSummary) {
    clearFeedback();
    const next = draftFromPlan(plan, languages);
    setEditingPlan(plan);
    setDraft(next);
    setSavedDraft(next);
    setEditLang(
      languages.find((language) => language.isDefault)?.code ??
        languages[0]?.code ??
        "lv",
    );
    setEditorOpen(true);
  }

  function closeEditor() {
    if (isBusy) return;
    setEditorOpen(false);
    setEditingPlan(null);
  }

  function handleEnabledToggle(nextEnabled: boolean) {
    clearFeedback();
    const previous = enabled;
    setEnabled(nextEnabled);

    startTransition(async () => {
      setPendingKey("enabled");
      const result = await setPaymentPlansEnabledAction(nextEnabled);
      setPendingKey(null);

      if (!result.ok) {
        setEnabled(previous);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t(
          "site_payment_plans.enable.saved",
          "Maksas plānu iestatījums saglabāts.",
        ),
      });
    });
  }

  function handleSavePlan(event: React.FormEvent) {
    event.preventDefault();
    if (!dirty || isBusy) return;
    clearFeedback();

    startTransition(async () => {
      setPendingKey(editingPlan ? `save:${editingPlan.id}` : "create");
      const input = {
        planKey: draft.planKey,
        nameValues: draft.nameValues,
        descriptionValues: draft.descriptionValues,
        moduleKeys: draft.moduleKeys,
      };
      const result = editingPlan
        ? await updatePaymentPlanAction(editingPlan.id, input)
        : await createPaymentPlanAction(input);
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setPlans((current) => {
        if (editingPlan) {
          return current.map((plan) =>
            plan.id === result.plan.id ? result.plan : plan,
          );
        }
        return [...current, result.plan].sort((left, right) => {
          if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
          }
          return left.planKey.localeCompare(right.planKey);
        });
      });
      setEditorOpen(false);
      setEditingPlan(null);
      showFeedback({
        type: "success",
        text: editingPlan
          ? t("site_payment_plans.feedback.saved", "Maksas plāns saglabāts.")
          : t(
              "site_payment_plans.feedback.created",
              "Maksas plāns izveidots.",
            ),
      });
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const planId = deleteTarget.id;

    startTransition(async () => {
      setPendingKey(`delete:${planId}`);
      const result = await deletePaymentPlanAction(planId);
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setPlans((current) => current.filter((plan) => plan.id !== planId));
      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("site_payment_plans.feedback.deleted", "Maksas plāns dzēsts."),
      });
    });
  }

  function toggleModule(moduleKey: string, checked: boolean) {
    setDraft((current) => {
      const nextKeys = checked
        ? [...new Set([...current.moduleKeys, moduleKey])]
        : current.moduleKeys.filter((key) => key !== moduleKey);
      return { ...current, moduleKeys: nextKeys };
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("site_payment_plans.enable.section", "Maksas plāni")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "site_payment_plans.enable.hint",
                "Kad ieslēgts, uzņēmuma pieejamie moduļi nāk no aktīvā maksas plāna (ja samaksāts un derīgs). Citādi izmanto individuālos uzņēmuma moduļus.",
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-700">
              {t("site_payment_plans.enable.label", "Ieslēgt maksas plānus")}
            </span>
            <ToggleSwitch
              checked={enabled}
              disabled={isBusy}
              label={t(
                "site_payment_plans.enable.label",
                "Ieslēgt maksas plānus",
              )}
              onChange={handleEnabledToggle}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            {t("site_payment_plans.list.title", "Plāni")}
          </h2>
          <button
            type="button"
            onClick={openCreate}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("site_payment_plans.actions.add", "Pievienot plānu")}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">
                  {t("site_payment_plans.form.name", "Nosaukums")}
                </th>
                <th className="px-5 py-3">
                  {t("site_payment_plans.form.modules", "Moduļi šajā plānā")}
                </th>
                <th className="px-5 py-3 text-right">
                  {t("common.actions", "Darbības")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {plans.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-sm text-zinc-500"
                  >
                    {t(
                      "site_payment_plans.list.empty",
                      "Vēl nav izveidots neviens maksas plāns.",
                    )}
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const name =
                    resolveLocalizedValue(plan.nameValues, languageCode) ||
                    plan.planKey;
                  return (
                    <tr key={plan.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-zinc-900">{name}</p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-400">
                          {plan.planKey}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600">
                        {plan.moduleKeys.length === 0
                          ? "—"
                          : plan.moduleKeys
                              .map((key) => moduleLabel(key, t))
                              .join(", ")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <IconActionButton
                            label={t("actions.edit", "Labot")}
                            icon="fas fa-pen"
                            onClick={() => openEdit(plan)}
                          />
                          <IconActionButton
                            label={t("actions.delete", "Dzēst")}
                            icon="fas fa-trash"
                            variant="delete"
                            onClick={() => setDeleteTarget(plan)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
        title={
          editingPlan
            ? t("site_payment_plans.form.edit_title", "Labot maksas plānu")
            : t("site_payment_plans.form.create_title", "Jauns maksas plāns")
        }
        dirty={dirty}
        blocking={isBusy}
        panelMaxWidthClassName="max-w-lg"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.key", "Atslēga")}
            </span>
            <input
              type="text"
              value={draft.planKey}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  planKey: event.target.value,
                }))
              }
              className={`${fieldClassName} font-mono`}
              autoComplete="off"
              spellCheck={false}
              disabled={isBusy}
            />
            <span className="mt-1 block text-xs text-zinc-500">
              {t(
                "site_payment_plans.form.key_hint",
                "Piemērs: starter, pro, enterprise",
              )}
            </span>
          </label>

          {languages.length > 1 ? (
            <div
              role="tablist"
              aria-label={t("site_languages.page.title", "Valodas")}
              className="flex flex-wrap gap-2"
            >
              {languages.map((language) => {
                const active = language.code === editLang;
                return (
                  <button
                    key={language.code}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setEditLang(language.code)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    <span>{language.name}</span>
                    <span
                      className={`font-mono text-[11px] uppercase ${
                        active ? "text-zinc-300" : "text-zinc-400"
                      }`}
                    >
                      {language.code}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.name", "Nosaukums")}
              {languages.length > 1 ? (
                <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                  ({editLang})
                </span>
              ) : null}
            </span>
            <input
              type="text"
              value={draft.nameValues[editLang] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  nameValues: {
                    ...current.nameValues,
                    [editLang]: event.target.value,
                  },
                }))
              }
              className={fieldClassName}
              disabled={isBusy}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.description", "Apraksts")}
              {languages.length > 1 ? (
                <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                  ({editLang})
                </span>
              ) : null}
            </span>
            <textarea
              value={draft.descriptionValues[editLang] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  descriptionValues: {
                    ...current.descriptionValues,
                    [editLang]: event.target.value,
                  },
                }))
              }
              rows={3}
              className={fieldClassName}
              disabled={isBusy}
            />
          </label>

          <div>
            <p className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.modules", "Moduļi šajā plānā")}
            </p>
            {globallyEnabledModules.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500">
                {t(
                  "site_payment_plans.form.modules_empty",
                  "Nav globāli ieslēgtu frontend moduļu.",
                )}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                {globallyEnabledModules.map((module) => {
                  const label = moduleLabel(module.moduleKey, t);
                  const checked = draft.moduleKeys.includes(module.moduleKey);
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
                        checked={checked}
                        disabled={isBusy}
                        label={label}
                        onChange={(next) =>
                          toggleModule(module.moduleKey, next)
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <ModalFormActions onCancel={closeEditor} cancelDisabled={isBusy}>
            <button
              type="submit"
              disabled={isBusy || !dirty}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey === "create" || pendingKey?.startsWith("save:") ? (
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
      </AppModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t(
          "site_payment_plans.delete.confirm_title",
          "Dzēst maksas plānu?",
        )}
        description={t(
          "site_payment_plans.delete.confirm_description",
          "Plāns tiks noņemts no uzņēmumiem, kuriem tas bija piešķirts.",
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={pendingKey?.startsWith("delete:") === true}
        onConfirm={handleDelete}
      />
    </div>
  );
}
