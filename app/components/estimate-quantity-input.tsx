"use client";

import { useEffect, useState } from "react";
import {
  formatQuantityDisplay,
  parseQuantityInput,
  sanitizeQuantityInputString,
} from "@/app/lib/positions/variable-quantity";

type EstimateQuantityInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
  /** Vērtība, kas tiek iestatīta, ja ievade ir tukša. Noklusējums: 1. */
  emptyValue?: number;
};

export function EstimateQuantityInput({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Apjoms",
  emptyValue = 1,
}: EstimateQuantityInputProps) {
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
      className={className}
      value={draft}
      aria-label={ariaLabel}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = draft.trim() ? parseQuantityInput(draft) : emptyValue;
        onChange(parsed);
        setDraft(formatQuantityDisplay(parsed));
      }}
      onChange={(event) => {
        const next = sanitizeQuantityInputString(event.target.value);
        setDraft(next);

        if (next.trim()) {
          onChange(parseQuantityInput(next));
        }
      }}
    />
  );
}
