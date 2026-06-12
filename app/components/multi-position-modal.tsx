"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { CatalogHintField } from "@/app/components/catalog-hint-field";
import { LaborTimeNormInput } from "@/app/components/labor-time-norm-input";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { ModuleSizeAttachPicker } from "@/app/components/module-size-attach-picker";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { DeleteButton } from "@/app/components/delete-button";
import {
  formatAmountDisplay,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import { deriveCompositeUnitPrice } from "@/app/lib/estimates/composite-line-item";
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
  moduleSizeOptions?: BuildingModuleSizeOption[];
};

type OptionDraft = {
  optionId: string;
  lineItemId: string;
  label: string;
  timeNorm: number;
  material: LineItemCatalogRef | null;
  mechanism: LineItemCatalogRef | null;
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
    material: null,
    mechanism: null,
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
            material: option.lineItem.material ?? null,
            mechanism: option.lineItem.mechanism ?? null,
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
      material: option.material,
      mechanism: option.mechanism,
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
  moduleSizeOptions = [],
}: MultiPositionModalProps) {
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

  const dirty =
    snapshot({ name, attachment, options }) !== initialSnapshot;

  function updateOption(optionId: string, updates: Partial<OptionDraft>) {
    setOptions((current) =>
      current.map((entry) =>
        entry.optionId === optionId ? { ...entry, ...updates } : entry,
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
        material: option.material,
        mechanism: option.mechanism,
      },
      catalogPositions,
      defaultHourlyRate,
    );
  }

  function isMeaningfulOption(option: OptionDraft): boolean {
    return Boolean(
      option.label.trim() ||
        option.timeNorm > 0 ||
        option.material ||
        option.mechanism,
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const meaningful = options.filter(isMeaningfulOption);
    const finalOptions = meaningful.length > 0 ? meaningful : [options[0]];

    const builtOptions = finalOptions.map((option) => {
      const label =
        option.label.trim() ||
        option.material?.name ||
        option.mechanism?.name ||
        "";
      const partialItem: EstimateLineItem = {
        id: option.lineItemId,
        name: label,
        unit: "gab.",
        quantity: 1,
        laborTimeNorm: option.timeNorm,
        material: option.material,
        mechanism: option.mechanism,
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
      title="Multi-pozīcija"
      description="Vienots apjoms; katrai opcijai sava laika norma, materiāls un mehānisms."
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      dirty={dirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={labelClassName}>Nosaukums</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClassName}
            placeholder="piem. Fasādes apdare"
            autoFocus
          />
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className={labelClassName}>
              Apjoms no moduļa lieluma (vienots)
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
            <p className="text-sm font-medium text-zinc-700">Opcijas</p>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              onClick={() =>
                setOptions((current) => [...current, createOptionDraft()])
              }
            >
              + Opcija
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => {
              const unitTotal = sumBreakdown(optionUnitPrice(option));
              return (
                <div
                  key={option.optionId}
                  className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Opcija {index + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-zinc-700">
                        {formatAmountDisplay(unitTotal)}
                      </span>
                      {options.length > 1 ? (
                        <DeleteButton
                          label="Dzēst opciju"
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
                      <span className={subLabelClassName}>Nosaukums</span>
                      <input
                        type="text"
                        value={option.label}
                        onChange={(event) =>
                          updateOption(option.optionId, {
                            label: event.target.value,
                          })
                        }
                        className={inputClassName}
                        placeholder="piem. Standarta (nav obligāts)"
                      />
                    </label>
                    <label className="block">
                      <span className={subLabelClassName}>Laika norma (c/h)</span>
                      <LaborTimeNormInput
                        value={option.timeNorm}
                        onChange={(timeNorm) =>
                          updateOption(option.optionId, { timeNorm })
                        }
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={subLabelClassName}>Materiāls</span>
                      <CatalogHintField
                        value={option.material}
                        onChange={(material) =>
                          updateOption(option.optionId, { material })
                        }
                        catalogPositions={materialPositions}
                        defaultHourlyRate={defaultHourlyRate}
                        placeholder="Meklēt materiālu"
                      />
                    </div>
                    <div>
                      <span className={subLabelClassName}>Mehānisms</span>
                      <CatalogHintField
                        value={option.mechanism}
                        onChange={(mechanism) =>
                          updateOption(option.optionId, { mechanism })
                        }
                        catalogPositions={mechanismPositions}
                        defaultHourlyRate={defaultHourlyRate}
                        placeholder="Meklēt mehānismu"
                      />
                    </div>
                  </div>
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
            Saglabāt
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
