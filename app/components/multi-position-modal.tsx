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
import { PositionCustomHourlyRateField } from "@/app/components/position-custom-hourly-rate-field";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { DeleteButton } from "@/app/components/delete-button";
import { useIsSystemAdmin } from "@/app/components/system-admin-context";
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
import { resolveLineItemDisplayUnitFromModuleSize } from "@/app/lib/estimates/sync-module-size-quantities";
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
};

type OptionDraft = {
  optionId: string;
  lineItemId: string;
  label: string;
  timeNorm: number;
  customHourlyRateEnabled: boolean;
  customHourlyRate: number;
  materials: LineItemCatalogRef[];
  mechanisms: LineItemCatalogRef[];
  materialAddKey: number;
  mechanismAddKey: number;
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
    timeNorm: 0,
    customHourlyRateEnabled: false,
    customHourlyRate: 0,
    materials: [],
    mechanisms: [],
    materialAddKey: 0,
    mechanismAddKey: 0,
  };
}

function deriveSharedState(value: EstimateMultiPosition) {
  const first = value.options[0]?.lineItem;
  return {
    name: value.name,
    attachment: first?.moduleSizeAttachment ?? null,
    options:
      value.options.length > 0
        ? value.options.map<OptionDraft>((option) => ({
            optionId: option.id,
            lineItemId: option.lineItem.id,
            label: option.lineItem.name,
            timeNorm: option.lineItem.laborTimeNorm ?? 0,
            customHourlyRateEnabled:
              option.lineItem.customHourlyRateEnabled ?? false,
            customHourlyRate: option.lineItem.customHourlyRate ?? 0,
            materials: resolveEffectiveMaterials(option.lineItem),
            mechanisms: resolveEffectiveMechanisms(option.lineItem),
            materialAddKey: 0,
            mechanismAddKey: 0,
          }))
        : [createOptionDraft()],
  };
}

function snapshot(state: {
  name: string;
  attachment: LineItemModuleSizeAttachment | null;
  options: OptionDraft[];
}): string {
  return JSON.stringify({
    name: state.name.trim(),
    attachment: state.attachment,
    options: state.options.map((option) => ({
      label: option.label.trim(),
      timeNorm: option.timeNorm,
      customHourlyRateEnabled: option.customHourlyRateEnabled,
      customHourlyRate: option.customHourlyRate,
      materials: option.materials,
      mechanisms: option.mechanisms,
    })),
  });
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
}: MultiPositionModalProps) {
  const { t } = useTranslations();
  const isSystemAdmin = useIsSystemAdmin();
  const [name, setName] = useState(value.name);
  const [attachment, setAttachment] =
    useState<LineItemModuleSizeAttachment | null>(null);
  const [options, setOptions] = useState<OptionDraft[]>([createOptionDraft()]);
  const [initialSnapshot, setInitialSnapshot] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    const shared = deriveSharedState(value);
    setName(shared.name);
    setAttachment(shared.attachment);
    setOptions(shared.options);
    setInitialSnapshot(snapshot(shared));
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

  const currentSnapshot = useMemo(
    () => snapshot({ name, attachment, options }),
    [name, attachment, options],
  );
  const dirty = currentSnapshot !== initialSnapshot;

  // Pozīcijas mērvienība no vienotā moduļa apjoma (piem. m²). Tikai tad var ievadīt patēriņu.
  const positionUnit = useMemo(
    () =>
      attachment
        ? resolveLineItemDisplayUnitFromModuleSize(
            {
              id: "preview",
              name: "",
              unit: "gab.",
              quantity: 1,
              unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
              moduleSizeAttachment: attachment,
            },
            moduleSizeOptions,
          )
        : null,
    [attachment, moduleSizeOptions],
  );

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

  function optionUnitPrice(option: OptionDraft) {
    return deriveCompositeUnitPrice(
      {
        id: "preview",
        name: "",
        unit: "gab.",
        quantity: 1,
        unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
        laborTimeNorm: option.timeNorm,
        customHourlyRateEnabled: option.customHourlyRateEnabled,
        customHourlyRate: option.customHourlyRate,
        materials: option.materials,
        mechanisms: option.mechanisms,
      },
      catalogPositions,
      defaultHourlyRate,
    );
  }

  function isMeaningfulOption(option: OptionDraft): boolean {
    return Boolean(
      option.label.trim() ||
        option.timeNorm > 0 ||
        option.customHourlyRateEnabled ||
        option.materials.length > 0 ||
        option.mechanisms.length > 0,
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const meaningful = options.filter(isMeaningfulOption);
    const finalOptions = meaningful.length > 0 ? meaningful : [options[0]];

    const builtOptions = finalOptions.map((option) => {
      const label = option.label.trim();
      const partialItem: EstimateLineItem = {
        id: option.lineItemId,
        name: label,
        unit: "gab.",
        quantity: 1,
        laborTimeNorm: option.timeNorm,
        customHourlyRateEnabled: option.customHourlyRateEnabled,
        customHourlyRate: option.customHourlyRateEnabled
          ? roundToTwoDecimals(option.customHourlyRate)
          : undefined,
        materials: option.materials,
        mechanisms: option.mechanisms,
        moduleSizeAttachment: attachment ?? undefined,
        unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
      };
      const lineItem: EstimateLineItem = {
        ...partialItem,
        unit:
          resolveLineItemDisplayUnitFromModuleSize(
            partialItem,
            moduleSizeOptions,
          ) ?? "gab.",
      };
      return {
        id: option.optionId,
        lineItem: {
          ...lineItem,
          unitPrice: deriveCompositeUnitPrice(
            lineItem,
            catalogPositions,
            defaultHourlyRate,
          ),
        },
      };
    });

    onSave({
      ...value,
      kind: "multi",
      name: name.trim(),
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
                        {option.materials.map((mat, matIdx) => {
                          const showConsumption =
                            positionUnit != null &&
                            mat.unit.trim() !== positionUnit;
                          return (
                            <div
                              key={`${mat.positionPriceId}-${matIdx}`}
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
                                      updateMaterialConsumption(
                                        option.optionId,
                                        matIdx,
                                        consumption,
                                      )
                                    }
                                    aria-label={t(
                                      "estimate.material_consumption.aria",
                                      "Patēriņš {unit} uz {positionUnit}",
                                      {
                                        unit: mat.unit,
                                        positionUnit: positionUnit ?? "",
                                      },
                                    )}
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
                                onClick={() =>
                                  removeMaterial(option.optionId, matIdx)
                                }
                              />
                            </div>
                          );
                        })}
                        <CatalogHintField
                          key={`${option.optionId}-mat-${option.materialAddKey}`}
                          value={null}
                          onChange={(ref) => {
                            if (ref) addMaterial(option.optionId, ref);
                          }}
                          catalogPositions={materialPositions}
                          defaultHourlyRate={defaultHourlyRate}
                          placeholder={t("estimate.materials.add_placeholder", "Pievienot materiālu...")}
                        />
                      </div>
                    </div>

                    {/* Mehānismi */}
                    <div>
                      <span className={subLabelClassName}>{t("estimate.column.mechanisms", "Mehānismi")}</span>
                      <div className="space-y-1.5">
                        {option.mechanisms.map((mech, mechIdx) => (
                          <div
                            key={`${mech.positionPriceId}-${mechIdx}`}
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
                              onClick={() =>
                                removeMechanism(option.optionId, mechIdx)
                              }
                            />
                          </div>
                        ))}
                        <CatalogHintField
                          key={`${option.optionId}-mech-${option.mechanismAddKey}`}
                          value={null}
                          onChange={(ref) => {
                            if (ref) addMechanism(option.optionId, ref);
                          }}
                          catalogPositions={mechanismPositions}
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
