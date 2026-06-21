"use client";

import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import {
  isCompositeLineItem,
  resolveEffectiveMaterials,
  resolveEffectiveMechanisms,
} from "@/app/lib/estimates/composite-line-item";
import type { EstimateLineItem, PriceBreakdown } from "@/app/lib/estimates/types";
import type { StaleCatalogPriceHints } from "@/app/lib/positions/stale-catalog-price";
import { UNIT_PRICE_COLUMN_COUNT } from "@/app/lib/estimates/unit-price-columns";
import { formatTimeNormDisplay } from "@/app/lib/positions/variable-quantity";
import { LaborTimeNormInput } from "@/app/components/labor-time-norm-input";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

const readOnlyNum =
  "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-300 focus:bg-white focus:outline-none";
const cellNum = `${cellInput} text-right tabular-nums`;
export const estimateUnitPriceCell =
  "border-b border-zinc-100 px-1 py-0.5 align-top";
export const estimateUnitPriceCellTotal = `${estimateUnitPriceCell} bg-zinc-50/60`;

function EmptyAmountCell({ className = estimateUnitPriceCell }: { className?: string }) {
  return (
    <td className={className}>
      <span className={`${readOnlyNum} text-zinc-300`}>—</span>
    </td>
  );
}

type EstimateUnitPriceCellsProps = {
  item: EstimateLineItem | null;
  values: PriceBreakdown;
  defaultHourlyRate: number | null;
  readOnly?: boolean;
  onChange?: (field: keyof PriceBreakdown, value: number) => void;
  onTimeNormChange?: (value: number) => void;
  staleCatalogPriceHints?: StaleCatalogPriceHints;
};

export function EstimateUnitPriceCells({
  item,
  values,
  defaultHourlyRate,
  readOnly = true,
  onChange,
  onTimeNormChange,
  staleCatalogPriceHints,
}: EstimateUnitPriceCellsProps) {
  const { t } = useTranslations();
  const total = sumBreakdown(values);
  const showLaborBreakdown = item != null && isCompositeLineItem(item);
  const timeNormText =
    showLaborBreakdown && item.laborTimeNorm != null && item.laborTimeNorm > 0
      ? formatTimeNormDisplay(item.laborTimeNorm)
      : null;
  const hourlyRateText =
    showLaborBreakdown && defaultHourlyRate != null
      ? formatAmountDisplay(defaultHourlyRate)
      : null;

  return (
    <>
      {showLaborBreakdown ? (
        <>
          <td className={estimateUnitPriceCell}>
            {onTimeNormChange ? (
              <LaborTimeNormInput
                value={item?.laborTimeNorm ?? 0}
                onChange={onTimeNormChange}
                className={cellNum}
                aria-label={t("estimate.time_norm", "Laika norma (c/h)")}
              />
            ) : (
              <span
                className={`${readOnlyNum} ${
                  timeNormText ? "" : "text-zinc-300"
                }`}
              >
                {timeNormText ?? "—"}
              </span>
            )}
          </td>
          <td className={estimateUnitPriceCell}>
            <span
              className={`${readOnlyNum} ${
                hourlyRateText ? "" : "text-zinc-300"
              }`}
            >
              {hourlyRateText ?? "—"}
            </span>
          </td>
        </>
      ) : (
        <>
          <EmptyAmountCell />
          <EmptyAmountCell />
        </>
      )}
      {(["labor", "materials", "mechanisms"] as const).map((field) => {
        const staleHint =
          field === "materials" || field === "mechanisms"
            ? staleCatalogPriceHints?.[field]
            : undefined;
        let tooltipLabel: string | null = staleHint ?? null;
        if (!tooltipLabel && item) {
          const refs =
            field === "materials"
              ? resolveEffectiveMaterials(item)
              : field === "mechanisms"
                ? resolveEffectiveMechanisms(item)
                : [];
          if (refs.length === 1) {
            tooltipLabel = refs[0].name;
          } else if (refs.length > 1) {
            tooltipLabel = refs.map((r) => r.name).join(", ");
          }
        }
        const cellClassName = staleHint
          ? `${estimateUnitPriceCell} bg-red-100 ring-1 ring-inset ring-red-300`
          : estimateUnitPriceCell;

        const amountSpan = (
          <span
            className={`${readOnlyNum} ${
              isAmountDisplayEmpty(values[field]) ? "text-zinc-300" : ""
            }`}
          >
            {formatAmountDisplay(values[field])}
          </span>
        );

        return (
          <td key={field} className={cellClassName}>
            {readOnly ? (
              tooltipLabel ? (
                <Tooltip label={tooltipLabel} className="w-full justify-end">
                  {amountSpan}
                </Tooltip>
              ) : (
                amountSpan
              )
            ) : (
              <input
                type="number"
                min={0}
                step="any"
                className={cellNum}
                value={values[field]}
                onChange={(event) =>
                  onChange?.(field, parseFloat(event.target.value) || 0)
                }
              />
            )}
          </td>
        );
      })}
      <td className={estimateUnitPriceCellTotal}>
        <span
          className={`${readOnlyNum} ${
            isAmountDisplayEmpty(total)
              ? "text-zinc-300"
              : "font-medium text-zinc-900"
          }`}
        >
          {formatAmountDisplay(total)}
        </span>
      </td>
    </>
  );
}

/** Tukšas šūnas kategoriju / multi galvenes rindām. */
export function EmptyEstimateUnitPriceCells({
  cellClassName = estimateUnitPriceCell,
  totalCellClassName = estimateUnitPriceCellTotal,
}: {
  cellClassName?: string;
  totalCellClassName?: string;
} = {}) {
  return (
    <>
      {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
        <td
          key={index}
          className={
            index === UNIT_PRICE_COLUMN_COUNT - 1
              ? totalCellClassName
              : cellClassName
          }
        />
      ))}
    </>
  );
}
