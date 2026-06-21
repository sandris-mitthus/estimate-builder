"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { CatalogHintField } from "@/app/components/catalog-hint-field";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LaborTimeNormInput } from "@/app/components/labor-time-norm-input";
import { MaterialConsumptionInput } from "@/app/components/material-consumption-input";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { ModuleSizeAttachPicker } from "@/app/components/module-size-attach-picker";
import { PositionManualUnitField } from "@/app/components/position-manual-unit-field";
import { PositionVariableQuantityField } from "@/app/components/position-variable-quantity-field";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatAmountDisplay,
  roundToTwoDecimals,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import {
  deriveCompositeUnitPrice,
  resolveEffectiveMaterials,
  resolveEffectiveMechanisms,
} from "@/app/lib/estimates/composite-line-item";
import { buildManualUnitSelectOptions } from "@/app/lib/estimates/collect-estimate-document-units";
import {
  resolveCompositeLineItemDisplayUnit,
  resolveLineItemDisplayUnitFromModuleSize,
} from "@/app/lib/estimates/sync-module-size-quantities";
import type {
  EstimateLineItem,
  LineItemCatalogRef,
  LineItemModuleSizeAttachment,
} from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type PositionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: EstimateLineItem;
  onSave: (value: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  estimateUnits?: string[];
};

const labelClassName = "mb-1 block text-sm font-medium text-zinc-700";
const inputClassName =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none";

/** Migrē vecos singular laukus uz masīviem pirms rediģēšanas. */
function prepareDraft(item: EstimateLineItem): EstimateLineItem {
  return {
    ...item,
    materials: item.materials ?? (item.material ? [item.material] : []),
    mechanisms: item.mechanisms ?? (item.mechanism ? [item.mechanism] : []),
    material: undefined,
    mechanism: undefined,
  };
}

function snapshot(item: EstimateLineItem): string {
  return JSON.stringify({
    name: item.name.trim(),
    laborTimeNorm: item.laborTimeNorm ?? 0,
    materials: item.materials ?? [],
    mechanisms: item.mechanisms ?? [],
    moduleSizeAttachment: item.moduleSizeAttachment ?? null,
    variableQuantity: item.variableQuantity ?? false,
    manualUnitEnabled: item.manualUnitEnabled ?? false,
    manualUnit: item.manualUnit ?? "",
  });
}

export function PositionModal({
  open,
  onOpenChange,
  value,
  onSave,
  catalogPositions,
  defaultHourlyRate,
  moduleSizeOptions,
  estimateUnits = [],
}: PositionModalProps) {
  const { t } = useTranslations();
  const [draft, setDraft] = useState<EstimateLineItem>(() => prepareDraft(value));
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    snapshot(prepareDraft(value)),
  );
  const [materialAddKey, setMaterialAddKey] = useState(0);
  const [mechanismAddKey, setMechanismAddKey] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prepared = prepareDraft(value);
    setDraft(prepared);
    setInitialSnapshot(snapshot(prepared));
    setMaterialAddKey((k) => k + 1);
    setMechanismAddKey((k) => k + 1);
  }, [open, value]);

  const materialPositions = useMemo(
    () => catalogPositions.filter((position) => position.costType === "materials"),
    [catalogPositions],
  );
  const mechanismPositions = useMemo(
    () =>
      catalogPositions.filter((position) => position.costType === "mechanisms"),
    [catalogPositions],
  );

  const unitPrice = useMemo(
    () => deriveCompositeUnitPrice(draft, catalogPositions, defaultHourlyRate),
    [draft, catalogPositions, defaultHourlyRate],
  );
  const unitTotal = sumBreakdown(unitPrice);
  const dirty = snapshot(draft) !== initialSnapshot;

  function patch(updates: Partial<EstimateLineItem>) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function removeMaterial(index: number) {
    patch({
      materials: (draft.materials ?? []).filter((_, i) => i !== index),
    });
  }

  function addMaterial(ref: LineItemCatalogRef) {
    patch({ materials: [...(draft.materials ?? []), ref] });
    setMaterialAddKey((k) => k + 1);
  }

  function updateMaterialConsumption(index: number, consumption: number) {
    patch({
      materials: (draft.materials ?? []).map((mat, i) =>
        i === index ? { ...mat, consumption } : mat,
      ),
    });
  }

  function removeMechanism(index: number) {
    patch({
      mechanisms: (draft.mechanisms ?? []).filter((_, i) => i !== index),
    });
  }

  function addMechanism(ref: LineItemCatalogRef) {
    patch({ mechanisms: [...(draft.mechanisms ?? []), ref] });
    setMechanismAddKey((k) => k + 1);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Kad variableQuantity = true, mērvienība no pirmā materiāla (ja ir), citādi draft.unit vai "gab."
    const resolvedVariableUnit = (() => {
      const firstMaterial = (draft.materials ?? [])[0];
      if (firstMaterial?.unit.trim()) return firstMaterial.unit.trim();
      return draft.unit.trim() || "gab.";
    })();

    const normalized: EstimateLineItem = {
      ...draft,
      name: draft.name.trim(),
      unit: draft.variableQuantity
        ? resolvedVariableUnit
        : draft.manualUnitEnabled && draft.manualUnit?.trim()
          ? draft.manualUnit.trim()
          : (resolveLineItemDisplayUnitFromModuleSize(draft, moduleSizeOptions) ??
            "gab."),
      laborTimeNorm: roundToTwoDecimals(draft.laborTimeNorm ?? 0),
      materials: draft.materials ?? [],
      mechanisms: draft.mechanisms ?? [],
      material: undefined,
      mechanism: undefined,
      unitPrice: deriveCompositeUnitPrice(
        draft,
        catalogPositions,
        defaultHourlyRate,
      ),
    };

    onSave(normalized);
    onOpenChange(false);
  }

  const draftMaterials = resolveEffectiveMaterials(draft);
  const draftMechanisms = resolveEffectiveMechanisms(draft);
  const positionUnit = resolveCompositeLineItemDisplayUnit(draft, moduleSizeOptions);
  const manualUnitOptions = useMemo(
    () => buildManualUnitSelectOptions(estimateUnits, draft.manualUnit ?? ""),
    [estimateUnits, draft.manualUnit],
  );

  function handleManualUnitEnabledChange(manualUnitEnabled: boolean) {
    if (!manualUnitEnabled) {
      patch({ manualUnitEnabled });
      return;
    }

    const nextUnit =
      draft.manualUnit?.trim() ||
      resolveLineItemDisplayUnitFromModuleSize(draft, moduleSizeOptions) ||
      manualUnitOptions[0] ||
      "gab.";

    patch({
      manualUnitEnabled,
      manualUnit: nextUnit,
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("positions.modal.title", "Pozīcija")}
      description={t(
        "positions.modal.description",
        "Definē nosaukumu, apjomu, laika normu, materiālus un mehānismus.",
      )}
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      dirty={dirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_10rem] gap-3">
          <label className="block">
            <span className={labelClassName}>{t("common.name", "Nosaukums")}</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
              className={inputClassName}
              placeholder={t("positions.modal.name_placeholder", "piem. Sienas mūrēšana")}
              autoFocus
            />
          </label>
          <label className="block">
            <span className={labelClassName}>{t("estimate.time_norm", "Laika norma (c/h)")}</span>
            <LaborTimeNormInput
              value={draft.laborTimeNorm ?? 0}
              onChange={(laborTimeNorm) => patch({ laborTimeNorm })}
              withStepper
              stepperButtonsAlwaysVisible
            />
            {defaultHourlyRate != null ? (
              <span className="mt-1 block text-xs text-zinc-500">
                {t("estimate.labor_rate_display", "Darbs = {rate} €/h", {
                  rate: formatAmountDisplay(defaultHourlyRate),
                })}
              </span>
            ) : null}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Materiāli */}
          <div>
            <span className={labelClassName}>{t("estimate.column.materials", "Materiāli")}</span>
            <div className="space-y-1.5">
              {draftMaterials.map((mat, index) => {
                const showConsumption =
                  positionUnit != null &&
                  mat.unit.trim() !== positionUnit;
                return (
                  <div
                    key={`${mat.positionPriceId}-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-zinc-800">
                      {mat.name}
                    </span>
                    {showConsumption ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <MaterialConsumptionInput
                          value={mat.consumption ?? 1}
                          onChange={(consumption) =>
                            updateMaterialConsumption(index, consumption)
                          }
                          aria-label={t("estimate.material_consumption.aria", "Patēriņš {unit} uz {positionUnit}", {
                            unit: mat.unit,
                            positionUnit: positionUnit ?? "",
                          })}
                        />
                        <span className="text-xs text-zinc-400">
                          {mat.unit}/{positionUnit}
                        </span>
                      </div>
                    ) : (
                      <span className="shrink-0 text-xs text-zinc-400">
                        {mat.unit}
                      </span>
                    )}
                    <IconActionButton
                      label={t("estimate.materials.remove", "Noņemt materiālu")}
                      icon="fas fa-times"
                      variant="delete"
                      onClick={() => removeMaterial(index)}
                    />
                  </div>
                );
              })}
              <CatalogHintField
                key={materialAddKey}
                value={null}
                onChange={(ref) => {
                  if (ref) addMaterial(ref);
                }}
                catalogPositions={materialPositions}
                defaultHourlyRate={defaultHourlyRate}
                placeholder={t("estimate.materials.add_placeholder", "Pievienot materiālu...")}
              />
            </div>
          </div>

          {/* Mehānismi */}
          <div>
            <span className={labelClassName}>{t("estimate.column.mechanisms", "Mehānismi")}</span>
            <div className="space-y-1.5">
              {draftMechanisms.map((mech, index) => (
                <div
                  key={`${mech.positionPriceId}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-zinc-800">
                    {mech.name}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {mech.unit}
                  </span>
                  <IconActionButton
                    label={t("estimate.mechanisms.remove", "Noņemt mehānismu")}
                    icon="fas fa-times"
                    variant="delete"
                    onClick={() => removeMechanism(index)}
                  />
                </div>
              ))}
              <CatalogHintField
                key={mechanismAddKey}
                value={null}
                onChange={(ref) => {
                  if (ref) addMechanism(ref);
                }}
                catalogPositions={mechanismPositions}
                defaultHourlyRate={defaultHourlyRate}
                placeholder={t("estimate.mechanisms.add_placeholder", "Pievienot mehānismu...")}
              />
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-4 gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 text-sm">
          {(
            [
              [t("estimate.column.labor", "Darbs"), unitPrice.labor],
              [t("estimate.column.materials", "Materiāli"), unitPrice.materials],
              [t("estimate.column.mechanisms", "Mehānismi"), unitPrice.mechanisms],
            ] as const
          ).map(([label, amount]) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="tabular-nums text-zinc-800">
                {formatAmountDisplay(amount)}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-zinc-500">{t("estimate.unit_price", "Vienības cena")}</dt>
            <dd className="font-semibold tabular-nums text-zinc-900">
              {formatAmountDisplay(unitTotal)}
            </dd>
          </div>
        </dl>

        <PositionVariableQuantityField
          id={`position-variable-quantity-${draft.id}`}
          enabled={draft.variableQuantity ?? false}
          onChange={(variableQuantity) =>
            patch({
              variableQuantity,
              // Ieslēdzot individuālo apjomu: notīra moduļa piesaisti
              ...(variableQuantity ? { moduleSizeAttachment: undefined } : {}),
            })
          }
        />

        <PositionManualUnitField
          id={`position-manual-unit-${draft.id}`}
          enabled={draft.manualUnitEnabled ?? false}
          unit={draft.manualUnit ?? ""}
          unitOptions={manualUnitOptions}
          onEnabledChange={handleManualUnitEnabledChange}
          onUnitChange={(manualUnit) => patch({ manualUnit })}
        />

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className={labelClassName}>
              {t("estimate.module_size.quantity_source", "Apjoms no moduļa lieluma")}
            </span>
            {draft.moduleSizeAttachment ? (
              <AttachedModuleSizeLabel
                attachment={draft.moduleSizeAttachment}
                moduleSizeOptions={moduleSizeOptions}
              />
            ) : null}
          </div>
          <ModuleSizeAttachPicker
            key={draft.id}
            controlPrefix={`position-attach-${draft.id}`}
            moduleSizeOptions={moduleSizeOptions}
            attachment={draft.moduleSizeAttachment ?? null}
            onChange={(attachment: LineItemModuleSizeAttachment | null) =>
              patch({ moduleSizeAttachment: attachment ?? undefined })
            }
          />
        </div>

        <ModalFormActions onCancel={() => onOpenChange(false)}>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            {t("actions.save", "Saglabāt")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
