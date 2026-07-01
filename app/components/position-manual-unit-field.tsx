"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { normalizeEstimateUnit } from "@/app/lib/estimates/units";

type PositionManualUnitFieldProps = {
  id: string;
  enabled: boolean;
  unit: string;
  unitOptions: string[];
  onEnabledChange: (enabled: boolean) => void;
  onUnitChange: (unit: string) => void;
};

const selectClassName =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none";
const inputClassName =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none";

export function PositionManualUnitField({
  id,
  enabled,
  unit,
  unitOptions,
  onEnabledChange,
  onUnitChange,
}: PositionManualUnitFieldProps) {
  const { t } = useTranslations();
  const labelId = `${id}-label`;
  const customLabelId = `${id}-custom-label`;
  const normalizedUnitOptions = useMemo(
    () => new Set(unitOptions.map((option) => normalizeEstimateUnit(option))),
    [unitOptions],
  );
  const isKnownUnit = normalizedUnitOptions.has(normalizeEstimateUnit(unit));
  const [customUnitEnabled, setCustomUnitEnabled] = useState(
    () => unit.trim().length > 0 && !isKnownUnit,
  );

  useEffect(() => {
    if (!enabled) {
      setCustomUnitEnabled(false);
      return;
    }

    if (unit.trim().length > 0 && !isKnownUnit) {
      setCustomUnitEnabled(true);
    }
  }, [enabled, isKnownUnit, unit]);

  function handleCustomUnitEnabledChange(nextEnabled: boolean) {
    setCustomUnitEnabled(nextEnabled);

    if (!nextEnabled && !isKnownUnit) {
      onUnitChange(unitOptions[0] ?? "");
    }
  }

  const selectValue = isKnownUnit ? unit : (unitOptions[0] ?? "");

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div
          id={labelId}
          className="flex min-w-0 items-center gap-2 text-sm text-zinc-700"
        >
          <i
            className="fas fa-ruler-combined shrink-0 text-xs text-sky-600"
            aria-hidden="true"
          />
          <span>{t("positions.manual_unit.enabled_label", "Manuāli norādīta mērvienība")}</span>
        </div>
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={enabled}
          aria-labelledby={labelId}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
            enabled ? "bg-sky-600" : "bg-zinc-200"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div
              id={customLabelId}
              className="text-xs font-medium text-zinc-500"
            >
              {t("positions.manual_unit.custom_label", "Cita mērvienība")}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={customUnitEnabled}
              aria-labelledby={customLabelId}
              onClick={() =>
                handleCustomUnitEnabledChange(!customUnitEnabled)
              }
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
                customUnitEnabled ? "bg-sky-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  customUnitEnabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {customUnitEnabled ? (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-500">
                {t("common.unit", "Mērvienība")}
              </span>
              <input
                type="text"
                value={unit}
                onChange={(event) => onUnitChange(event.target.value)}
                className={inputClassName}
                placeholder={t(
                  "positions.manual_unit.custom_placeholder",
                  "Ievadi savu mērvienību",
                )}
                aria-label={t(
                  "positions.manual_unit.custom_aria",
                  "Ievadīt citu mērvienību",
                )}
              />
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-500">
                {t("common.unit", "Mērvienība")}
              </span>
              <select
                value={selectValue}
                onChange={(event) => onUnitChange(event.target.value)}
                className={selectClassName}
                aria-label={t("positions.manual_unit.aria", "Manuāli norādītā mērvienība")}
              >
                {unitOptions.length === 0 ? (
                  <option value="">
                    {t("positions.manual_unit.no_units", "Nav pieejamu mērvienību")}
                  </option>
                ) : (
                  unitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                )}
              </select>
            </label>
          )}
        </div>
      ) : null}
    </div>
  );
}
