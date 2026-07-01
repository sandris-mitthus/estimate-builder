"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatConsumptionDisplay,
  parseConsumptionInput,
  sanitizeConsumptionInputString,
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
  "aria-label": ariaLabel,
}: MaterialConsumptionInputProps) {
  const { t } = useTranslations();
  const [draft, setDraft] = useState(() => formatConsumptionDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatConsumptionDisplay(value));
    }
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9.,]*"
      className="w-[4.75rem] shrink-0 rounded-md border border-zinc-200 px-2 py-1 text-right text-xs tabular-nums text-zinc-900 focus:border-zinc-400 focus:outline-none"
      value={draft}
      aria-label={ariaLabel ?? t("estimate.material_consumption.label", "Patēriņš")}
      placeholder="1"
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = parseConsumptionInput(draft);
        onChange(parsed);
        setDraft(formatConsumptionDisplay(parsed));
      }}
      onChange={(event) => {
        const next = sanitizeConsumptionInputString(event.target.value);
        setDraft(next);
        if (next.trim()) {
          onChange(parseConsumptionInput(next));
        } else {
          onChange(1);
        }
      }}
    />
  );
}
