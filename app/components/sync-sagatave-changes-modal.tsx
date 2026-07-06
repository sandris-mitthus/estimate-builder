"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useTranslations } from "@/app/components/translations-provider";
import type {
  SagataveChangeField,
  SagatavePositionChange,
} from "@/app/lib/estimate-positions/sagatave-position-changes";

type SyncSagataveChangesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: SagatavePositionChange[];
  disabled?: boolean;
  onConfirm: (selectedChangeIds: Set<string>) => void;
};

type ChangeGroup = {
  key: string;
  categoryTitle: string;
  subcategoryTitle?: string;
  positionName: string;
  changes: SagatavePositionChange[];
};

const FIELD_LABEL_KEYS: Record<SagataveChangeField, string> = {
  name: "estimate.sagatave.change_field.name",
  unit: "estimate.sagatave.change_field.unit",
  note: "estimate.sagatave.change_field.note",
  laborTimeNorm: "estimate.sagatave.change_field.labor_time_norm",
  variableQuantity: "estimate.sagatave.change_field.variable_quantity",
  manualUnit: "estimate.sagatave.change_field.manual_unit",
  moduleSizeAttachment: "estimate.sagatave.change_field.module_size",
  customHourlyRate: "estimate.sagatave.change_field.custom_hourly_rate",
  hiddenPriceInOffer: "estimate.sagatave.change_field.hidden_price_in_offer",
  showOnlyTotalPrice: "estimate.sagatave.change_field.show_only_total_price",
  requiresAttention: "estimate.sagatave.change_field.requires_attention",
  attentionBudget: "estimate.sagatave.change_field.attention_budget",
  materials: "estimate.sagatave.change_field.materials",
  mechanisms: "estimate.sagatave.change_field.mechanisms",
  multiName: "estimate.sagatave.change_field.multi_name",
  multiNote: "estimate.sagatave.change_field.multi_note",
  multiRequiresAttention: "estimate.sagatave.change_field.multi_requires_attention",
  multiAttentionBudget: "estimate.sagatave.change_field.multi_attention_budget",
  hiddenInOffer: "estimate.sagatave.change_field.hidden_in_offer",
  hiddenPricesInOffer: "estimate.sagatave.change_field.hidden_prices_in_offer",
};

const FIELD_LABEL_FALLBACKS: Record<SagataveChangeField, string> = {
  name: "Nosaukums",
  unit: "Mērvienība",
  note: "Piezīme",
  laborTimeNorm: "Laika norma",
  variableQuantity: "Individuāls apjoms",
  manualUnit: "Manuālā mērvienība",
  moduleSizeAttachment: "Moduļa lieluma piesaiste",
  customHourlyRate: "Individuālā stundas likme",
  hiddenPriceInOffer: "Cena paslēpta piedāvājumā",
  showOnlyTotalPrice: "Rādīt tikai gala summu",
  requiresAttention: "Īpaša uzmanība",
  attentionBudget: "Aptuvens budžets",
  materials: "Materiāli",
  mechanisms: "Mehānismi",
  multiName: "Multi nosaukums",
  multiNote: "Multi piezīme",
  multiRequiresAttention: "Multi īpaša uzmanība",
  multiAttentionBudget: "Multi aptuvens budžets",
  hiddenInOffer: "Pozīcijas paslēptas piedāvājumā",
  hiddenPricesInOffer: "Cenas paslēptas piedāvājumā",
};

function groupChanges(changes: SagatavePositionChange[]): ChangeGroup[] {
  const groups = new Map<string, ChangeGroup>();

  for (const change of changes) {
    const key = [
      change.categoryTitle,
      change.subcategoryTitle ?? "",
      change.positionName,
    ].join("\0");

    const existing = groups.get(key);
    if (existing) {
      existing.changes.push(change);
      continue;
    }

    groups.set(key, {
      key,
      categoryTitle: change.categoryTitle,
      subcategoryTitle: change.subcategoryTitle,
      positionName: change.positionName,
      changes: [change],
    });
  }

  return Array.from(groups.values());
}

function formatChangeValue(
  field: SagataveChangeField,
  value: string | number | boolean | null,
  t: (key: string, fallback: string, params?: Record<string, string | number>) => string,
): string {
  if (value === null || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value
      ? t("common.yes", "Jā")
      : t("common.no", "Nē");
  }

  if (field === "materials" || field === "mechanisms") {
    if (value === "current") {
      return t("estimate.sagatave.change_current_list", "Pašreizējais");
    }
    if (value === "template") {
      return t("estimate.sagatave.change_template_list", "No sagataves");
    }
  }

  if (field === "moduleSizeAttachment") {
    return t("estimate.sagatave.change_module_size_set", "Mainīta");
  }

  return String(value);
}

export function SyncSagataveChangesModal({
  open,
  onOpenChange,
  changes,
  disabled = false,
  onConfirm,
}: SyncSagataveChangesModalProps) {
  const { t } = useTranslations();
  const allChangeIds = useMemo(
    () => new Set(changes.map((change) => change.changeId)),
    [changes],
  );
  const groupedChanges = useMemo(() => groupChanges(changes), [changes]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(allChangeIds));

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(allChangeIds));
    }
  }, [open, allChangeIds]);

  const dirty = useMemo(() => {
    if (selectedIds.size !== allChangeIds.size) {
      return true;
    }

    for (const changeId of allChangeIds) {
      if (!selectedIds.has(changeId)) {
        return true;
      }
    }

    return false;
  }, [allChangeIds, selectedIds]);

  function toggleChange(changeId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedIds.size === 0 || disabled) {
      return;
    }

    onConfirm(selectedIds);
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("estimate.sagatave.sync_title", "Izmaiņas no sagataves")}
      description={t(
        "estimate.sagatave.sync_description",
        "Atzīmē izmaiņas, kuras pielāgot šai tāmei",
      )}
      blocking={disabled}
      dirty={dirty}
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-h-[min(24rem,calc(100vh-14rem))] space-y-4 overflow-y-auto pr-1">
          {groupedChanges.map((group) => (
            <section
              key={group.key}
              className="rounded-xl border border-zinc-200 bg-zinc-50/80"
            >
              <header className="border-b border-zinc-200 px-3 py-2">
                <p className="text-sm font-semibold text-zinc-800">{group.categoryTitle}</p>
                {group.subcategoryTitle ? (
                  <p className="text-xs text-zinc-500">{group.subcategoryTitle}</p>
                ) : null}
                <p className="mt-0.5 text-sm text-zinc-700">{group.positionName}</p>
              </header>
              <ul className="divide-y divide-zinc-100">
                {group.changes.map((change) => {
                  const checked = selectedIds.has(change.changeId);
                  const fieldLabel = t(
                    FIELD_LABEL_KEYS[change.field],
                    FIELD_LABEL_FALLBACKS[change.field],
                  );
                  const fromDisplay = formatChangeValue(change.field, change.fromValue, t);
                  const toDisplay = formatChangeValue(change.field, change.toValue, t);

                  return (
                    <li key={change.changeId}>
                      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-white">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleChange(change.changeId)}
                        />
                        <span className="min-w-0 break-words">
                          <span className="font-medium text-zinc-900">{fieldLabel}</span>
                          {": "}
                          <span className="text-zinc-500">{fromDisplay}</span>
                          {" → "}
                          <span className="text-zinc-900">{toDisplay}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <ModalFormActions
          onCancel={() => onOpenChange(false)}
          cancelDisabled={disabled}
        >
          <button
            type="submit"
            disabled={disabled || selectedIds.size === 0}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("estimate.sagatave.apply_selected", "Pielāgot izvēlētās")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
