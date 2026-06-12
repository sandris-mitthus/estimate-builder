import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
  multiplyBreakdown,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import { isCompositeLineItem } from "@/app/lib/estimates/composite-line-item";
import { VOLUME_PRICE_COLUMN_COUNT } from "@/app/lib/estimates/volume-price-columns";
import type { EstimateLineItem, PriceBreakdown } from "@/app/lib/estimates/types";
import type { StaleCatalogPriceHints } from "@/app/lib/positions/stale-catalog-price";
import {
  formatTimeNormDisplay,
  roundQuantity,
} from "@/app/lib/positions/variable-quantity";
import { Tooltip } from "@/app/components/tooltip";

const readOnlyNum =
  "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
const volumeCell = "border-b border-zinc-100 px-1 py-0.5 align-top bg-emerald-50/25";
const volumeCellTotal = `${volumeCell} bg-emerald-50/50`;
const staleVolumeCell =
  "border-b border-zinc-100 px-1 py-0.5 align-top bg-red-100 ring-1 ring-inset ring-red-300";

export function resolveLineItemVolumeSum(
  quantity: number,
  unitPrice: PriceBreakdown,
  variableQuantity: boolean,
): PriceBreakdown | null {
  if (!variableQuantity) {
    return null;
  }

  return multiplyBreakdown(roundQuantity(quantity), unitPrice);
}

/** Darbietilpība (c/h) = apjoms × laika norma (tikai mainīga apjoma kompozītām pozīcijām). */
export function resolveLaborWorkloadHours(
  quantity: number,
  item: EstimateLineItem | null,
  variableQuantity: boolean,
): number | null {
  if (!variableQuantity || !item || !isCompositeLineItem(item)) {
    return null;
  }

  const timeNorm = item.laborTimeNorm;
  if (timeNorm == null || !Number.isFinite(timeNorm) || timeNorm <= 0) {
    return null;
  }

  const qty = roundQuantity(quantity);
  if (qty <= 0) {
    return null;
  }

  return roundQuantity(qty * timeNorm);
}

function volumeAmountClassName(value: number, emphasis = false): string {
  if (isAmountDisplayEmpty(value)) {
    return `${readOnlyNum} text-zinc-300`;
  }

  return emphasis
    ? `${readOnlyNum} font-medium text-zinc-900`
    : readOnlyNum;
}

export function VolumeSumCells({
  values,
  laborWorkloadHours = null,
  staleCatalogPriceHints,
}: {
  values: PriceBreakdown | null;
  laborWorkloadHours?: number | null;
  staleCatalogPriceHints?: StaleCatalogPriceHints;
}) {
  const total = values ? sumBreakdown(values) : 0;
  const workloadText =
    laborWorkloadHours != null && laborWorkloadHours > 0
      ? formatTimeNormDisplay(laborWorkloadHours)
      : null;

  return (
    <>
      <td className={volumeCell}>
        <span
          className={volumeAmountClassName(
            laborWorkloadHours ?? 0,
            false,
          )}
        >
          {workloadText ?? "—"}
        </span>
      </td>
      {(["labor", "materials", "mechanisms"] as const).map((field) => {
        const staleHint =
          field === "materials" || field === "mechanisms"
            ? staleCatalogPriceHints?.[field]
            : undefined;
        const cellClassName = staleHint ? staleVolumeCell : volumeCell;
        const amountSpan = (
          <span
            className={volumeAmountClassName(values ? values[field] : 0)}
          >
            {values ? formatAmountDisplay(values[field]) : "—"}
          </span>
        );

        return (
          <td key={field} className={cellClassName}>
            {staleHint ? (
              <Tooltip label={staleHint} className="w-full justify-end">
                {amountSpan}
              </Tooltip>
            ) : (
              amountSpan
            )}
          </td>
        );
      })}
      <td className={volumeCellTotal}>
        <span className={volumeAmountClassName(total, true)}>
          {values ? formatAmountDisplay(total) : "—"}
        </span>
      </td>
    </>
  );
}

export const volumeSumFooterCell =
  "border-t-2 border-zinc-300 px-2 py-2.5 text-right text-sm font-semibold tabular-nums text-zinc-900 bg-emerald-50/40";

export const volumeSumFooterCellTotal = `${volumeSumFooterCell} bg-emerald-100/60 text-base`;

/** Tukšas šūnas kategoriju / multi galvenes rindām. */
export function EmptyVolumePriceCells({
  cellClassName = "border-b border-zinc-100 px-1 py-0.5 align-top bg-emerald-50/25",
  totalCellClassName = "border-b border-zinc-100 px-1 py-0.5 align-top bg-emerald-50/50",
}: {
  cellClassName?: string;
  totalCellClassName?: string;
} = {}) {
  return (
    <>
      {Array.from({ length: VOLUME_PRICE_COLUMN_COUNT }).map((_, index) => (
        <td
          key={index}
          className={
            index === VOLUME_PRICE_COLUMN_COUNT - 1
              ? totalCellClassName
              : cellClassName
          }
        />
      ))}
    </>
  );
}
