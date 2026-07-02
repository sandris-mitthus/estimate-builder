"use client";

import { useEffect, useState } from "react";
import { InputWithSuffix } from "@/app/components/input-with-suffix";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatAttentionBudgetDisplay,
  formatAttentionBudgetInputValue,
  getAttentionBudgetCurrencySuffix,
  parseAttentionBudgetInput,
} from "@/app/lib/estimates/attention-budget";

type EstimateAttentionBudgetControlProps = {
  id: string;
  value?: number;
  currency?: string | null;
  onChange?: (value: number | undefined) => void;
  readOnly?: boolean;
  compact?: boolean;
};

export function EstimateAttentionBudgetControl({
  id,
  value,
  currency = null,
  onChange,
  readOnly = false,
  compact = false,
}: EstimateAttentionBudgetControlProps) {
  const { t } = useTranslations();
  const [draft, setDraft] = useState(() => formatAttentionBudgetInputValue(value));
  const currencySuffix = getAttentionBudgetCurrencySuffix(currency);
  const label = t("estimate.attention.budget_label", "Aptuvens budžets");

  useEffect(() => {
    setDraft(formatAttentionBudgetInputValue(value));
  }, [value]);

  const displayValue = formatAttentionBudgetDisplay(value, currency);

  if (readOnly) {
    if (!displayValue) {
      return null;
    }

    return (
      <p className="text-xs text-red-600">
        {label}: {displayValue}
      </p>
    );
  }

  if (!onChange) {
    return null;
  }

  function commitDraft(nextDraft: string) {
    if (!onChange) {
      return;
    }
    const parsed = parseAttentionBudgetInput(nextDraft);
    setDraft(formatAttentionBudgetInputValue(parsed));
    onChange(parsed);
  }

  if (compact) {
    return (
      <label className="mt-1 flex items-center gap-2 text-xs text-red-700" htmlFor={id}>
        <span className="shrink-0">{label}</span>
        <div className="flex min-w-0 max-w-[9rem] flex-1 overflow-hidden rounded-md border border-red-200 bg-white focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-500/10">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={draft}
            placeholder="0.00"
            aria-label={label}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => commitDraft(draft)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraft(draft);
              }
            }}
            className="min-w-0 flex-1 border-0 bg-transparent px-2 py-1 text-xs text-zinc-900 focus:outline-none"
          />
          <span className="flex shrink-0 items-center border-l border-red-100 bg-red-50/60 px-2 text-xs text-red-600">
            {currencySuffix}
          </span>
        </div>
      </label>
    );
  }

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <InputWithSuffix
        id={id}
        type="text"
        inputMode="decimal"
        value={draft}
        suffix={currencySuffix}
        placeholder="0.00"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commitDraft(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitDraft(draft);
          }
        }}
      />
    </label>
  );
}
