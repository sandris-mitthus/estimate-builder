"use client";

import { useEffect, useState } from "react";
import {
  formatTimeNormDisplay,
  parseTimeNormInput,
  roundQuantity,
  sanitizeTimeNormInputString,
} from "@/app/lib/positions/variable-quantity";

const STEP = 0.01;

type LaborTimeNormInputProps = {
  value: number;
  onChange: (value: number) => void;
  "aria-label"?: string;
};

export function LaborTimeNormInput({
  value,
  onChange,
  "aria-label": ariaLabel = "Laika norma (c/h)",
}: LaborTimeNormInputProps) {
  const [draft, setDraft] = useState(() => formatTimeNormDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatTimeNormDisplay(value));
    }
  }, [value, focused]);

  function handleStep(delta: number) {
    const next = roundQuantity(Math.max(0, value + delta));
    onChange(next);
    if (!focused) {
      setDraft(formatTimeNormDisplay(next));
    }
  }

  const stepBtnClass =
    "self-stretch flex w-7 shrink-0 items-center justify-center text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 select-none opacity-0 group-hover/timenorm:opacity-100 focus-within:opacity-100";

  return (
    <div className="group/timenorm flex overflow-hidden rounded-lg border border-transparent transition hover:border-zinc-200 focus-within:border-zinc-400">
      <button
        type="button"
        aria-label="Samazināt par 0,01"
        className={stepBtnClass}
        onMouseDown={(e) => {
          e.preventDefault();
          handleStep(-STEP);
        }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9.,]*"
        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-right tabular-nums text-sm text-zinc-900 focus:outline-none"
        value={draft}
        aria-label={ariaLabel}
        placeholder="0"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const parsed = parseTimeNormInput(draft);
          onChange(parsed);
          setDraft(formatTimeNormDisplay(parsed));
        }}
        onChange={(event) => {
          const next = sanitizeTimeNormInputString(event.target.value);
          setDraft(next);

          if (next.trim()) {
            onChange(parseTimeNormInput(next));
          } else {
            onChange(0);
          }
        }}
      />
      <button
        type="button"
        aria-label="Palielināt par 0,01"
        className={stepBtnClass}
        onMouseDown={(e) => {
          e.preventDefault();
          handleStep(STEP);
        }}
      >
        +
      </button>
    </div>
  );
}
