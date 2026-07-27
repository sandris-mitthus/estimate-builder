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
import { EstimateAttentionBudgetControl } from "@/app/components/estimate-attention-budget-control";
import { LineItemAttentionToggle } from "@/app/components/line-item-attention-toggle";
import { DeleteButton } from "@/app/components/delete-button";
import { useIsSystemAdmin } from "@/app/components/system-admin-context";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatAmountDisplay,
  roundToTwoDecimals,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import {
  buildExcludedCatalogKeysFromRefs,
  deriveCompositeUnitPrice,
  resolveEffectiveMaterials,
  resolveEffectiveMechanisms,
} from "@/app/lib/estimates/composite-line-item";
import { buildManualUnitSelectOptions } from "@/app/lib/estimates/collect-estimate-document-units";
import { resolveLineItemDisplayUnitFromModuleSize } from "@/app/lib/estimates/sync-module-size-quantities";
import {
  normalizeAttentionBudget,
  patchRequiresAttention,
} from "@/app/lib/estimates/attention-budget";
import type {
  EstimateLineItem,
  EstimateMultiPosition,
  LineItemCatalogRef,
  LineItemModuleSizeAttachment,
} from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type MultiPositionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: EstimateMultiPosition;
  onSave: (value: EstimateMultiPosition) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  estimateUnits?: string[];
  allowAttentionFlagEdit?: boolean;
};

type OptionDraft = {
  optionId: string;
  lineItemId: string;
  label: string;
  note: string;
  timeNorm: number;
  customHourlyRateEnabled: boolean;
  customHourlyRate: number;
  materials: LineItemCatalogRef[];
  mechanisms: LineItemCatalogRef[];
  materialAddKey: number;
  mechanismAddKey: number;
  /** Saglabātā mērvienība un apjoms — jāsaglabā, lai labošana nepārraksta projekta ievadi. */
  unit: string;
  quantity: number;
};

const labelClassName = "mb-1 block text-sm font-medium text-zinc-700";
const subLabelClassName = "mb-1 block text-xs font-medium text-zinc-500";
const inputClassName =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none";

function createOptionDraft(): OptionDraft {
  return {
    optionId: crypto.randomUUID(),
    lineItemId: crypto.randomUUID(),
    label: "",
    note: "",
    timeNorm: 0,
    customHourlyRateEnabled: false,
    customHourlyRate: 0,
    materials: [],
    mechanisms: [],
    materialAddKey: 0,
    mechanismAddKey: 0,
    unit: "gab.",
    quantity: 1,
  };
}

function deriveSharedState(value: EstimateMultiPosition) {
  const first = value.options[0]?.lineItem;
  return {
    name: value.name,
    note: value.note?.trim() ?? "",
    requiresAttention: value.requiresAttention === true,
    attentionBudget: normalizeAttentionBudget(value.attentionBudget) ?? null,
    attachment: first?.moduleSizeAttachment ?? null,
    manualUnitEnabled: first?.manualUnitEnabled === true,
    manualUnit: first?.manualUnit?.trim() ?? "",
    variableQuantity: value.options.some(
      (option) => option.lineItem.variableQuantity === true,
    ),
    options:
      value.options.length > 0
        ? value.options.map<OptionDraft>((option) => ({
            optionId: option.id,
            lineItemId: option.lineItem.id,
            label: option.lineItem.name,
            note: option.lineItem.note?.trim() ?? "",
            timeNorm: option.lineItem.laborTimeNorm ?? 0,
            customHourlyRateEnabled:
              option.lineItem.customHourlyRateEnabled ?? false,
            customHourlyRate: option.lineItem.customHourlyRate ?? 0,
            materials: resolveEffectiveMaterials(option.lineItem),
            mechanisms: resolveEffectiveMechanisms(option.lineItem),
            materialAddKey: 0,
            mechanismAddKey: 0,
            unit: option.lineItem.unit,
            quantity: option.lineItem.quantity,
          }))
        : [createOptionDraft()],
  };
}

function snapshot(state: {
  name: string;
  note: string;
  requiresAttention: boolean;
  attentionBudget: number | null;
  attachment: LineItemModuleSizeAttachment | null;
  manualUnitEnabled: boolean;
  manualUnit: string;
  variableQuantity: boolean;
  options: OptionDraft[];
}): string {
  return JSON.stringify({
    name: state.name.trim(),
    note: state.note.trim(),
    requiresAttention: state.requiresAttention,
    attentionBudget: state.attentionBudget,
    attachment: state.attachment,
    manualUnitEnabled: state.manualUnitEnabled,
    manualUnit: state.manualUnit.trim(),
    variableQuantity: state.variableQuantity,
    options: state.options.map((option) => ({
      label: option.label.trim(),
      note: option.note.trim(),
      timeNorm: option.timeNorm,
      customHourlyRateEnabled: option.customHourlyRateEnabled,
      customHourlyRate: option.customHourlyRate,
      materials: option.materials,
      mechanisms: option.mechanisms,
    })),
  });
}

type SharedOptionSettings = {
  attachment: LineItemModuleSizeAttachment | null;
  manualUnitEnabled: boolean;
  manualUnit: string;
  variableQuantity: boolean;
};

function buildOptionPreviewLineItem(
  option: OptionDraft,
  shared: SharedOptionSettings,
  moduleSizeOptions: BuildingModuleSizeOption[],
): EstimateLineItem {
  const partialItem: EstimateLineItem = {
    id: option.lineItemId,
    name: option.label,
    note: option.note.trim() || undefined,
    unit: option.unit || "gab.",
    quantity: option.quantity,
    unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
    laborTimeNorm: option.timeNorm,
    customHourlyRateEnabled: option.customHourlyRateEnabled,
    customHourlyRate: option.customHourlyRate,
    materials: option.materials,
    mechanisms: option.mechanisms,
    // Individuālais apjoms nav saistīts ar moduļa lielumu
    moduleSizeAttachment: shared.variableQuantity
      ? undefined
      : (shared.attachment ?? undefined),
    manualUnitEnabled: shared.manualUnitEnabled ? true : undefined,
    manualUnit:
      shared.manualUnitEnabled && shared.manualUnit.trim()
        ? shared.manualUnit.trim()
        : undefined,
    variableQuantity: shared.variableQuantity ? true : undefined,
  };

  return {
    ...partialItem,
    unit: resolveOptionUnit(option, shared, partialItem, moduleSizeOptions),
  };
}

function resolveOptionUnit(
  option: OptionDraft,
  shared: SharedOptionSettings,
  partialItem: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): string {
  if (shared.variableQuantity) {
    return option.materials[0]?.unit.trim() || option.unit.trim() || "gab.";
  }

  if (shared.manualUnitEnabled && shared.manualUnit.trim()) {
    return shared.manualUnit.trim();
  }

  return (
    resolveLineItemDisplayUnitFromModuleSize(partialItem, moduleSizeOptions) ??
    "gab."
  );
}

export function MultiPositionModal({
  open,
  onOpenChange,
  value,
  onSave,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  moduleSizeOptions = [],
  estimateUnits = [],
  allowAttentionFlagEdit = false,
}: MultiPositionModalProps) {
  const { t } = useTranslations();
  const isSystemAdmin = useIsSystemAdmin();
  const [name, setName] = useState(value.name);
  const [note, setNote] = useState(value.note?.trim() ?? "");
  const [requiresAttention, setRequiresAttention] = useState(false);
  const [attentionBudget, setAttentionBudget] = useState<number | null>(null);
  const [attachment, setAttachment] =
    useState<LineItemModuleSizeAttachment | null>(null);
  const [manualUnitEnabled, setManualUnitEnabled] = useState(false);
  const [manualUnit, setManualUnit] = useState("");
  const [variableQuantity, setVariableQuantity] = useState(false);
  const [options, setOptions] = useState<OptionDraft[]>([createOptionDraft()]);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [globalNoteError, setGlobalNoteError] = useState<string | undefined>();
  const [noteErrors, setNoteErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    const shared = deriveSharedState(value);
    setName(shared.name);
    setNote(shared.note);
    setRequiresAttention(shared.requiresAttention);
    setAttentionBudget(shared.attentionBudget);
    setAttachment(shared.attachment);
    setManualUnitEnabled(shared.manualUnitEnabled);
    setManualUnit(shared.manualUnit);
    setVariableQuantity(shared.variableQuantity);
    setOptions(shared.options);
    setInitialSnapshot(snapshot(shared));
    setGlobalNoteError(undefined);
    setNoteErrors({});
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
  const manualUnitOptions = useMemo(
    () => buildManualUnitSelectOptions(estimateUnits),
    [estimateUnits],
  );

  const currentSnapshot = useMemo(
    () =>
      snapshot({
        name,
        note,
        requiresAttention,
        attentionBudget,
        attachment,
        manualUnitEnabled,
        manualUnit,
        variableQuantity,
        options,
      }),
    [
      name,
      note,
      requiresAttention,
      attentionBudget,
      attachment,
      manualUnitEnabled,
      manualUnit,
      variableQuantity,
      options,
    ],
  );
  const dirty = currentSnapshot !== initialSnapshot;

  const sharedOptionSettings: SharedOptionSettings = {
    attachment,
    manualUnitEnabled,
    manualUnit,
    variableQuantity,
  };

  function updateOption(optionId: string, updates: Partial<OptionDraft>) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId ? { ...entry, ...updates } : entry,
      ),
    );
  }

  function addMaterial(optionId: string, ref: LineItemCatalogRef) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              materials: [...entry.materials, ref],
              materialAddKey: entry.materialAddKey + 1,
            }
          : entry,
      ),
    );
  }

  function removeMaterial(optionId: string, index: number) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              materials: entry.materials.filter((_, i) => i !== index),
            }
          : entry,
      ),
    );
  }

  function updateMaterialConsumption(
    optionId: string,
    index: number,
    consumption: number,
  ) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              materials: entry.materials.map((mat, i) =>
                i === index ? { ...mat, consumption } : mat,
              ),
            }
          : entry,
      ),
    );
  }

  function updateMaterialManualConsumption(
    optionId: string,
    index: number,
    manualConsumption: boolean,
  ) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              materials: entry.materials.map((mat, i) =>
                i === index
                  ? {
                      ...mat,
                      manualConsumption: manualConsumption || undefined,
                      consumption: manualConsumption
                        ? (mat.consumption ?? 1)
                        : undefined,
                    }
                  : mat,
              ),
            }
          : entry,
      ),
    );
  }

  function updateMaterialVolumeAttachment(
    optionId: string,
    index: number,
    volumeAttachment: LineItemModuleSizeAttachment | null,
  ) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              materials: entry.materials.map((mat, i) =>
                i === index
                  ? {
                      ...mat,
                      consumptionVolumeAttachment: volumeAttachment ?? undefined,
                    }
                  : mat,
              ),
            }
          : entry,
      ),
    );
  }

  function addMechanism(optionId: string, ref: LineItemCatalogRef) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              mechanisms: [...entry.mechanisms, ref],
              mechanismAddKey: entry.mechanismAddKey + 1,
            }
          : entry,
      ),
    );
  }

  function removeMechanism(optionId: string, index: number) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              mechanisms: entry.mechanisms.filter((_, i) => i !== index),
            }
          : entry,
      ),
    );
  }

  function updateMechanismQuantity(
    optionId: string,
    index: number,
    consumption: number,
  ) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              mechanisms: entry.mechanisms.map((mech, i) =>
                i === index ? { ...mech, consumption } : mech,
              ),
            }
          : entry,
      ),
    );
  }

  function updateMechanismFixedQuantity(
    optionId: string,
    index: number,
    fixedQuantity: boolean,
  ) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId
          ? {
              ...entry,
              mechanisms: entry.mechanisms.map((mech, i) =>
                i === index
                  ? { ...mech, fixedQuantity: fixedQuantity || undefined }
                  : mech,
              ),
            }
          : entry,
      ),
    );
  }

  function handleManualUnitEnabledChange(enabled: boolean) {
    if (!enabled) {
      setManualUnitEnabled(false);
      return;
    }

    const previewItem: EstimateLineItem = {
      id: options[0]?.lineItemId ?? "",
      name: "",
      unit: "gab.",
      quantity: 1,
      unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
      moduleSizeAttachment: attachment ?? undefined,
    };
    const nextUnit =
      manualUnit.trim() ||
      resolveLineItemDisplayUnitFromModuleSize(previewItem, moduleSizeOptions) ||
      manualUnitOptions[0] ||
      "gab.";

    setManualUnitEnabled(true);
    setManualUnit(nextUnit);
  }

  function optionUnitPrice(option: OptionDraft) {
    return deriveCompositeUnitPrice(
      buildOptionPreviewLineItem(option, sharedOptionSettings, moduleSizeOptions),
      catalogPositions,
      defaultHourlyRate,
      moduleSizeOptions,
    );
  }

  function handleVariableQuantityChange(enabled: boolean) {
    setVariableQuantity(enabled);
    // Ieslēdzot individuālo apjomu: notīra moduļa piesaisti visām opcijām
    if (enabled) {
      setAttachment(null);
    }
  }

  function isMeaningfulOption(option: OptionDraft): boolean {
    return Boolean(
      option.label.trim() ||
        option.note.trim() ||
        option.timeNorm > 0 ||
        option.customHourlyRateEnabled ||
        option.materials.length > 0 ||
        option.mechanisms.length > 0,
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedGlobalNote = note.trim();
    if (trimmedGlobalNote.length > 255) {
      setGlobalNoteError(
        t(
          "positions.validation.note_too_long",
          "Piezīme nedrīkst būt garāka par 255 zīmēm.",
        ),
      );
      return;
    }
    setGlobalNoteError(undefined);

    const nextNoteErrors: Record<string, string> = {};
    for (const option of options) {
      if (option.note.trim().length > 255) {
        nextNoteErrors[option.optionId] = t(
          "positions.validation.note_too_long",
          "Piezīme nedrīkst būt garāka par 255 zīmēm.",
        );
      }
    }
    if (Object.keys(nextNoteErrors).length > 0) {
      setNoteErrors(nextNoteErrors);
      return;
    }
    setNoteErrors({});

    const meaningful = options.filter(isMeaningfulOption);
    const finalOptions = meaningful.length > 0 ? meaningful : [options[0]];

    // Individuālais apjoms ir globāls — visām opcijām viens un tas pats apjoms
    const sharedQuantity =
      finalOptions.find((option) => option.quantity > 0)?.quantity ?? 0;

    const builtOptions = finalOptions.map((option) => {
      const label = option.label.trim();
      const trimmedNote = option.note.trim();
      const partialItem: EstimateLineItem = {
        id: option.lineItemId,
        name: label,
        note: trimmedNote || undefined,
        unit: option.unit || "gab.",
        quantity: variableQuantity ? sharedQuantity : option.quantity,
        laborTimeNorm: option.timeNorm,
        customHourlyRateEnabled: option.customHourlyRateEnabled,
        customHourlyRate: option.customHourlyRateEnabled
          ? roundToTwoDecimals(option.customHourlyRate)
          : undefined,
        materials: option.materials,
        mechanisms: option.mechanisms,
        moduleSizeAttachment: variableQuantity
          ? undefined
          : (attachment ?? undefined),
        manualUnitEnabled: manualUnitEnabled ? true : undefined,
        manualUnit:
          manualUnitEnabled && manualUnit.trim() ? manualUnit.trim() : undefined,
        variableQuantity: variableQuantity ? true : undefined,
        unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
      };
      const lineItem: EstimateLineItem = {
        ...partialItem,
        unit: resolveOptionUnit(
          option,
          sharedOptionSettings,
          partialItem,
          moduleSizeOptions,
        ),
      };
      return {
        id: option.optionId,
        lineItem: {
          ...lineItem,
          unitPrice: deriveCompositeUnitPrice(
            lineItem,
            catalogPositions,
            defaultHourlyRate,
            moduleSizeOptions,
          ),
        },
      };
    });

    onSave({
      ...value,
      kind: "multi",
      name: name.trim(),
      note: trimmedGlobalNote || undefined,
      requiresAttention: requiresAttention ? true : undefined,
      attentionBudget: requiresAttention
        ? normalizeAttentionBudget(attentionBudget ?? undefined)
        : undefined,
      options: builtOptions,
      selectedOptionId: value.selectedOptionId ?? null,
    });
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("estimate.multi.title", "Multi-pozīcija")}
      description={t(
        "estimate.multi.description",
        "Vienots apjoms; katrai opcijai sava laika norma, materiāli un mehānismi.",
      )}
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      dirty={dirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <label className="block">
            <span className={labelClassName}>{t("common.name", "Nosaukums")}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
              placeholder={t("estimate.multi.name_placeholder", "piem. Fasādes apdare")}
              autoFocus
            />
          </label>
          <label className="block">
            <span className={labelClassName}>{t("common.note", "Piezīme")}</span>
            <textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setGlobalNoteError(undefined);
              }}
              rows={2}
              placeholder={t(
                "positions.note.placeholder",
                "Papildu informācija par pozīciju",
              )}
              className={`${inputClassName} resize-y`}
              aria-invalid={Boolean(globalNoteError)}
              aria-describedby={globalNoteError ? "multi-global-note-error" : undefined}
            />
            {globalNoteError ? (
              <p
                id="multi-global-note-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {globalNoteError}
              </p>
            ) : null}
          </label>
          {allowAttentionFlagEdit || requiresAttention ? (
            <div className="space-y-3 rounded-lg border border-red-100 bg-red-50/50 p-3">
              {allowAttentionFlagEdit ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-red-800">
                    {t("estimate.attention.section_title", "Īpaša uzmanība")}
                  </span>
                  <LineItemAttentionToggle
                    id={`multi-attention-${value.id}`}
                    enabled={requiresAttention}
                    onChange={(nextEnabled) => {
                      const next = patchRequiresAttention(
                        {
                          requiresAttention,
                          attentionBudget: attentionBudget ?? undefined,
                        },
                        nextEnabled,
                      );
                      setRequiresAttention(next.requiresAttention === true);
                      setAttentionBudget(
                        normalizeAttentionBudget(next.attentionBudget) ?? null,
                      );
                    }}
                  />
                </div>
              ) : null}
              {requiresAttention ? (
                <EstimateAttentionBudgetControl
                  id={`multi-attention-budget-${value.id}`}
                  value={attentionBudget ?? undefined}
                  currency={currency}
                  onChange={(nextBudget) =>
                    setAttentionBudget(normalizeAttentionBudget(nextBudget) ?? null)
                  }
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <PositionVariableQuantityField
          id={`multi-variable-quantity-${value.id}`}
          enabled={variableQuantity}
          onChange={handleVariableQuantityChange}
        />

        <PositionManualUnitField
          id={`multi-manual-unit-${value.id}`}
          enabled={manualUnitEnabled}
          unit={manualUnit}
          unitOptions={manualUnitOptions}
          onEnabledChange={handleManualUnitEnabledChange}
          onUnitChange={setManualUnit}
        />

        {variableQuantity ? null : (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={labelClassName}>
                {t("estimate.multi.module_size_quantity", "Apjoms no moduļa lieluma (vienots)")}
              </span>
              {attachment ? (
                <AttachedModuleSizeLabel
                  attachment={attachment}
                  moduleSizeOptions={moduleSizeOptions}
                />
              ) : null}
            </div>
            <ModuleSizeAttachPicker
              controlPrefix={`multi-attach-${value.id}`}
              moduleSizeOptions={moduleSizeOptions}
              attachment={attachment}
              onChange={setAttachment}
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-700">
              {t("estimate.multi.options", "Opcijas")}
            </p>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              onClick={() =>
                setOptions((current) => [...current, createOptionDraft()])
              }
            >
              {t("estimate.multi.add_option", "+ Opcija")}
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => {
              const unitPrice = optionUnitPrice(option);
              const unitTotal = sumBreakdown(unitPrice);
              return (
                <div
                  key={option.optionId}
                  className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {t("estimate.multi.option_item", "Opcija {index}", {
                        index: index + 1,
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-zinc-700">
                        {formatAmountDisplay(unitTotal)}
                      </span>
                      {options.length > 1 ? (
                        <DeleteButton
                          label={t("estimate.multi.delete_option", "Dzēst opciju")}
                          onClick={() =>
                            setOptions((current) =>
                              current.filter(
                                (entry) => entry.optionId !== option.optionId,
                              ),
                            )
                          }
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
                    <label className="block">
                      <span className={subLabelClassName}>{t("common.name", "Nosaukums")}</span>
                      <input
                        type="text"
                        value={option.label}
                        onChange={(event) =>
                          updateOption(option.optionId, {
                            label: event.target.value,
                          })
                        }
                        className={inputClassName}
                        placeholder={t(
                          "estimate.multi.option_name_placeholder",
                          "piem. Standarta (nav obligāts)",
                        )}
                      />
                    </label>
                    <label className="block">
                      <span className={subLabelClassName}>{t("estimate.time_norm", "Laika norma (c/h)")}</span>
                      <LaborTimeNormInput
                        value={option.timeNorm}
                        onChange={(timeNorm) =>
                          updateOption(option.optionId, { timeNorm })
                        }
                        withStepper
                        stepperButtonsAlwaysVisible
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className={subLabelClassName}>
                      {t("common.note", "Piezīme")}
                    </span>
                    <textarea
                      value={option.note}
                      onChange={(event) => {
                        updateOption(option.optionId, { note: event.target.value });
                        if (noteErrors[option.optionId]) {
                          setNoteErrors((current) => {
                            const next = { ...current };
                            delete next[option.optionId];
                            return next;
                          });
                        }
                      }}
                      rows={2}
                      placeholder={t(
                        "positions.note.placeholder",
                        "Papildu informācija par pozīciju",
                      )}
                      className={`${inputClassName} resize-y`}
                      aria-invalid={Boolean(noteErrors[option.optionId])}
                      aria-describedby={
                        noteErrors[option.optionId]
                          ? `multi-option-note-error-${option.optionId}`
                          : undefined
                      }
                    />
                    {noteErrors[option.optionId] ? (
                      <p
                        id={`multi-option-note-error-${option.optionId}`}
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {noteErrors[option.optionId]}
                      </p>
                    ) : null}
                  </label>

                  {isSystemAdmin ? null : (
                    <PositionCustomHourlyRateField
                      id={`multi-custom-hourly-rate-${option.optionId}`}
                      enabled={option.customHourlyRateEnabled}
                      rate={option.customHourlyRate}
                      defaultHourlyRate={defaultHourlyRate}
                      currency={currency}
                      onEnabledChange={(customHourlyRateEnabled) =>
                        updateOption(option.optionId, {
                          customHourlyRateEnabled,
                          customHourlyRate: customHourlyRateEnabled
                            ? (option.customHourlyRate || defaultHourlyRate || 0)
                            : 0,
                        })
                      }
                      onRateChange={(customHourlyRate) =>
                        updateOption(option.optionId, { customHourlyRate })
                      }
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* Materiāli */}
                    <div>
                      <span className={subLabelClassName}>{t("estimate.column.materials", "Materiāli")}</span>
                      <div className="space-y-1.5">
                        <LineItemCatalogRefSortableList
                          items={option.materials}
                          onReorder={(materials) =>
                            updateOption(option.optionId, { materials })
                          }
                          getDragLabel={(mat) =>
                            t("estimate.drag.material", "Pārvietot materiālu: {name}", {
                              name: mat.name,
                            })
                          }
                          renderItem={(mat, matIdx) => (
                            <MaterialConsumptionBasisControl
                              material={mat}
                              item={buildOptionPreviewLineItem(
                                option,
                                sharedOptionSettings,
                                moduleSizeOptions,
                              )}
                              moduleSizeOptions={moduleSizeOptions}
                              catalogPositions={catalogPositions}
                              currency={currency}
                              onConsumptionChange={(consumption) =>
                                updateMaterialConsumption(
                                  option.optionId,
                                  matIdx,
                                  consumption,
                                )
                              }
                              onManualConsumptionChange={(enabled) =>
                                updateMaterialManualConsumption(
                                  option.optionId,
                                  matIdx,
                                  enabled,
                                )
                              }
                              onVolumeAttachmentChange={(volumeAttachment) =>
                                updateMaterialVolumeAttachment(
                                  option.optionId,
                                  matIdx,
                                  volumeAttachment,
                                )
                              }
                              onRemove={() =>
                                removeMaterial(option.optionId, matIdx)
                              }
                            />
                          )}
                        />
                        <CatalogHintField
                          key={`${option.optionId}-mat-${option.materialAddKey}`}
                          value={null}
                          onChange={(ref) => {
                            if (ref) addMaterial(option.optionId, ref);
                          }}
                          catalogPositions={materialPositions}
                          excludedCatalogKeys={buildExcludedCatalogKeysFromRefs(
                            option.materials,
                          )}
                          defaultHourlyRate={defaultHourlyRate}
                          placeholder={t("estimate.materials.add_placeholder", "Pievienot materiālu...")}
                        />
                      </div>
                    </div>

                    {/* Mehānismi */}
                    <div>
                      <span className={subLabelClassName}>{t("estimate.column.mechanisms", "Mehānismi")}</span>
                      <div className="space-y-1.5">
                        <LineItemCatalogRefSortableList
                          items={option.mechanisms}
                          onReorder={(mechanisms) =>
                            updateOption(option.optionId, { mechanisms })
                          }
                          getDragLabel={(mech) =>
                            t("estimate.drag.mechanism", "Pārvietot mehānismu: {name}", {
                              name: mech.name,
                            })
                          }
                          renderItem={(mech, mechIdx) => (
                            <MechanismBasisControl
                              mechanism={mech}
                              item={buildOptionPreviewLineItem(
                                option,
                                sharedOptionSettings,
                                moduleSizeOptions,
                              )}
                              moduleSizeOptions={moduleSizeOptions}
                              catalogPositions={catalogPositions}
                              currency={currency}
                              onQuantityChange={(consumption) =>
                                updateMechanismQuantity(
                                  option.optionId,
                                  mechIdx,
                                  consumption,
                                )
                              }
                              onFixedQuantityChange={(fixedQuantity) =>
                                updateMechanismFixedQuantity(
                                  option.optionId,
                                  mechIdx,
                                  fixedQuantity,
                                )
                              }
                              onRemove={() =>
                                removeMechanism(option.optionId, mechIdx)
                              }
                            />
                          )}
                        />
                        <CatalogHintField
                          key={`${option.optionId}-mech-${option.mechanismAddKey}`}
                          value={null}
                          onChange={(ref) => {
                            if (ref) addMechanism(option.optionId, ref);
                          }}
                          catalogPositions={mechanismPositions}
                          excludedCatalogKeys={buildExcludedCatalogKeysFromRefs(
                            option.mechanisms,
                          )}
                          defaultHourlyRate={defaultHourlyRate}
                          placeholder={t("estimate.mechanisms.add_placeholder", "Pievienot mehānismu...")}
                        />
                      </div>
                    </div>
                  </div>

                  <dl className="grid grid-cols-4 gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm">
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
                </div>
              );
            })}
          </div>
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
