import * as XLSX from "xlsx";
import { addThousandSeparators, roundToTwoDecimals, sumBreakdown } from "@/app/lib/estimates/calculate-line";
import { calculateEstimateTotals } from "@/app/lib/estimates/calculate-totals";
import { normalizeLineItemModuleSizeAttachment } from "@/app/lib/estimates/module-size-attachment";
import { collectRowLineItems } from "@/app/lib/estimates/multi-position";
import { buildUnitPriceForCatalogPosition } from "@/app/lib/positions/apply-catalog-to-line-item";
import type { EstimateCategory, EstimateLineItem, PriceBreakdown } from "@/app/lib/estimates/types";
import type { EstimateMeta } from "@/app/lib/projects/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

function fmtNum(v: number): number | string {
  if (!Number.isFinite(v) || v === 0) return "";
  return roundToTwoDecimals(v);
}

function fmtQty(v: number): number | string {
  if (!Number.isFinite(v) || v <= 0) return "";
  return roundToTwoDecimals(v);
}

function resolveItemBreakdown(
  item: EstimateLineItem,
  catalogById: Map<string, PositionPriceSummary>,
  hourlyRate: number | null,
): { unitPrice: PriceBreakdown; lineTotal: PriceBreakdown } {
  const position = item.positionPriceId ? catalogById.get(item.positionPriceId) : undefined;
  const unitPrice = position
    ? buildUnitPriceForCatalogPosition(position, hourlyRate)
    : item.unitPrice;
  const hasModuleSize = normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment) != null;
  const applyQty = (position?.variableQuantity === true || hasModuleSize) && item.quantity > 0;
  const lineTotal: PriceBreakdown = applyQty
    ? {
        labor: roundToTwoDecimals(item.quantity * unitPrice.labor),
        materials: roundToTwoDecimals(item.quantity * unitPrice.materials),
        mechanisms: roundToTwoDecimals(item.quantity * unitPrice.mechanisms),
      }
    : { ...unitPrice };
  return { unitPrice, lineTotal };
}

type Row = (string | number)[];

export function buildEstimateExcel(
  title: string,
  meta: EstimateMeta,
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): Buffer {
  const catalogById = new Map(catalogPositions.map((p) => [p.id, p]));
  const totals = calculateEstimateTotals(categories, catalogPositions, defaultHourlyRate);

  const rows: Row[] = [];

  // Info header
  rows.push([title]);
  rows.push(["Pasūtītājs:", meta.client]);
  rows.push(["Objekts:", meta.project]);
  rows.push(["Datums:", meta.date, "", "Termiņš:", meta.deadline]);
  rows.push([]);

  // Column headers (two-row header)
  rows.push([
    "Nr.",
    "Nosaukums",
    "Vienība",
    "Daudzums",
    "V.cena Darbs",
    "V.cena Materiāli",
    "V.cena Mehānismi",
    "Kopā Darbs",
    "Kopā Materiāli",
    "Kopā Mehānismi",
    "Kopā €",
  ]);

  let nr = 0;

  for (const cat of categories) {
    const catTotals = calculateEstimateTotals([cat], catalogPositions, defaultHourlyRate);

    // Category row
    rows.push([
      "",
      cat.title || "Bez nosaukuma",
      "", "", "", "", "", "", "", "",
      roundToTwoDecimals(catTotals.grand) || "",
    ]);

    // Direct items
    for (const item of collectRowLineItems(cat.items)) {
      nr += 1;
      const { unitPrice, lineTotal } = resolveItemBreakdown(item, catalogById, defaultHourlyRate);
      rows.push([
        nr,
        item.name || "",
        item.unit || "",
        fmtQty(item.quantity),
        fmtNum(unitPrice.labor),
        fmtNum(unitPrice.materials),
        fmtNum(unitPrice.mechanisms),
        fmtNum(lineTotal.labor),
        fmtNum(lineTotal.materials),
        fmtNum(lineTotal.mechanisms),
        fmtNum(sumBreakdown(lineTotal)),
      ]);
    }

    // Subcategories
    for (const sub of cat.subcategories) {
      const subItems = collectRowLineItems(sub.items);
      if (subItems.length === 0) continue;

      // Subcategory label row
      rows.push(["", `  ${sub.title || "Bez nosaukuma"}`]);

      for (const item of subItems) {
        nr += 1;
        const { unitPrice, lineTotal } = resolveItemBreakdown(item, catalogById, defaultHourlyRate);
        rows.push([
          nr,
          `    ${item.name || ""}`,
          item.unit || "",
          fmtQty(item.quantity),
          fmtNum(unitPrice.labor),
          fmtNum(unitPrice.materials),
          fmtNum(unitPrice.mechanisms),
          fmtNum(lineTotal.labor),
          fmtNum(lineTotal.materials),
          fmtNum(lineTotal.mechanisms),
          fmtNum(sumBreakdown(lineTotal)),
        ]);
      }
    }
  }

  // Grand total row
  rows.push([]);
  rows.push([
    "",
    "PAVISAM KOPĀ",
    "", "",
    fmtNum(totals.labor),
    fmtNum(totals.materials),
    fmtNum(totals.mechanisms),
    "", "", "",
    fmtNum(totals.grand),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 5 },  // Nr
    { wch: 45 }, // Name
    { wch: 8 },  // Unit
    { wch: 10 }, // Qty
    { wch: 14 }, // V.cena Darbs
    { wch: 14 }, // V.cena Materiāli
    { wch: 14 }, // V.cena Mehānismi
    { wch: 14 }, // Kopā Darbs
    { wch: 14 }, // Kopā Materiāli
    { wch: 14 }, // Kopā Mehānismi
    { wch: 14 }, // Kopā €
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tāme");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
