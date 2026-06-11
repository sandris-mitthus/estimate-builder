import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
  multiplyBreakdown,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import type { PriceBreakdown } from "@/app/lib/estimates/types";
import { roundQuantity } from "@/app/lib/positions/variable-quantity";

const readOnlyNum =
  "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
const volumeCell = "border-b border-zinc-100 px-1 py-0.5 align-top bg-emerald-50/25";
const volumeCellTotal = `${volumeCell} bg-emerald-50/50`;

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

function volumeAmountClassName(value: number, emphasis = false): string {
  if (isAmountDisplayEmpty(value)) {
    return `${readOnlyNum} text-zinc-300`;
  }

  return emphasis
    ? `${readOnlyNum} font-medium text-zinc-900`
    : readOnlyNum;
}

export function VolumeSumCells({ values }: { values: PriceBreakdown | null }) {
  const total = values ? sumBreakdown(values) : 0;

  return (
    <>
      {(["labor", "materials", "mechanisms"] as const).map((field) => (
        <td key={field} className={volumeCell}>
          <span
            className={volumeAmountClassName(values ? values[field] : 0)}
          >
            {values ? formatAmountDisplay(values[field]) : "—"}
          </span>
        </td>
      ))}
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
