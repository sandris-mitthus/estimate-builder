"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  createAttachItemStateKey,
  defaultModuleSizeAttachItemState,
  type ModuleSizeAttachItemState,
} from "@/app/lib/estimates/module-size-attachment";
import type { ModuleSizeItemSign } from "@/app/lib/estimates/types";
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
  /** Zīme kopsummā — rāda tikai papildu piesaistītajiem lielumiem. */
  quantitySign?: ModuleSizeItemSign;
  onQuantitySignChange?: (sign: ModuleSizeItemSign) => void;
  /** Vai apjomu reizināt ar 2 (piem. abām sienas pusēm). */
  doubleQuantity?: boolean;
  onDoubleQuantityChange?: (doubled: boolean) => void;
  onEnabledChange: (enabled: boolean) => void;
  onAdjustmentChange: (adjustment: string) => void;
};

/** Kompakta ×2 poga — piem. grīdlīstes abām starpsienas pusēm. */
function DoubleQuantityToggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  const { t } = useTranslations();

  return (
    <Tooltip
      label={t(
        "modules.sizes.double_quantity_hint",
        "Reizināt ar 2 (abām pusēm)",
      )}
    >
      <button
        type="button"
        aria-pressed={enabled}
        aria-label={`${label} — ${t(
          "modules.sizes.double_quantity_hint",
          "Reizināt ar 2 (abām pusēm)",
        )}`}
        onClick={() => onChange(!enabled)}
        className={`inline-flex h-5 min-w-7 items-center justify-center rounded-md px-1 text-[11px] font-bold leading-none tabular-nums transition ${
          enabled
            ? "bg-violet-600 text-white"
            : "bg-transparent text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500"
        }`}
      >
        ×2
      </button>
    </Tooltip>
  );
}

/** Zaļš + / sarkans - pirms slēdža: vai lielumu pieskaita vai atņem kopsummai. */
function QuantitySignToggle({
  sign,
  onChange,
  label,
}: {
  sign: ModuleSizeItemSign;
  onChange: (sign: ModuleSizeItemSign) => void;
  label: string;
}) {
  const { t } = useTranslations();
  const isSubtract = sign === "-";

  return (
    <Tooltip
      label={
        isSubtract
          ? t("actions.switch_to_add", "Pārslēgt uz saskaitīšanu")
          : t("actions.switch_to_subtract", "Pārslēgt uz atņemšanu")
      }
    >
      <button
        type="button"
        aria-label={`${label} — ${
          isSubtract
            ? t("actions.switch_to_add", "Pārslēgt uz saskaitīšanu")
            : t("actions.switch_to_subtract", "Pārslēgt uz atņemšanu")
        }`}
        onClick={() => onChange(isSubtract ? "+" : "-")}
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-sm font-bold leading-none transition ${
          isSubtract
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
        }`}
      >
        {sign}
      </button>
    </Tooltip>
  );
}

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
  const { t } = useTranslations();

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={enabled}
      aria-label={t("modules.sizes.attach_item_aria", "Piesaistīt: {label}", {
        label,
      })}
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

/** Atgriež zīmi un absolūto vērtību no saglabātās korekcijas virknes. */
function parseSignAndMagnitude(adjustment: string): { sign: "+" | "-"; magnitude: string } {
  const trimmed = adjustment.trim();
  if (trimmed.startsWith("-")) {
    return { sign: "-", magnitude: trimmed.slice(1) };
  }
  return { sign: "+", magnitude: trimmed };
}

export function ModuleSizeAttachItemRow({
  controlId,
  item,
  baseDisplayValue,
  state,
  quantitySign,
  onQuantitySignChange,
  doubleQuantity,
  onDoubleQuantityChange,
  onEnabledChange,
  onAdjustmentChange,
}: ModuleSizeAttachItemRowProps) {
  const { t } = useTranslations();
  const canAdjust = item.adjustable && item.numericValue != null;
  const valueChanged =
    baseDisplayValue != null && baseDisplayValue !== item.value;
  const struckThroughValue = valueChanged ? baseDisplayValue : null;
  const highlightedValue = valueChanged ? item.value : null;

  const initial = parseSignAndMagnitude(state.adjustment);

  // Lokālais ievades stāvoklis — nodrošina tūlītēju atjauninājumu.
  const [sign, setSign] = useState<"+" | "-">(initial.sign);
  const [inputValue, setInputValue] = useState(initial.magnitude);

  // Sinhronizē tikai tad, kad vecāks mainās ārēji (piem. piesaistot citu moduli).
  useEffect(() => {
    const parsed = parseSignAndMagnitude(state.adjustment);
    setSign(parsed.sign);
    setInputValue(parsed.magnitude);
  }, [state.adjustment]);

  function emitAdjustment(nextSign: "+" | "-", nextMagnitude: string) {
    const magnitude = sanitizeQuantityInputString(nextMagnitude);
    const value = magnitude ? (nextSign === "-" ? `-${magnitude}` : magnitude) : "";
    onAdjustmentChange(value);
  }

  function handleSignToggle() {
    const nextSign = sign === "+" ? "-" : "+";
    setSign(nextSign);
    emitAdjustment(nextSign, inputValue);
  }

  const showQuantitySign = quantitySign != null && onQuantitySignChange != null;
  const showDoubleToggle =
    state.enabled && onDoubleQuantityChange != null;

  return (
    <li
      className={`grid grid-cols-[auto_auto_auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1 rounded-lg px-1 py-1.5 text-sm transition ${
        state.enabled ? "bg-violet-50/80 ring-1 ring-inset ring-violet-200" : ""
      }`}
    >
      {showQuantitySign ? (
        <QuantitySignToggle
          sign={quantitySign}
          onChange={onQuantitySignChange}
          label={item.label}
        />
      ) : (
        <span className="w-5 shrink-0" aria-hidden="true" />
      )}

      <CompactAttachSwitch
        id={controlId}
        enabled={state.enabled}
        onChange={onEnabledChange}
        label={item.label}
      />

      {showDoubleToggle ? (
        <DoubleQuantityToggle
          enabled={doubleQuantity === true}
          onChange={onDoubleQuantityChange}
          label={item.label}
        />
      ) : (
        <span className="w-7 shrink-0" aria-hidden="true" />
      )}

      <span
        className="min-w-0 cursor-pointer select-none text-zinc-600"
        onClick={() => onEnabledChange(!state.enabled)}
      >
        {item.label}
      </span>

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
          <button
            type="button"
            aria-label={
              sign === "+"
                ? t("actions.switch_to_subtract", "Pārslēgt uz atņemšanu")
                : t("actions.switch_to_add", "Pārslēgt uz saskaitīšanu")
            }
            onClick={handleSignToggle}
            className={`w-4 text-center text-xs font-semibold transition ${
              sign === "-"
                ? "text-red-500 hover:text-red-400"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {sign}
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            placeholder="0"
            aria-label={t("modules.sizes.adjustment_aria", "Korekcija: {label}", {
              label: item.label,
            })}
            onChange={(event) => {
              const sanitized = sanitizeQuantityInputString(event.target.value);
              setInputValue(sanitized);
              emitAdjustment(sign, sanitized);
            }}
            className="h-7 w-14 rounded-md border border-zinc-200 bg-white px-1.5 text-right text-xs tabular-nums text-zinc-900 transition focus:border-violet-300 focus:outline-none"
          />
        </div>
      ) : (
        <span className="w-16 shrink-0" aria-hidden="true" />
      )}
    </li>
  );
}

