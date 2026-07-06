import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import { VOLUME_PRICE_COLUMN_COUNT } from "@/app/lib/estimates/volume-price-columns";
import { UNIT_PRICE_COLUMN_COUNT } from "@/app/lib/estimates/unit-price-columns";
import type { PriceBreakdown } from "@/app/lib/estimates/types";
import { getEstimateNumericStyles } from "@/app/lib/estimates/estimate-table-numeric-styles";
import { Tooltip } from "@/app/components/tooltip";
import { EstimateCollapsedSummaryDisplay } from "@/app/components/estimate-collapsed-summary-display";
import type { StaleCatalogPriceHints } from "@/app/lib/positions/stale-catalog-price";
import type { CollapsedSectionSummaryParts } from "@/app/lib/estimate-positions/collapsed-sections-cookie";
import { formatTimeNormDisplay } from "@/app/lib/positions/variable-quantity";

export {
  resolveLaborWorkloadHours,
  resolveLineItemVolumeSum,
} from "@/app/lib/estimates/volume-sum-calculations";

const defaultStyles = getEstimateNumericStyles(false);
const defaultVolumeCell = defaultStyles.volumeCell;
const defaultVolumeCellTotal = defaultStyles.volumeCellTotal;

function volumeAmountClassName(
  readOnlyNum: string,
  value: number,
  emphasis = false,
  summary = false,
): string {
  if (isAmountDisplayEmpty(value)) {
    return `${readOnlyNum} text-zinc-300`;
  }

  if (summary || emphasis) {
    return `${readOnlyNum} font-semibold text-zinc-900`;
  }

  return readOnlyNum;
}

function stripDefaultSectionCellBorder(className: string): string {
  return className.replace(/\s*border-b\s+border-zinc-100/g, "");
}

function sectionVolumeCellClass(
  styles: ReturnType<typeof getEstimateNumericStyles>,
  rowBgClassName: string | undefined,
  total = false,
): string {
  const base = total ? styles.volumeCellTotal : styles.volumeCell;
  if (!rowBgClassName) {
    return base;
  }

  return `${stripDefaultSectionCellBorder(
    base.replace(/\s*bg-emerald-50\/\S+/g, ""),
  )} max-w-0 overflow-hidden ${rowBgClassName}`;
}

function SummaryAmount({
  value,
  readOnlyNum,
  emphasis = false,
  summary = false,
}: {
  value: number;
  readOnlyNum: string;
  emphasis?: boolean;
  summary?: boolean;
}) {
  const display = formatAmountDisplay(value);
  const className = `${volumeAmountClassName(
    readOnlyNum,
    value,
    emphasis,
    summary,
  )} block w-full truncate`;

  if (!summary || isAmountDisplayEmpty(value)) {
    return <span className={className}>{display}</span>;
  }

  return (
    <Tooltip label={display} className="block w-full min-w-0" align="end">
      <span className={className}>{display}</span>
    </Tooltip>
  );
}

const footerAmountClassName =
  "block w-full truncate px-0.5 py-0 text-center text-[11px] tabular-nums leading-tight font-semibold text-zinc-900";

/** Kājenes kopsummas — mazāks fonts, saīsinājums ar … un pilna summa tooltipā. */
export function FooterSumAmount({
  value,
  emphasis = false,
}: {
  value: number;
  emphasis?: boolean;
}) {
  const display = formatAmountDisplay(value);
  const className = `${footerAmountClassName}${
    isAmountDisplayEmpty(value) ? " text-zinc-300" : ""
  }${emphasis ? " font-bold" : ""}`;

  if (isAmountDisplayEmpty(value)) {
    return <span className={className}>{display}</span>;
  }

  return (
    <Tooltip label={display} className="block w-full min-w-0" align="end">
      <span className={className}>{display}</span>
    </Tooltip>
  );
}

export function VolumeSumCells({
  values,
  laborWorkloadHours = null,
  staleCatalogPriceHints,
  compact = false,
  summary = false,
  rowBgClassName,
  preLaborSummary,
}: {
  values: PriceBreakdown | null;
  laborWorkloadHours?: number | null;
  staleCatalogPriceHints?: StaleCatalogPriceHints;
  compact?: boolean;
  summary?: boolean;
  rowBgClassName?: string;
  /** Rāda tieši pirms darba summas kolonnas (darbietilpības šūnā). */
  preLaborSummary?: CollapsedSectionSummaryParts;
}) {
  const styles = getEstimateNumericStyles(compact);
  const readOnlyNum = styles.readOnly;
  const volumeCell = sectionVolumeCellClass(styles, summary ? rowBgClassName : undefined);
  const volumeCellTotal = sectionVolumeCellClass(
    styles,
    summary ? rowBgClassName : undefined,
    true,
  );
  const staleVolumeCell = `${styles.volumeCell} bg-red-100 ring-1 ring-inset ring-red-300 max-w-0 overflow-hidden`;
  const total = values ? sumBreakdown(values) : 0;
  const workloadText =
    laborWorkloadHours != null && laborWorkloadHours > 0
      ? formatTimeNormDisplay(laborWorkloadHours)
      : null;

  return (
    <>
      <td className={volumeCell}>
        {preLaborSummary ? (
          <EstimateCollapsedSummaryDisplay parts={preLaborSummary} />
        ) : (
          <span
            className={`${volumeAmountClassName(
              readOnlyNum,
              laborWorkloadHours ?? 0,
              false,
              summary,
            )}${summary ? " truncate" : ""}`}
          >
            {workloadText ?? "—"}
          </span>
        )}
      </td>
      {(["labor", "materials", "mechanisms"] as const).map((field) => {
        const staleHint =
          field === "materials" || field === "mechanisms"
            ? staleCatalogPriceHints?.[field]
            : undefined;
        const cellClassName = staleHint ? staleVolumeCell : volumeCell;
        const amountValue = values ? values[field] : 0;
        const amountSpan = summary ? (
          <SummaryAmount
            value={amountValue}
            readOnlyNum={readOnlyNum}
            summary={summary}
          />
        ) : (
          <span
            className={volumeAmountClassName(
              readOnlyNum,
              amountValue,
              false,
              summary,
            )}
          >
            {values ? formatAmountDisplay(amountValue) : "—"}
          </span>
        );

        return (
          <td key={field} className={cellClassName}>
            {staleHint ? (
              <Tooltip label={staleHint} className="w-full justify-center">
                {amountSpan}
              </Tooltip>
            ) : (
              amountSpan
            )}
          </td>
        );
      })}
      <td className={volumeCellTotal}>
        {summary ? (
          <SummaryAmount
            value={total}
            readOnlyNum={readOnlyNum}
            emphasis
            summary={summary}
          />
        ) : (
          <span className={volumeAmountClassName(readOnlyNum, total, true, summary)}>
            {values ? formatAmountDisplay(total) : "—"}
          </span>
        )}
      </td>
    </>
  );
}

export const volumeSumFooterCell =
  "border-t-2 border-zinc-300 px-0.5 py-2 text-center max-w-0 overflow-hidden align-middle bg-emerald-50/40";

export const volumeSumFooterCellTotal = `${volumeSumFooterCell} bg-emerald-100/60`;

export const unitPriceFooterCell =
  "border-t-2 border-zinc-300 px-0.5 py-2 text-center max-w-0 overflow-hidden align-middle";

export const unitPriceFooterCellTotal = `${unitPriceFooterCell} bg-sky-100/60`;

/** Tukšas šūnas pirms apjoma cenas kolonnām (Mērv., Daudz., Vienības cena). */
export function SectionLeadingEmptyCells({
  showQuantityColumn = false,
  rowBgClassName,
}: {
  showQuantityColumn?: boolean;
  rowBgClassName?: string;
}) {
  const styles = getEstimateNumericStyles(showQuantityColumn);
  const metricCell = showQuantityColumn
    ? `${stripDefaultSectionCellBorder(styles.cell)}${
        rowBgClassName ? ` ${rowBgClassName}` : ""
      }`
    : `border-b border-zinc-100 px-1 py-0.5 align-middle text-center${
        rowBgClassName ? ` ${rowBgClassName}` : ""
      }`;
  const metricCellTotal = showQuantityColumn
    ? `${stripDefaultSectionCellBorder(styles.cellTotal)}${
        rowBgClassName ? ` ${rowBgClassName}` : ""
      }`
    : metricCell;

  return (
    <>
      <td className={metricCell} />
      {showQuantityColumn ? <td className={metricCell} /> : null}
      {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
        <td
          key={index}
          className={
            index === UNIT_PRICE_COLUMN_COUNT - 1 ? metricCellTotal : metricCell
          }
        />
      ))}
    </>
  );
}

/** Tukšas šūnas kategoriju / multi galvenes rindām. */
export function EmptyVolumePriceCells({
  cellClassName = defaultVolumeCell,
  totalCellClassName = defaultVolumeCellTotal,
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
