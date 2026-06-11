"use client";

import {
  createAttachItemStateKey,
  defaultModuleSizeAttachItemState,
  type ModuleSizeAttachItemState,
} from "@/app/lib/estimates/module-size-attachment";
import type { ModuleSizeSummaryItem } from "@/app/lib/modules/module-size-summary-types";
import { sanitizeQuantityInputString } from "@/app/lib/positions/variable-quantity";

export type { ModuleSizeAttachItemState };
export { createAttachItemStateKey, defaultModuleSizeAttachItemState };

type ModuleSizeAttachItemRowProps = {
  controlId: string;
  item: ModuleSizeSummaryItem;
  /** Sākotnējā vērtība pirms pārrēķina (perimetrs, tilpums u.c.). */
  baseDisplayValue?: string;
  state: ModuleSizeAttachItemState;
  onEnabledChange: (enabled: boolean) => void;
  onAdjustmentChange: (adjustment: string) => void;
};

function CompactAttachSwitch({
  id,
  enabled,
  onChange,
  label,
}: {
  id: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={enabled}
      aria-label={`Piesaistīt: ${label}`}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        enabled ? "bg-violet-600" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function ModuleSizeAttachItemRow({
  controlId,
  item,
  baseDisplayValue,
  state,
  onEnabledChange,
  onAdjustmentChange,
}: ModuleSizeAttachItemRowProps) {
  const canAdjust = item.adjustable && item.numericValue != null;
  const valueChanged =
    baseDisplayValue != null && baseDisplayValue !== item.value;
  const struckThroughValue = valueChanged ? baseDisplayValue : null;
  const highlightedValue = valueChanged ? item.value : null;

  return (
    <li
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1 rounded-lg px-1 py-1.5 text-sm transition ${
        state.enabled ? "bg-violet-50/80 ring-1 ring-inset ring-violet-200" : ""
      }`}
    >
      <CompactAttachSwitch
        id={controlId}
        enabled={state.enabled}
        onChange={onEnabledChange}
        label={item.label}
      />

      <span className="min-w-0 text-zinc-600">{item.label}</span>

      <div className="flex shrink-0 items-center gap-1.5 justify-end">
        <span
          className={`font-medium tabular-nums ${
            highlightedValue ? "text-zinc-400 line-through" : "text-zinc-900"
          }`}
        >
          {struckThroughValue ?? item.value}
        </span>
        {highlightedValue ? (
          <span className="font-semibold tabular-nums text-violet-700">
            {highlightedValue}
          </span>
        ) : null}
      </div>

      {canAdjust ? (
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-zinc-400">+</span>
          <input
            type="text"
            inputMode="decimal"
            value={state.adjustment}
            placeholder="0"
            aria-label={`Korekcija: ${item.label}`}
            onChange={(event) =>
              onAdjustmentChange(sanitizeQuantityInputString(event.target.value))
            }
            className="h-7 w-14 rounded-md border border-zinc-200 bg-white px-1.5 text-right text-xs tabular-nums text-zinc-900 transition focus:border-violet-300 focus:outline-none"
          />
        </div>
      ) : (
        <span className="w-16 shrink-0" aria-hidden="true" />
      )}
    </li>
  );
}

