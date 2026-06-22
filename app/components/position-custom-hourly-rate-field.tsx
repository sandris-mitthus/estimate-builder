"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatAmountDisplay,
  roundToTwoDecimals,
} from "@/app/lib/estimates/calculate-line";
import { getCurrencySymbol } from "@/app/lib/settings/currencies";

type PositionCustomHourlyRateFieldProps = {
  id: string;
  enabled: boolean;
  rate: number;
  defaultHourlyRate: number | null;
  currency?: string | null;
  onEnabledChange: (enabled: boolean) => void;
  onRateChange: (rate: number) => void;
};

const inputClassName =
  "w-28 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-right text-sm tabular-nums text-zinc-900 focus:border-zinc-400 focus:outline-none";
const hourlyRateInputPattern = /^\d*(?:[,.]\d{0,2})?$/;

function formatHourlyRateInput(value: number): string {
  return roundToTwoDecimals(value).toFixed(2).replace(".", ",");
}

function parseHourlyRateInput(value: string): number {
  const parsed = Number.parseFloat(value.trim().replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return roundToTwoDecimals(parsed);
}

export function PositionCustomHourlyRateField({
  id,
  enabled,
  rate,
  defaultHourlyRate,
  currency = null,
  onEnabledChange,
  onRateChange,
}: PositionCustomHourlyRateFieldProps) {
  const { t } = useTranslations();
  const labelId = `${id}-label`;
  const currencySymbol = getCurrencySymbol(currency);
  const [draftRate, setDraftRate] = useState(() => formatHourlyRateInput(rate));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraftRate(formatHourlyRateInput(rate));
    }
  }, [editing, rate]);

  function handleRateChange(value: string) {
    const nextValue = value.replace(/\s/g, "");
    if (!hourlyRateInputPattern.test(nextValue)) {
      return;
    }

    setDraftRate(nextValue);
    onRateChange(parseHourlyRateInput(nextValue));
  }

  function handleRateBlur() {
    setEditing(false);
    const parsed = parseHourlyRateInput(draftRate);
    onRateChange(parsed);
    setDraftRate(formatHourlyRateInput(parsed));
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          id={labelId}
          className="flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-700"
        >
          <i className="fas fa-coins shrink-0 text-xs text-amber-600" aria-hidden="true" />
          <span>
            {t("positions.custom_hourly_rate.enabled_label", "Individuāla stundas likme")}
          </span>
        </div>

        {enabled ? (
          <label className="flex shrink-0 items-center gap-1.5">
            <span className="sr-only">
              {t("positions.custom_hourly_rate.rate_label", "Stundas likme")}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={draftRate}
              onFocus={() => setEditing(true)}
              onBlur={handleRateBlur}
              onChange={(event) => handleRateChange(event.target.value)}
              className={inputClassName}
              aria-label={t("positions.custom_hourly_rate.aria", "Individuālā stundas likme")}
            />
            <span className="text-xs font-medium text-zinc-500">{currencySymbol}/h</span>
          </label>
        ) : defaultHourlyRate != null ? (
          <span className="shrink-0 text-xs text-zinc-500">
            {t(
              "positions.custom_hourly_rate.default_hint",
              "Izmanto noklusējuma likmi {rate} {currency}/h",
              {
                rate: formatAmountDisplay(defaultHourlyRate),
                currency: currencySymbol,
              },
            )}
          </span>
        ) : null}

        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={enabled}
          aria-labelledby={labelId}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 appearance-none items-center rounded-full border-0 p-0 transition ${
            enabled
              ? "bg-amber-600"
              : "bg-zinc-300 ring-1 ring-inset ring-zinc-400/40"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
