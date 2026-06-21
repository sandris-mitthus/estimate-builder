"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
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
  className?: string;
  "aria-label"?: string;
  /** −/+ pogas (modālis). Tabulā atstāt bez stepper. */
  withStepper?: boolean;
  /** Modālī pogas vienmēr redzamas; citādi tikai hover/fokusā. */
  stepperButtonsAlwaysVisible?: boolean;
};

export function LaborTimeNormInput({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
  withStepper = false,
  stepperButtonsAlwaysVisible = false,
}: LaborTimeNormInputProps) {
  const { t } = useTranslations();
  const [draft, setDraft] = useState(() => formatTimeNormDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatTimeNormDisplay(value));
    }
  }, [value, focused]);

  function commitDraft(nextDraft: string) {
    const next = sanitizeTimeNormInputString(nextDraft);
    setDraft(next);

    if (next.trim()) {
      onChange(parseTimeNormInput(next));
    } else {
      onChange(0);
    }
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseTimeNormInput(draft);
    onChange(parsed);
    setDraft(formatTimeNormDisplay(parsed));
  }

  function handleStep(delta: number) {
    const next = roundQuantity(Math.max(0, value + delta));
    onChange(next);
    if (!focused) {
      setDraft(formatTimeNormDisplay(next));
    }
  }

  const inputElement = (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9.,]*"
      className={
        withStepper
          ? "min-w-0 flex-1 bg-transparent px-2 py-2 text-center tabular-nums text-sm text-zinc-900 focus:outline-none"
          : className
      }
      value={draft}
      aria-label={ariaLabel ?? t("estimate.time_norm", "Laika norma (c/h)")}
      placeholder="0,00"
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onChange={(event) => commitDraft(event.target.value)}
    />
  );

  if (!withStepper) {
    return inputElement;
  }

  const stepBtnClass = stepperButtonsAlwaysVisible
    ? "flex w-7 shrink-0 items-center justify-center self-stretch text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 select-none"
    : "self-stretch flex w-7 shrink-0 items-center justify-center text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 select-none opacity-0 group-hover/timenorm:opacity-100 focus-within:opacity-100";

  return (
    <div className="group/timenorm flex overflow-hidden rounded-lg border border-zinc-200 transition focus-within:border-zinc-400">
      <button
        type="button"
        aria-label={t("estimate.time_norm.decrease", "Samazināt par 0,01")}
        className={stepBtnClass}
        onMouseDown={(event) => {
          event.preventDefault();
          handleStep(-STEP);
        }}
      >
        −
      </button>
      {inputElement}
      <button
        type="button"
        aria-label={t("estimate.time_norm.increase", "Palielināt par 0,01")}
        className={stepBtnClass}
        onMouseDown={(event) => {
          event.preventDefault();
          handleStep(STEP);
        }}
      >
        +
      </button>
    </div>
  );
}
