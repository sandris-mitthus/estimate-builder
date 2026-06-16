import ExcelJS from "exceljs";
import {
  roundToTwoDecimals,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import {
  calculateEstimateTotals,
  resolveEstimateLineItemPrices,
} from "@/app/lib/estimates/calculate-totals";
import {
  collectRowLineItems,
  resolveLineItemDisplayName,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type { EstimateMeta } from "@/app/lib/projects/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import {
  calculateVatBreakdown,
  hasCompanyVatNumber,
} from "@/app/lib/settings/vat-breakdown";

function fmtNum(v: number): number | string {
  if (!Number.isFinite(v) || v === 0) return "";
  return roundToTwoDecimals(v);
}

function fmtQty(v: number): number | string {
  if (!Number.isFinite(v) || v <= 0) return "";
  return roundToTwoDecimals(v);
}

const THIN: ExcelJS.Border = { style: "thin", color: { argb: "FF000000" } };
const ALL_BORDERS: ExcelJS.Borders = {
  top: THIN,
  left: THIN,
  bottom: THIN,
  right: THIN,
  diagonal: { style: "thin" },
};

// Header fill colors
const BG_HEADER_TOP = "FF4472C4"; // blue for group header row
const BG_HEADER_SUB = "FFB8CCE4"; // lighter blue for sub-header row
const BG_CATEGORY = "FFDCE6F1"; // light blue for category rows
const BG_SUBCATEGORY = "FFF2F2F2"; // very light gray for subcategory label
const BG_TOTAL = "FFD9D9D9"; // gray for grand total

function setCellStyle(
  cell: ExcelJS.Cell,
  opts: {
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    bgColor?: string;
    align?: ExcelJS.Alignment["horizontal"];
    valign?: ExcelJS.Alignment["vertical"];
    wrapText?: boolean;
    border?: boolean;
    fontColor?: string;
  },
) {
  if (opts.border !== false) {
    cell.border = ALL_BORDERS;
  }
  cell.font = {
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    size: opts.fontSize ?? 10,
    color: opts.fontColor ? { argb: opts.fontColor } : undefined,
  };
  if (opts.bgColor) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: opts.bgColor },
    };
  }
  cell.alignment = {
    horizontal: opts.align ?? "left",
    vertical: opts.valign ?? "middle",
    wrapText: opts.wrapText ?? false,
  };
}

function styleRowCells(
  row: ExcelJS.Row,
  colCount: number,
  opts: Parameters<typeof setCellStyle>[1],
) {
  for (let c = 1; c <= colCount; c++) {
    setCellStyle(row.getCell(c), opts);
  }
}

export async function buildEstimateExcel(
  title: string,
  meta: EstimateMeta,
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  vatNumber: string = "",
): Promise<Buffer> {
  const plannedProfitPercent = meta.plannedProfitPercent ?? 0;
  const totals = calculateEstimateTotals(
    categories,
    catalogPositions,
    defaultHourlyRate,
    plannedProfitPercent,
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Estimate Builder";
  const ws = workbook.addWorksheet("Tāme");

  const NUM_FMT = "0.00";

  // Column widths (A..K)
  ws.columns = [
    { width: 6 },                                    // A  Nr.
    { width: 48 },                                   // B  Nosaukums
    { width: 9 },                                    // C  Vienība
    { width: 10, style: { numFmt: NUM_FMT } },       // D  Daudzums
    { width: 13, style: { numFmt: NUM_FMT } },       // E  V.cena Darbs
    { width: 13, style: { numFmt: NUM_FMT } },       // F  V.cena Materiāli
    { width: 13, style: { numFmt: NUM_FMT } },       // G  V.cena Mehānismi
    { width: 13, style: { numFmt: NUM_FMT } },       // H  Apjoma Darbs
    { width: 13, style: { numFmt: NUM_FMT } },       // I  Apjoma Materiāli
    { width: 13, style: { numFmt: NUM_FMT } },       // J  Apjoma Mehānismi
    { width: 14, style: { numFmt: NUM_FMT } },       // K  Kopā €
  ];

  // ── Info block ──────────────────────────────────────────────────────────
  const titleRow = ws.addRow([title]);
  titleRow.getCell(1).font = { bold: true, size: 13 };
  titleRow.height = 20;

  ws.addRow(["Pasūtītājs:", meta.client]);
  ws.addRow(["Objekts:", meta.project]);
  ws.addRow(["Datums:", meta.date, "", "", "", "", "", "", "", "Termiņš:", meta.deadline]);
  ws.addRow([]); // empty spacer

  // ── Two-row merged column header ─────────────────────────────────────
  //  Row 1: Nr | Nosaukums | Vienība | Daudzums | Vienības cena (E-G) | Apjoma cena (H-K)
  //  Row 2:  ↕ |     ↕     |    ↕    |    ↕     | Darbs | Mat. | Meh. | Darbs | Mat. | Meh. | Kopā €

  const h1RowIdx = ws.rowCount + 1;
  const h2RowIdx = h1RowIdx + 1;

  const h1 = ws.addRow([
    "Nr.",
    "Nosaukums",
    "Vienība",
    "Daudzums",
    "Vienības cena",
    "",
    "",
    "Apjoma cena",
    "",
    "",
    "",
  ]);
  h1.height = 32;

  const h2 = ws.addRow([
    "",
    "",
    "",
    "",
    "Darbs",
    "Materiāli",
    "Mehānismi",
    "Darbs",
    "Materiāli",
    "Mehānismi",
    "Kopā €",
  ]);
  h2.height = 18;

  // Style header row 1
  for (let c = 1; c <= 11; c++) {
    setCellStyle(h1.getCell(c), {
      bold: true,
      fontSize: 10,
      bgColor: BG_HEADER_TOP,
      fontColor: "FFFFFFFF",
      align: "center",
      valign: "middle",
      wrapText: true,
      border: true,
    });
  }
  // Style header row 2
  for (let c = 1; c <= 11; c++) {
    setCellStyle(h2.getCell(c), {
      bold: true,
      fontSize: 10,
      bgColor: BG_HEADER_SUB,
      align: "center",
      valign: "middle",
      border: true,
    });
  }

  // Vertical merge for Nr., Nosaukums, Vienība, Daudzums (cols 1-4)
  ws.mergeCells(h1RowIdx, 1, h2RowIdx, 1);
  ws.mergeCells(h1RowIdx, 2, h2RowIdx, 2);
  ws.mergeCells(h1RowIdx, 3, h2RowIdx, 3);
  ws.mergeCells(h1RowIdx, 4, h2RowIdx, 4);

  // Horizontal merge "Vienības cena" E-G
  ws.mergeCells(h1RowIdx, 5, h1RowIdx, 7);
  // Horizontal merge "Apjoma cena" H-K
  ws.mergeCells(h1RowIdx, 8, h1RowIdx, 11);

  // ── Data rows ────────────────────────────────────────────────────────
  let nr = 0;

  for (const cat of categories) {
    const catTotals = calculateEstimateTotals(
      [cat],
      catalogPositions,
      defaultHourlyRate,
      plannedProfitPercent,
    );

    // Category header row
    const catRow = ws.addRow([
      "",
      cat.title || "Bez nosaukuma",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      roundToTwoDecimals(catTotals.grand) || "",
    ]);
    catRow.height = 18;
    styleRowCells(catRow, 11, { bold: true, fontSize: 10, bgColor: BG_CATEGORY, border: true });
    catRow.getCell(11).alignment = { horizontal: "right", vertical: "middle" };
    catRow.getCell(11).numFmt = "0.00";

    // Direct items under category
    for (const item of collectRowLineItems(cat.items, { forTotals: true })) {
      nr += 1;
      const { unitPrice, lineTotal } = resolveEstimateLineItemPrices(
        item,
        catalogPositions,
        defaultHourlyRate,
        plannedProfitPercent,
      );
      addDataRow(ws, nr, item, unitPrice, lineTotal, "");
    }

    // Subcategories
    for (const sub of cat.subcategories) {
      const subItems = collectRowLineItems(sub.items, { forTotals: true });
      if (subItems.length === 0) continue;

      const subRow = ws.addRow([
        "",
        `  ${sub.title || "Bez nosaukuma"}`,
      ]);
      subRow.height = 16;
      styleRowCells(subRow, 11, { italic: true, fontSize: 10, bgColor: BG_SUBCATEGORY, border: true });

      for (const item of subItems) {
        nr += 1;
        const { unitPrice, lineTotal } = resolveEstimateLineItemPrices(
          item,
          catalogPositions,
          defaultHourlyRate,
          plannedProfitPercent,
        );
        addDataRow(ws, nr, item, unitPrice, lineTotal, "    ");
      }
    }
  }

  // ── Grand total row ──────────────────────────────────────────────────
  ws.addRow([]); // spacer
  const showVat = hasCompanyVatNumber(vatNumber);
  const vatBreakdown = showVat ? calculateVatBreakdown(totals.grand) : null;

  const totalRow = ws.addRow([
    "",
    showVat ? "Summa bez PVN" : "PAVISAM KOPĀ",
    "",
    "",
    fmtNum(totals.labor),
    fmtNum(totals.materials),
    fmtNum(totals.mechanisms),
    "",
    "",
    "",
    fmtNum(totals.grand),
  ]);
  totalRow.height = 20;
  styleRowCells(totalRow, 11, { bold: true, fontSize: 10, bgColor: BG_TOTAL, border: true });
  for (let c = 5; c <= 11; c++) {
    totalRow.getCell(c).alignment = { horizontal: "right", vertical: "middle" };
    totalRow.getCell(c).numFmt = "0.00";
  }

  if (vatBreakdown) {
    const vatRow = ws.addRow([
      "",
      `PVN ${vatBreakdown.ratePercent}%`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      fmtNum(vatBreakdown.vatAmount),
    ]);
    vatRow.height = 18;
    styleRowCells(vatRow, 11, { fontSize: 10, border: true });
    vatRow.getCell(11).alignment = { horizontal: "right", vertical: "middle" };
    vatRow.getCell(11).numFmt = "0.00";

    const grossRow = ws.addRow([
      "",
      "KOPĀ AR PVN",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      fmtNum(vatBreakdown.gross),
    ]);
    grossRow.height = 20;
    styleRowCells(grossRow, 11, { bold: true, fontSize: 10, bgColor: BG_TOTAL, border: true });
    grossRow.getCell(11).alignment = { horizontal: "right", vertical: "middle" };
    grossRow.getCell(11).numFmt = "0.00";
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function addDataRow(
  ws: ExcelJS.Worksheet,
  nr: number,
  item: EstimateLineItem,
  unitPrice: PriceBreakdown,
  lineTotal: PriceBreakdown,
  nameIndent: string,
) {
  const row = ws.addRow([
    nr,
    `${nameIndent}${resolveLineItemDisplayName(item)}`,
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
  row.height = 16;

  for (let c = 1; c <= 11; c++) {
    const cell = row.getCell(c);
    cell.border = ALL_BORDERS;
    cell.font = { size: 10 };
    if (c === 1) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else if (c === 2) {
      cell.alignment = { horizontal: "left", vertical: "middle" };
    } else if (c === 3) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.numFmt = "0.00";
    }
  }
}
