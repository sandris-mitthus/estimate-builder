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
  resolveLineItemHourlyRate,
} from "@/app/lib/estimates/composite-line-item";
import type { EstimateLineItem, PriceBreakdown } from "@/app/lib/estimates/types";
import type { StaleCatalogPriceHints } from "@/app/lib/positions/stale-catalog-price";
import { UNIT_PRICE_COLUMN_COUNT } from "@/app/lib/estimates/unit-price-columns";
import { getEstimateNumericStyles, deemphasizeReadOnlyNumericClass } from "@/app/lib/estimates/estimate-table-numeric-styles";
import { formatTimeNormDisplay } from "@/app/lib/positions/variable-quantity";
import { LaborTimeNormInput } from "@/app/components/labor-time-norm-input";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

const defaultStyles = getEstimateNumericStyles(false);

export const estimateUnitPriceCell = defaultStyles.cell;
export const estimateUnitPriceCellTotal = defaultStyles.cellTotal;

type EstimateUnitPriceCellsProps = {
  item: EstimateLineItem | null;
  values: PriceBreakdown;
  defaultHourlyRate: number | null;
  readOnly?: boolean;
  onChange?: (field: keyof PriceBreakdown, value: number) => void;
  onTimeNormChange?: (value: number) => void;
  staleCatalogPriceHints?: StaleCatalogPriceHints;
  compact?: boolean;
  /** UI: samazina uzmanību sadalījuma kolonnām (eksportā joprojām paslēpj). */
  deemphasizeBreakdown?: boolean;
};

export function EstimateUnitPriceCells({
  item,
  values,
  defaultHourlyRate,
  readOnly = true,
  onChange,
  onTimeNormChange,
  staleCatalogPriceHints,
  compact = false,
  deemphasizeBreakdown = false,
}: EstimateUnitPriceCellsProps) {
  const { t } = useTranslations();
  const styles = getEstimateNumericStyles(compact);
  const readOnlyNum = styles.readOnly;
  const cellNum = styles.input;
  const unitPriceCell = styles.cell;
  const unitPriceCellTotal = styles.cellTotal;
  const breakdownReadOnlyNum = deemphasizeReadOnlyNumericClass(
    readOnlyNum,
    deemphasizeBreakdown,
  );

  const total = sumBreakdown(values);
  const showLaborBreakdown = item != null && isCompositeLineItem(item);
  const timeNormText =
    showLaborBreakdown && item.laborTimeNorm != null && item.laborTimeNorm > 0
      ? formatTimeNormDisplay(item.laborTimeNorm)
      : null;
  const hourlyRateText = showLaborBreakdown
    ? formatAmountDisplay(resolveLineItemHourlyRate(item, defaultHourlyRate))
    : null;

  return (
    <>
      {showLaborBreakdown ? (
        <>
          <td className={unitPriceCell}>
            {onTimeNormChange ? (
              <LaborTimeNormInput
                value={item?.laborTimeNorm ?? 0}
                onChange={onTimeNormChange}
                className={`${cellNum} ${deemphasizeBreakdown ? "text-zinc-400" : ""}`}
                aria-label={t("estimate.time_norm", "Laika norma (c/h)")}
              />
            ) : (
              <span
                className={`${breakdownReadOnlyNum} ${
                  timeNormText ? "" : "text-zinc-300"
                }`}
              >
                {timeNormText ?? "—"}
              </span>
            )}
          </td>
          <td className={unitPriceCell}>
            <span
              className={`${breakdownReadOnlyNum} ${
                hourlyRateText ? "" : "text-zinc-300"
              }`}
            >
              {hourlyRateText ?? "—"}
            </span>
          </td>
        </>
      ) : (
        <>
          <EmptyAmountCell
            className={unitPriceCell}
            readOnlyNum={breakdownReadOnlyNum}
          />
          <EmptyAmountCell
            className={unitPriceCell}
            readOnlyNum={breakdownReadOnlyNum}
          />
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
          ? `${unitPriceCell} bg-red-100 ring-1 ring-inset ring-red-300`
          : unitPriceCell;

        const amountSpan = (
          <span
            className={`${breakdownReadOnlyNum} ${
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
                <Tooltip label={tooltipLabel} className="w-full justify-center">
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
      <td className={unitPriceCellTotal}>
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

function EmptyAmountCell({
  className,
  readOnlyNum,
}: {
  className: string;
  readOnlyNum: string;
}) {
  return (
    <td className={className}>
      <span className={`${readOnlyNum} text-zinc-300`}>—</span>
    </td>
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
