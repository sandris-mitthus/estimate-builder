"use client";

import { MaterialConsumptionInput } from "@/app/components/material-consumption-input";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

type MechanismQuantityControlProps = {
  quantity: number;
  fixedQuantity: boolean;
  unit: string;
  basisUnit?: string;
  onQuantityChange: (quantity: number) => void;
  onFixedQuantityChange: (fixedQuantity: boolean) => void;
};

export function MechanismQuantityControl({
  quantity,
  fixedQuantity,
  unit,
  basisUnit,
  onQuantityChange,
  onFixedQuantityChange,
}: MechanismQuantityControlProps) {
  const { t } = useTranslations();
  const switchLabel = fixedQuantity
    ? t("estimate.mechanism_quantity.fixed_on", "Fiksēts daudzums")
    : t("estimate.mechanism_quantity.fixed_off", "Pēc laika normas");
  const unitLabel = basisUnit?.trim() ? `${unit}/${basisUnit}` : unit;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <MaterialConsumptionInput
        value={quantity}
        onChange={onQuantityChange}
        aria-label={t(
          "estimate.mechanism_quantity.aria",
          basisUnit?.trim()
            ? "Mehānisma daudzums {unit} uz {positionUnit}"
            : "Mehānisma daudzums {unit}",
          { unit, positionUnit: basisUnit ?? "" },
        )}
      />
      <span className="text-xs text-zinc-400">{unitLabel}</span>
      {basisUnit?.trim() ? null : (
        <Tooltip label={switchLabel}>
          <button
            type="button"
            role="switch"
            aria-checked={fixedQuantity}
            aria-label={t(
              "estimate.mechanism_quantity.fixed_aria",
              "Izmantot tikai definēto mehānisma daudzumu",
            )}
            onClick={() => onFixedQuantityChange(!fixedQuantity)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
              fixedQuantity ? "bg-violet-600" : "bg-zinc-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
                fixedQuantity ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
