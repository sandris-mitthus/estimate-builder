import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { addThousandSeparators, roundToTwoDecimals, sumBreakdown } from "@/app/lib/estimates/calculate-line";
import { calculateEstimateTotals } from "@/app/lib/estimates/calculate-totals";
import { collectRowLineItems } from "@/app/lib/estimates/multi-position";
import { normalizeLineItemModuleSizeAttachment } from "@/app/lib/estimates/module-size-attachment";
import type { EstimateCategory, EstimateLineItem } from "@/app/lib/estimates/types";
import type { EstimateMeta } from "@/app/lib/projects/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import { buildUnitPriceForCatalogPosition } from "@/app/lib/positions/apply-catalog-to-line-item";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";

Font.register({
  family: "Helvetica",
  fonts: [{ src: "Helvetica" }, { src: "Helvetica-Bold", fontWeight: "bold" }],
});

const c = {
  black: "#18181b",
  gray: "#71717a",
  grayLight: "#f4f4f5",
  white: "#ffffff",
  accent: "#18181b",
  border: "#e4e4e7",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: c.black, padding: "28pt 32pt" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  title: { fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 },
  subtitle: { fontSize: 9, color: c.gray, marginTop: 2 },
  metaGrid: { flexDirection: "row", gap: 24, marginBottom: 16, flexWrap: "wrap" },
  metaBlock: { minWidth: 120 },
  metaLabel: { fontSize: 7, color: c.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 9, color: c.black },
  divider: { height: 1, backgroundColor: c.border, marginBottom: 14 },
  tableHeader: { flexDirection: "row", backgroundColor: c.black, padding: "5pt 4pt", marginBottom: 0 },
  tableHeaderCell: { color: c.white, fontSize: 7, fontWeight: "bold" },
  catRow: { flexDirection: "row", backgroundColor: c.grayLight, padding: "5pt 4pt", marginTop: 4 },
  catText: { fontSize: 8, fontWeight: "bold", color: c.black, flex: 1 },
  catTotal: { fontSize: 8, fontWeight: "bold", color: c.black, width: 72, textAlign: "right" },
  itemRow: { flexDirection: "row", padding: "3pt 4pt", borderBottomWidth: 0.5, borderBottomColor: c.border },
  cell: { fontSize: 8, color: c.black },
  totalRow: { flexDirection: "row", padding: "6pt 4pt", borderTopWidth: 1.5, borderTopColor: c.black, marginTop: 8 },
  totalLabel: { fontSize: 9, fontWeight: "bold", flex: 1 },
  totalValue: { fontSize: 10, fontWeight: "bold", width: 72, textAlign: "right" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: c.gray },
  colNr: { width: 22 },
  colName: { flex: 1 },
  colUnit: { width: 38, textAlign: "right" },
  colQty: { width: 44, textAlign: "right" },
  colTotal: { width: 72, textAlign: "right" },
});

function fmtMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "—";
  return `€ ${addThousandSeparators(roundToTwoDecimals(value).toFixed(2))}`;
}

function fmtQty(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return addThousandSeparators(roundToTwoDecimals(value).toFixed(2)).replace(".", ",");
}

function resolveItemGrand(
  item: EstimateLineItem,
  catalogById: Map<string, PositionPriceSummary>,
  hourlyRate: number | null,
): number {
  const position = item.positionPriceId ? catalogById.get(item.positionPriceId) : undefined;
  const unitPrice = position
    ? buildUnitPriceForCatalogPosition(position, hourlyRate)
    : item.unitPrice;
  const hasModuleSize = normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment) != null;
  const applyQty = (position?.variableQuantity === true || hasModuleSize) && item.quantity > 0;
  const breakdown = applyQty
    ? {
        labor: roundToTwoDecimals(item.quantity * unitPrice.labor),
        materials: roundToTwoDecimals(item.quantity * unitPrice.materials),
        mechanisms: roundToTwoDecimals(item.quantity * unitPrice.mechanisms),
      }
    : unitPrice;
  return roundToTwoDecimals(sumBreakdown(breakdown));
}

type Props = {
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
};

export function EstimatePdfDocument({ title, meta, categories, catalogPositions, defaultHourlyRate }: Props) {
  const catalogById = new Map(catalogPositions.map((p) => [p.id, p]));
  const totals = calculateEstimateTotals(categories, catalogPositions, defaultHourlyRate);

  let rowNr = 0;

  return (
    <Document title={title} author={meta.author} subject="Tāmes piedāvājums">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>{title}</Text>
            <Text style={s.subtitle}>Tāmes piedāvājums</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {meta.number ? <Text style={{ fontSize: 8, color: c.gray }}>Nr. {meta.number}</Text> : null}
            <Text style={{ fontSize: 8, color: c.gray }}>Datums: {formatDisplayDateDdMmYy(meta.date)}</Text>
            {meta.deadline ? (
              <Text style={{ fontSize: 8, color: c.gray }}>Termiņš: {formatDisplayDateDdMmYy(meta.deadline)}</Text>
            ) : null}
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaGrid}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Pasūtītājs</Text>
            <Text style={s.metaValue}>{meta.client || "—"}</Text>
          </View>
          <View style={[s.metaBlock, { flex: 1 }]}>
            <Text style={s.metaLabel}>Objekts</Text>
            <Text style={s.metaValue}>{meta.project || "—"}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, s.colNr]}>Nr.</Text>
          <Text style={[s.tableHeaderCell, s.colName]}>Nosaukums</Text>
          <Text style={[s.tableHeaderCell, s.colUnit]}>Vien.</Text>
          <Text style={[s.tableHeaderCell, s.colQty]}>Daudzums</Text>
          <Text style={[s.tableHeaderCell, s.colTotal]}>Kopā €</Text>
        </View>

        {/* Rows */}
        {categories.map((cat) => {
          const catTotals = calculateEstimateTotals([cat], catalogPositions, defaultHourlyRate);
          const directItems = collectRowLineItems(cat.items, { forTotals: true });

          return (
            <View key={cat.id} wrap={false}>
              {/* Category header */}
              <View style={s.catRow}>
                <Text style={s.catText}>{cat.title || "Bez nosaukuma"}</Text>
                <Text style={s.catTotal}>{fmtMoney(catTotals.grand)}</Text>
              </View>

              {/* Direct items */}
              {directItems.map((item) => {
                rowNr += 1;
                const grand = resolveItemGrand(item, catalogById, defaultHourlyRate);
                return (
                  <View key={item.id} style={s.itemRow}>
                    <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
                    <Text style={[s.cell, s.colName]}>{item.name || "—"}</Text>
                    <Text style={[s.cell, s.colUnit]}>{item.unit || "—"}</Text>
                    <Text style={[s.cell, s.colQty]}>{fmtQty(item.quantity)}</Text>
                    <Text style={[s.cell, s.colTotal]}>{fmtMoney(grand)}</Text>
                  </View>
                );
              })}

              {/* Subcategories */}
              {cat.subcategories.map((sub) => {
                const subItems = collectRowLineItems(sub.items, { forTotals: true });
                if (subItems.length === 0) return null;

                if (sub.hiddenInOffer) {
                  const subTotals = calculateEstimateTotals(
                    [{ ...cat, subcategories: [sub], items: [] }],
                    catalogPositions,
                    defaultHourlyRate,
                  );
                  rowNr += 1;
                  return (
                    <View key={sub.id} style={s.itemRow}>
                      <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
                      <Text style={[s.cell, s.colName]}>{sub.title || "Bez nosaukuma"}</Text>
                      <Text style={[s.cell, s.colUnit]}>—</Text>
                      <Text style={[s.cell, s.colQty]}>—</Text>
                      <Text style={[s.cell, s.colTotal]}>{fmtMoney(subTotals.grand)}</Text>
                    </View>
                  );
                }

                return (
                  <View key={sub.id}>
                    <View style={[s.itemRow, { backgroundColor: "#fafafa" }]}>
                      <Text style={[s.cell, s.colNr]} />
                      <Text style={[s.cell, s.colName, { fontWeight: "bold", paddingLeft: 8 }]}>{sub.title}</Text>
                      <Text style={[s.cell, s.colUnit]} />
                      <Text style={[s.cell, s.colQty]} />
                      <Text style={[s.cell, s.colTotal]} />
                    </View>
                    {subItems.map((item) => {
                      rowNr += 1;
                      const grand = resolveItemGrand(item, catalogById, defaultHourlyRate);
                      return (
                        <View key={item.id} style={s.itemRow}>
                          <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
                          <Text style={[s.cell, s.colName, { paddingLeft: 16 }]}>{item.name || "—"}</Text>
                          <Text style={[s.cell, s.colUnit]}>{item.unit || "—"}</Text>
                          <Text style={[s.cell, s.colQty]}>{fmtQty(item.quantity)}</Text>
                          <Text style={[s.cell, s.colTotal]}>{fmtMoney(grand)}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Grand total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>PAVISAM KOPĀ</Text>
          <Text style={s.totalValue}>{fmtMoney(totals.grand)}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{meta.client} · {meta.project}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
