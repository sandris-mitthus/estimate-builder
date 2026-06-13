"use client";

import { useEffect, useState } from "react";
import {
  formatQuantityDisplay,
  parseQuantityInput,
  sanitizeQuantityInputString,
} from "@/app/lib/positions/variable-quantity";

type MaterialConsumptionInputProps = {
  value: number;
  onChange: (value: number) => void;
  "aria-label"?: string;
};

/**
 * Materiāla patēriņš uz vienu pozīcijas mērvienību (piem. m uz vienu m²).
 * Tukša vērtība = 1.
 */
export function MaterialConsumptionInput({
  value,
  onChange,
  "aria-label": ariaLabel = "Patēriņš",
}: MaterialConsumptionInputProps) {
  const [draft, setDraft] = useState(() => formatQuantityDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatQuantityDisplay(value));
    }
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9.,]*"
      className="w-16 shrink-0 rounded-md border border-zinc-200 px-2 py-1 text-right text-xs tabular-nums text-zinc-900 focus:border-zinc-400 focus:outline-none"
      value={draft}
      aria-label={ariaLabel}
      placeholder="1,00"
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = parseQuantityInput(draft);
        onChange(parsed);
        setDraft(formatQuantityDisplay(parsed));
      }}
      onChange={(event) => {
        const next = sanitizeQuantityInputString(event.target.value);
        setDraft(next);
        if (next.trim()) {
          onChange(parseQuantityInput(next));
        } else {
          onChange(1);
        }
      }}
    />
  );
}
