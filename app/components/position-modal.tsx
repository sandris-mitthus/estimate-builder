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
import {
  formatAmountDisplay,
  roundToTwoDecimals,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import { deriveCompositeUnitPrice } from "@/app/lib/estimates/composite-line-item";
import { resolveLineItemDisplayUnitFromModuleSize } from "@/app/lib/estimates/sync-module-size-quantities";
import type {
  EstimateLineItem,
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
};

const labelClassName = "mb-1 block text-sm font-medium text-zinc-700";
const inputClassName =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none";

function snapshot(item: EstimateLineItem): string {
  return JSON.stringify({
    name: item.name.trim(),
    laborTimeNorm: item.laborTimeNorm ?? 0,
    material: item.material ?? null,
    mechanism: item.mechanism ?? null,
    moduleSizeAttachment: item.moduleSizeAttachment ?? null,
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
}: PositionModalProps) {
  const [draft, setDraft] = useState<EstimateLineItem>(value);
  const [initialSnapshot, setInitialSnapshot] = useState(() => snapshot(value));

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(value);
    setInitialSnapshot(snapshot(value));
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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const normalized: EstimateLineItem = {
      ...draft,
      name: draft.name.trim(),
      unit:
        resolveLineItemDisplayUnitFromModuleSize(draft, moduleSizeOptions) ??
        "gab.",
      laborTimeNorm: roundToTwoDecimals(draft.laborTimeNorm ?? 0),
      material: draft.material ?? null,
      mechanism: draft.mechanism ?? null,
      unitPrice: deriveCompositeUnitPrice(
        draft,
        catalogPositions,
        defaultHourlyRate,
      ),
    };

    onSave(normalized);
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Pozīcija"
      description="Definē nosaukumu, apjomu, laika normu, materiālu un mehānismu."
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      dirty={dirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_10rem] gap-3">
          <label className="block">
            <span className={labelClassName}>Nosaukums</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
              className={inputClassName}
              placeholder="piem. Sienas mūrēšana"
              autoFocus
            />
          </label>
          <label className="block">
            <span className={labelClassName}>Laika norma (c/h)</span>
            <LaborTimeNormInput
              value={draft.laborTimeNorm ?? 0}
              onChange={(laborTimeNorm) => patch({ laborTimeNorm })}
            />
            {defaultHourlyRate != null ? (
              <span className="mt-1 block text-xs text-zinc-500">
                Darbs = {formatAmountDisplay(defaultHourlyRate)} €/h
              </span>
            ) : null}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelClassName}>Materiāls</span>
            <CatalogHintField
              value={draft.material ?? null}
              onChange={(material) => patch({ material })}
              catalogPositions={materialPositions}
              defaultHourlyRate={defaultHourlyRate}
              placeholder="Meklēt materiālu"
            />
          </div>
          <div>
            <span className={labelClassName}>Mehānisms</span>
            <CatalogHintField
              value={draft.mechanism ?? null}
              onChange={(mechanism) => patch({ mechanism })}
              catalogPositions={mechanismPositions}
              defaultHourlyRate={defaultHourlyRate}
              placeholder="Meklēt mehānismu"
            />
          </div>
        </div>

        <dl className="grid grid-cols-4 gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 text-sm">
          {(
            [
              ["Darbs", unitPrice.labor],
              ["Materiāls", unitPrice.materials],
              ["Mehānismi", unitPrice.mechanisms],
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
            <dt className="text-xs text-zinc-500">Vienības cena</dt>
            <dd className="font-semibold tabular-nums text-zinc-900">
              {formatAmountDisplay(unitTotal)}
            </dd>
          </div>
        </dl>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className={labelClassName}>Apjoms no moduļa lieluma</span>
            {draft.moduleSizeAttachment ? (
              <AttachedModuleSizeLabel
                attachment={draft.moduleSizeAttachment}
                moduleSizeOptions={moduleSizeOptions}
              />
            ) : null}
          </div>
          <ModuleSizeAttachPicker
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
            Saglabāt
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
