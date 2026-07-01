"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { CatalogHintField } from "@/app/components/catalog-hint-field";
import { LaborTimeNormInput } from "@/app/components/labor-time-norm-input";
import { LineItemCatalogRefSortableList } from "@/app/components/line-item-catalog-ref-sortable-list";
import { MaterialConsumptionBasisControl } from "@/app/components/material-consumption-basis-control";
import { MechanismBasisControl } from "@/app/components/mechanism-basis-control";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { ModuleSizeAttachPicker } from "@/app/components/module-size-attach-picker";
import { PositionCustomHourlyRateField } from "@/app/components/position-custom-hourly-rate-field";
import { PositionManualUnitField } from "@/app/components/position-manual-unit-field";
import { PositionVariableQuantityField } from "@/app/components/position-variable-quantity-field";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { useIsSystemAdmin } from "@/app/components/system-admin-context";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatAmountDisplay,
  roundToTwoDecimals,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import { getCurrencySymbol } from "@/app/lib/settings/currencies";
import {
  buildExcludedCatalogKeysFromRefs,
  deriveCompositeUnitPrice,
  resolveEffectiveMaterials,
  resolveEffectiveMechanisms,
} from "@/app/lib/estimates/composite-line-item";
import { buildManualUnitSelectOptions } from "@/app/lib/estimates/collect-estimate-document-units";
import {
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
  currency?: string | null;
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
    note: item.note?.trim() ?? "",
    laborTimeNorm: item.laborTimeNorm ?? 0,
    customHourlyRateEnabled: item.customHourlyRateEnabled ?? false,
    customHourlyRate: item.customHourlyRate ?? 0,
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
  currency = null,
  moduleSizeOptions,
  estimateUnits = [],
}: PositionModalProps) {
  const { t } = useTranslations();
  const isSystemAdmin = useIsSystemAdmin();
  const currencySymbol = getCurrencySymbol(currency);
  const [draft, setDraft] = useState<EstimateLineItem>(() => prepareDraft(value));
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    snapshot(prepareDraft(value)),
  );
  const [materialAddKey, setMaterialAddKey] = useState(0);
  const [mechanismAddKey, setMechanismAddKey] = useState(0);
  const [noteError, setNoteError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) {
      return;
    }
    const prepared = prepareDraft(value);
    setDraft(prepared);
    setInitialSnapshot(snapshot(prepared));
    setMaterialAddKey((k) => k + 1);
    setMechanismAddKey((k) => k + 1);
    setNoteError(undefined);
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
    () =>
      deriveCompositeUnitPrice(
        draft,
        catalogPositions,
        defaultHourlyRate,
        moduleSizeOptions,
      ),
    [draft, catalogPositions, defaultHourlyRate, moduleSizeOptions],
  );
  const unitTotal = sumBreakdown(unitPrice);
  const draftSnapshot = useMemo(() => snapshot(draft), [draft]);
  const dirty = draftSnapshot !== initialSnapshot;

  function patch(updates: Partial<EstimateLineItem>) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function removeMaterial(index: number) {
    setDraft((current) => ({
      ...current,
      materials: (current.materials ?? []).filter((_, i) => i !== index),
    }));
  }

  function addMaterial(ref: LineItemCatalogRef) {
    setDraft((current) => ({
      ...current,
      materials: [...(current.materials ?? []), ref],
    }));
    setMaterialAddKey((k) => k + 1);
  }

  function updateMaterialConsumption(index: number, consumption: number) {
    setDraft((current) => ({
      ...current,
      materials: (current.materials ?? []).map((mat, i) =>
        i === index ? { ...mat, consumption } : mat,
      ),
    }));
  }

  function updateMaterialManualConsumption(
    index: number,
    manualConsumption: boolean,
  ) {
    setDraft((current) => ({
      ...current,
      materials: (current.materials ?? []).map((mat, i) =>
        i === index
          ? {
              ...mat,
              manualConsumption: manualConsumption || undefined,
              consumption: manualConsumption ? (mat.consumption ?? 1) : undefined,
            }
          : mat,
      ),
    }));
  }

  function updateMaterialVolumeAttachment(
    index: number,
    attachment: LineItemModuleSizeAttachment | null,
  ) {
    setDraft((current) => ({
      ...current,
      materials: (current.materials ?? []).map((mat, i) =>
        i === index
          ? {
              ...mat,
              consumptionVolumeAttachment: attachment ?? undefined,
            }
          : mat,
      ),
    }));
  }

  function removeMechanism(index: number) {
    setDraft((current) => ({
      ...current,
      mechanisms: (current.mechanisms ?? []).filter((_, i) => i !== index),
    }));
  }

  function addMechanism(ref: LineItemCatalogRef) {
    setDraft((current) => ({
      ...current,
      mechanisms: [...(current.mechanisms ?? []), ref],
    }));
    setMechanismAddKey((k) => k + 1);
  }

  function updateMechanismQuantity(index: number, consumption: number) {
    setDraft((current) => ({
      ...current,
      mechanisms: (current.mechanisms ?? []).map((mech, i) =>
        i === index ? { ...mech, consumption } : mech,
      ),
    }));
  }

  function updateMechanismFixedQuantity(index: number, fixedQuantity: boolean) {
    setDraft((current) => ({
      ...current,
      mechanisms: (current.mechanisms ?? []).map((mech, i) =>
        i === index
          ? { ...mech, fixedQuantity: fixedQuantity || undefined }
          : mech,
      ),
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedNote = draft.note?.trim() ?? "";
    if (trimmedNote.length > 255) {
      setNoteError(
        t(
          "positions.validation.note_too_long",
          "Piezīme nedrīkst būt garāka par 255 zīmēm.",
        ),
      );
      return;
    }
    setNoteError(undefined);

    // Kad variableQuantity = true, mērvienība no pirmā materiāla (ja ir), citādi draft.unit vai "gab."
    const resolvedVariableUnit = (() => {
      const firstMaterial = (draft.materials ?? [])[0];
      if (firstMaterial?.unit.trim()) return firstMaterial.unit.trim();
      return draft.unit.trim() || "gab.";
    })();

    const normalized: EstimateLineItem = {
      ...draft,
      name: draft.name.trim(),
      note: trimmedNote || undefined,
      unit: draft.variableQuantity
        ? resolvedVariableUnit
        : draft.manualUnitEnabled && draft.manualUnit?.trim()
          ? draft.manualUnit.trim()
          : (resolveLineItemDisplayUnitFromModuleSize(draft, moduleSizeOptions) ??
            "gab."),
      laborTimeNorm: roundToTwoDecimals(draft.laborTimeNorm ?? 0),
      customHourlyRateEnabled: draft.customHourlyRateEnabled === true,
      customHourlyRate:
        draft.customHourlyRateEnabled === true
          ? roundToTwoDecimals(draft.customHourlyRate ?? 0)
          : undefined,
      materials: draft.materials ?? [],
      mechanisms: draft.mechanisms ?? [],
      material: undefined,
      mechanism: undefined,
      unitPrice: deriveCompositeUnitPrice(
        draft,
        catalogPositions,
        defaultHourlyRate,
        moduleSizeOptions,
      ),
    };

    onSave(normalized);
    onOpenChange(false);
  }

  const draftMaterials = resolveEffectiveMaterials(draft);
  const draftMechanisms = resolveEffectiveMechanisms(draft);
  const excludedMaterialCatalogKeys = useMemo(
    () => buildExcludedCatalogKeysFromRefs(draftMaterials),
    [draftMaterials],
  );
  const excludedMechanismCatalogKeys = useMemo(
    () => buildExcludedCatalogKeysFromRefs(draftMechanisms),
    [draftMechanisms],
  );
  const manualUnitOptions = useMemo(
    () => buildManualUnitSelectOptions(estimateUnits),
    [estimateUnits],
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
          <div className="space-y-3">
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
              <span className={labelClassName}>{t("common.note", "Piezīme")}</span>
              <textarea
                value={draft.note ?? ""}
                onChange={(event) => {
                  patch({ note: event.target.value });
                  setNoteError(undefined);
                }}
                rows={2}
                placeholder={t(
                  "positions.note.placeholder",
                  "Papildu informācija par pozīciju",
                )}
                className={`${inputClassName} resize-y`}
                aria-invalid={Boolean(noteError)}
                aria-describedby={noteError ? "position-note-error" : undefined}
              />
              {noteError ? (
                <p
                  id="position-note-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {noteError}
                </p>
              ) : null}
            </label>
          </div>
          <label className="block">
            <span className={labelClassName}>{t("estimate.time_norm", "Laika norma (c/h)")}</span>
            <LaborTimeNormInput
              value={draft.laborTimeNorm ?? 0}
              onChange={(laborTimeNorm) => patch({ laborTimeNorm })}
              withStepper
              stepperButtonsAlwaysVisible
            />
            {defaultHourlyRate != null || draft.customHourlyRateEnabled === true ? (
              <span className="mt-1 block text-xs text-zinc-500">
                {t(
                  "estimate.labor_rate_display",
                  "Darbs = {rate} {currency}/h",
                  {
                    rate: formatAmountDisplay(
                      draft.customHourlyRateEnabled === true
                        ? (draft.customHourlyRate ?? 0)
                        : (defaultHourlyRate ?? 0),
                    ),
                    currency: currencySymbol,
                  },
                )}
              </span>
            ) : null}
          </label>
        </div>

        {isSystemAdmin ? null : (
          <PositionCustomHourlyRateField
            id={`position-custom-hourly-rate-${draft.id}`}
            enabled={draft.customHourlyRateEnabled ?? false}
            rate={draft.customHourlyRate ?? 0}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            onEnabledChange={(customHourlyRateEnabled) =>
              patch({
                customHourlyRateEnabled,
                customHourlyRate: customHourlyRateEnabled
                  ? (draft.customHourlyRate ?? defaultHourlyRate ?? 0)
                  : undefined,
              })
            }
            onRateChange={(customHourlyRate) => patch({ customHourlyRate })}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Materiāli */}
          <div>
            <span className={labelClassName}>{t("estimate.column.materials", "Materiāli")}</span>
            <div className="space-y-1.5">
              <LineItemCatalogRefSortableList
                items={draftMaterials}
                onReorder={(materials) => patch({ materials })}
                getDragLabel={(mat) =>
                  t("estimate.drag.material", "Pārvietot materiālu: {name}", {
                    name: mat.name,
                  })
                }
                renderItem={(mat, index) => (
                  <MaterialConsumptionBasisControl
                    material={mat}
                    item={draft}
                    moduleSizeOptions={moduleSizeOptions}
                    catalogPositions={catalogPositions}
                    currency={currency}
                    onConsumptionChange={(consumption) =>
                      updateMaterialConsumption(index, consumption)
                    }
                    onManualConsumptionChange={(enabled) =>
                      updateMaterialManualConsumption(index, enabled)
                    }
                    onVolumeAttachmentChange={(attachment) =>
                      updateMaterialVolumeAttachment(index, attachment)
                    }
                    onRemove={() => removeMaterial(index)}
                  />
                )}
              />
              <CatalogHintField
                key={materialAddKey}
                value={null}
                onChange={(ref) => {
                  if (ref) addMaterial(ref);
                }}
                catalogPositions={materialPositions}
                excludedCatalogKeys={excludedMaterialCatalogKeys}
                defaultHourlyRate={defaultHourlyRate}
                placeholder={t("estimate.materials.add_placeholder", "Pievienot materiālu...")}
              />
            </div>
          </div>

          {/* Mehānismi */}
          <div>
            <span className={labelClassName}>{t("estimate.column.mechanisms", "Mehānismi")}</span>
            <div className="space-y-1.5">
              <LineItemCatalogRefSortableList
                items={draftMechanisms}
                onReorder={(mechanisms) => patch({ mechanisms })}
                getDragLabel={(mech) =>
                  t("estimate.drag.mechanism", "Pārvietot mehānismu: {name}", {
                    name: mech.name,
                  })
                }
                renderItem={(mech, index) => (
                  <MechanismBasisControl
                    mechanism={mech}
                    item={draft}
                    moduleSizeOptions={moduleSizeOptions}
                    catalogPositions={catalogPositions}
                    currency={currency}
                    onQuantityChange={(consumption) =>
                      updateMechanismQuantity(index, consumption)
                    }
                    onFixedQuantityChange={(fixedQuantity) =>
                      updateMechanismFixedQuantity(index, fixedQuantity)
                    }
                    onRemove={() => removeMechanism(index)}
                  />
                )}
              />
              <CatalogHintField
                key={mechanismAddKey}
                value={null}
                onChange={(ref) => {
                  if (ref) addMechanism(ref);
                }}
                catalogPositions={mechanismPositions}
                excludedCatalogKeys={excludedMechanismCatalogKeys}
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
