import path from "path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { addThousandSeparators, roundToTwoDecimals, sumBreakdown } from "@/app/lib/estimates/calculate-line";
import {
  calculateEstimateTotals,
  resolveEstimateLineItemPrices,
} from "@/app/lib/estimates/calculate-totals";
import {
  collectRowLineItems,
  isEstimateLineItem,
  resolveLineItemDisplayName,
  resolveSelectedMultiLineItem,
} from "@/app/lib/estimates/multi-position";
import type { EstimateCategory, EstimateLineItem, EstimateSubcategory } from "@/app/lib/estimates/types";
import type { EstimateMeta } from "@/app/lib/projects/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { formatDisplayPhone } from "@/app/lib/validation/contact-fields";
import type { CompanySettings } from "@/app/lib/settings/types";
import { formatCompanyDisplayLines } from "@/app/lib/settings/format-company-lines";
import { parseOfferAdditionalInfoLines } from "@/app/lib/settings/offer-additional-info";
import {
  calculateVatBreakdown,
  hasCompanyVatNumber,
} from "@/app/lib/settings/vat-breakdown";
import type { PdfImageAsset } from "@/app/lib/exports/pdf-image-fetch";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";
import type { ReactNode } from "react";
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(fontsDir, "Roboto-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontsDir, "Roboto-Bold.ttf"), fontWeight: "bold" },
  ],
});

const c = {
  black: "#18181b",
  gray: "#71717a",
  grayLight: "#f4f4f5",
  white: "#ffffff",
  border: "#e4e4e7",
};

// A4 usable width: 595.28 - 2*32 = 531.28pt
// 2-column images: (531 - 8) / 2 = 261pt per column
const IMG_COL_WIDTH = 261;
const IMG_HEIGHT = 155;

const s = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 9, color: c.black, padding: "28pt 32pt" },

  reqRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  reqLines: { flex: 1, paddingRight: 16 },
  reqCompanyName: { fontSize: 11, fontWeight: "bold", marginBottom: 3 },
  reqLine: { fontSize: 8, color: c.gray, marginBottom: 2 },
  logo: { maxHeight: 56, objectFit: "contain" },

  divider: { height: 1, backgroundColor: c.border, marginBottom: 14 },

  offerTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  infoGrid: { marginBottom: 14 },
  infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 8 },
  infoBlock: { minWidth: 140 },
  infoLabel: { fontSize: 7, color: c.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 9, color: c.black },

  imgSectionTitle: { fontSize: 8, fontWeight: "bold", color: c.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  imgRow: { flexDirection: "row", marginBottom: 8 },
  imgItem: { width: IMG_COL_WIDTH, height: IMG_HEIGHT },

  tableHeader: { flexDirection: "row", backgroundColor: c.black, padding: "5pt 4pt" },
  tableHeaderCell: { color: c.white, fontSize: 7, fontWeight: "bold" },
  catRow: { flexDirection: "row", backgroundColor: c.grayLight, padding: "5pt 4pt", marginTop: 4 },
  catText: { fontSize: 8, fontWeight: "bold", color: c.black, flex: 1 },
  catTotal: { fontSize: 8, fontWeight: "bold", color: c.black, width: 72, flexShrink: 0, textAlign: "right" },
  itemRow: { flexDirection: "row", padding: "3pt 4pt", borderBottomWidth: 0.5, borderBottomColor: c.border },
  cell: { fontSize: 8, color: c.black },
  totalRow: { flexDirection: "row", padding: "6pt 4pt", borderTopWidth: 1.5, borderTopColor: c.black, marginTop: 8 },
  totalLabel: { fontSize: 9, fontWeight: "bold", flex: 1 },
  totalValue: { fontSize: 10, fontWeight: "bold", width: 72, flexShrink: 0, textAlign: "right" },
  vatRow: { flexDirection: "row", padding: "3pt 4pt" },
  vatLabel: { fontSize: 8, flex: 1 },
  vatValue: { fontSize: 8, width: 72, flexShrink: 0, textAlign: "right" },
  grossRow: { flexDirection: "row", padding: "5pt 4pt", borderTopWidth: 0.5, borderTopColor: c.border, marginTop: 2 },
  grossLabel: { fontSize: 9, fontWeight: "bold", flex: 1 },
  grossValue: { fontSize: 10, fontWeight: "bold", width: 72, flexShrink: 0, textAlign: "right" },

  signatureBlock: { marginTop: 28, alignSelf: "flex-start" },
  signatureLine: { fontSize: 9, marginBottom: 4 },

  offerNotesBlock: { marginTop: 20 },
  offerNoteLine: { fontSize: 8, color: c.gray, marginBottom: 4 },
  offerValidityLine: { fontSize: 9, fontWeight: "bold", marginTop: 4 },

  excludedBlock: { marginTop: 18 },
  excludedTitle: { fontSize: 8, fontWeight: "bold", color: c.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  excludedLine: { fontSize: 8, color: c.black, marginBottom: 3, paddingLeft: 4 },

  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: c.gray },

  colNr: { width: 22, flexShrink: 0 },
  colName: { flex: 1 },
  colTotal: { width: 72, flexShrink: 0, textAlign: "right" },
});

function fmtMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "\u2014";
  return `\u20AC ${addThousandSeparators(roundToTwoDecimals(value).toFixed(2))}`;
}

function resolveItemGrand(
  item: Parameters<typeof resolveEstimateLineItemPrices>[0],
  catalogPositions: PositionPriceSummary[],
  hourlyRate: number | null,
  plannedProfitPercent: number,
): number {
  const { lineTotal } = resolveEstimateLineItemPrices(
    item,
    catalogPositions,
    hourlyRate,
    plannedProfitPercent,
  );
  return roundToTwoDecimals(sumBreakdown(lineTotal));
}

/** PDF rindām — tās pašas pozīcijas, ko izmanto kopsummu aprēķinam. */
function collectSubcategoryOfferLineItems(
  sub: EstimateSubcategory,
): EstimateLineItem[] {
  return collectRowLineItems(sub.items, { forTotals: true });
}

function sumLineItemsGrand(
  items: EstimateLineItem[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  plannedProfitPercent: number,
): number {
  return roundToTwoDecimals(
    items.reduce(
      (sum, item) =>
        sum +
        resolveItemGrand(
          item,
          catalogPositions,
          defaultHourlyRate,
          plannedProfitPercent,
        ),
      0,
    ),
  );
}

type SubcategoryPdfRowsResult = {
  rows: ReactNode[];
  nextRowNr: number;
};

function buildSubcategoryOfferRows(
  sub: EstimateSubcategory,
  startRowNr: number,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  plannedProfitPercent: number,
  t: Translate,
): SubcategoryPdfRowsResult {
  const displayItems = collectSubcategoryOfferLineItems(sub);
  if (displayItems.length === 0) {
    return { rows: [], nextRowNr: startRowNr };
  }

  const subGrand = sumLineItemsGrand(
    displayItems,
    catalogPositions,
    defaultHourlyRate,
    plannedProfitPercent,
  );
  const subTitle = sub.title || t("common.untitled", "Bez nosaukuma");
  let rowNr = startRowNr;
  const rows: ReactNode[] = [];

  // Cenu slēpšana — kopsummas rinda, tad pozīcijas bez cenām.
  if (sub.hiddenPricesInOffer === true) {
    rowNr += 1;
    rows.push(
      <View key={`${sub.id}-summary`} style={[s.itemRow, { backgroundColor: "#fafafa" }]}>
        <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
        <Text style={[s.cell, s.colName, { fontWeight: "bold", paddingLeft: 8 }]}>
          {subTitle}
        </Text>
        <Text style={[s.cell, s.colTotal, { fontWeight: "bold" }]}>
          {fmtMoney(subGrand)}
        </Text>
      </View>,
    );

    for (const item of displayItems) {
      rowNr += 1;
      rows.push(
        <View key={item.id} style={s.itemRow}>
          <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
          <Text style={[s.cell, s.colName, { paddingLeft: 16 }]}>
            {resolveLineItemDisplayName(item)}
          </Text>
          <Text style={[s.cell, s.colTotal]} />
        </View>,
      );
    }

    return { rows, nextRowNr: rowNr };
  }

  // Pozīciju slēpšana — viena kopsummas rinda.
  if (sub.hiddenInOffer === true) {
    rowNr += 1;
    rows.push(
      <View key={sub.id} style={[s.itemRow, { backgroundColor: "#fafafa" }]}>
        <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
        <Text style={[s.cell, s.colName, { fontWeight: "bold", paddingLeft: 8 }]}>
          {subTitle}
        </Text>
        <Text style={[s.cell, s.colTotal, { fontWeight: "bold" }]}>
          {fmtMoney(subGrand)}
        </Text>
      </View>,
    );
    return { rows, nextRowNr: rowNr };
  }

  // Noklusējums — subkategorijas virsraksts + pozīcijas ar cenām.
  rows.push(
    <View key={`${sub.id}-hdr`} style={[s.itemRow, { backgroundColor: "#fafafa" }]}>
      <Text style={[s.cell, s.colNr]} />
      <Text style={[s.cell, s.colName, { fontWeight: "bold", paddingLeft: 8 }]}>
        {subTitle}
      </Text>
      <Text style={[s.cell, s.colTotal]} />
    </View>,
  );

  for (const item of displayItems) {
    rowNr += 1;
    const grand = resolveItemGrand(
      item,
      catalogPositions,
      defaultHourlyRate,
      plannedProfitPercent,
    );
    rows.push(
      <View key={item.id} style={s.itemRow}>
        <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
        <Text style={[s.cell, s.colName, { paddingLeft: 16 }]}>
          {resolveLineItemDisplayName(item)}
        </Text>
        <Text style={[s.cell, s.colTotal]}>{fmtMoney(grand)}</Text>
      </View>,
    );
  }

  return { rows, nextRowNr: rowNr };
}

export type OfferProjectInfo = {
  moduleName: string;
  clientName: string;
  address: string;
  phone: string;
  email: string;
};

type Props = {
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  company: CompanySettings;
  logo: PdfImageAsset | null;
  projectInfo: OfferProjectInfo;
  visualizationImages: PdfImageAsset[];
  excludedPositions: ExcludedPosition[];
  t?: Translate;
};

function pairImages(images: PdfImageAsset[]): Array<[PdfImageAsset, PdfImageAsset | null]> {
  const pairs: Array<[PdfImageAsset, PdfImageAsset | null]> = [];
  for (let i = 0; i < images.length; i += 2) {
    pairs.push([images[i], images[i + 1] ?? null]);
  }
  return pairs;
}

export function EstimatePdfDocument({
  title,
  meta,
  categories,
  catalogPositions,
  defaultHourlyRate,
  company,
  logo,
  projectInfo,
  visualizationImages,
  excludedPositions,
  t,
}: Props) {
  const tx: Translate = t ?? ((_key, fallback) => fallback ?? _key);
  const plannedProfitPercent = meta.plannedProfitPercent ?? 0;
  const totals = calculateEstimateTotals(
    categories,
    catalogPositions,
    defaultHourlyRate,
    plannedProfitPercent,
  );
  const companyLines = formatCompanyDisplayLines(company, tx);
  const imagePairs = pairImages(visualizationImages);
  const showVat = hasCompanyVatNumber(company.vatNumber);
  const vatBreakdown = showVat ? calculateVatBreakdown(totals.grand) : null;
  const signatureLines = [
    company.companyName.trim(),
    company.email.trim(),
    company.phone.trim() ? formatDisplayPhone(company.phone) : "",
  ].filter(Boolean);
  const offerNoteLines = parseOfferAdditionalInfoLines(company.offerAdditionalInfo);
  const showOfferNotes =
    offerNoteLines.length > 0 || company.offerValidityDays > 0;

  let rowNr = 0;

  return (
    <Document title={title} author={meta.author} subject={tx("exports.pdf.subject", "Piedāvājums")}>
      <Page size="A4" style={s.page}>

        {/* Rekviziti + logo */}
        <View style={s.reqRow}>
          <View style={s.reqLines}>
            {companyLines.map((line, i) =>
              i === 0 ? (
                <Text key={i} style={s.reqCompanyName}>{line.value}</Text>
              ) : (
                <Text key={i} style={s.reqLine}>
                  {line.label ? `${line.label}: ` : ""}{line.value}
                </Text>
              )
            )}
          </View>
          {logo ? <Image src={logo.dataUrl} style={s.logo} /> : null}
        </View>

        <View style={s.divider} />

        {/* Virsraksts + projekta info */}
        <Text style={s.offerTitle}>{tx("exports.pdf.offer", "Piedāvājums")}</Text>
        <View style={s.infoGrid}>
          <View style={s.infoRow}>
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>{tx("exports.pdf.project", "Projekts")}</Text>
              <Text style={s.infoValue}>{projectInfo.moduleName}</Text>
            </View>
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>{tx("exports.pdf.client", "Pasūtītājs")}</Text>
              <Text style={s.infoValue}>{projectInfo.clientName || "\u2014"}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={[s.infoBlock, { minWidth: 280, flex: 1 }]}>
              <Text style={s.infoLabel}>{tx("common.address", "Adrese")}</Text>
              <Text style={s.infoValue}>{projectInfo.address || "\u2014"}</Text>
            </View>
          </View>
          {(projectInfo.email || projectInfo.phone) ? (
            <View style={s.infoRow}>
              {projectInfo.email ? (
                <View style={s.infoBlock}>
                  <Text style={s.infoLabel}>{tx("common.email", "E-pasts")}</Text>
                  <Text style={s.infoValue}>{projectInfo.email}</Text>
                </View>
              ) : null}
              {projectInfo.phone ? (
                <View style={s.infoBlock}>
                  <Text style={s.infoLabel}>{tx("common.phone", "Tālrunis")}</Text>
                  <Text style={s.infoValue}>{formatDisplayPhone(projectInfo.phone)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={s.infoRow}>
            {meta.number ? (
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>{tx("common.number", "Numurs")}</Text>
                <Text style={s.infoValue}>{meta.number}</Text>
              </View>
            ) : null}
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>{tx("common.date", "Datums")}</Text>
              <Text style={s.infoValue}>{formatDisplayDateDdMmYy(meta.date)}</Text>
            </View>
            {meta.deadline ? (
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>
                  {tx("estimate.valid_until", "Derīguma termiņš")}
                </Text>
                <Text style={s.infoValue}>{formatDisplayDateDdMmYy(meta.deadline)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.divider} />

        {/* Vizualizacijas — 2 kolonnas ar eksplicitem platumu */}
        {imagePairs.length > 0 ? (
          <View>
            <Text style={s.imgSectionTitle}>{tx("exports.pdf.visualization", "Vizualizācija")}</Text>
            {imagePairs.map(([left, right], i) => (
              <View key={i} style={s.imgRow} wrap={false}>
                <Image src={left.dataUrl} style={[s.imgItem, right ? { marginRight: 8 } : {}]} />
                {right ? <Image src={right.dataUrl} style={s.imgItem} /> : null}
              </View>
            ))}
            <View style={[s.divider, { marginTop: 6 }]} />
          </View>
        ) : null}

        {/* Tabulas galvene */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, s.colNr]}>{tx("exports.pdf.nr", "Nr.")}</Text>
          <Text style={[s.tableHeaderCell, s.colName]}>{tx("common.name", "Nosaukums")}</Text>
          <Text style={[s.tableHeaderCell, s.colTotal]}>
            {tx("estimate.column.total_eur", "Kopā €")}
          </Text>
        </View>

        {/* Tabulas rindas */}
        {categories.map((cat) => {
          const catTotals = calculateEstimateTotals(
            [cat],
            catalogPositions,
            defaultHourlyRate,
            plannedProfitPercent,
          );
          return (
            <View key={cat.id}>
              <View style={s.catRow}>
                <Text style={s.catText}>{cat.title || tx("common.untitled", "Bez nosaukuma")}</Text>
                <Text style={s.catTotal}>{fmtMoney(catTotals.grand)}</Text>
              </View>

              {cat.items.map((row) => {
                const lineItem = isEstimateLineItem(row)
                  ? row
                  : resolveSelectedMultiLineItem(row);
                if (!lineItem) return null;

                rowNr += 1;
                const grand = resolveItemGrand(
                  lineItem,
                  catalogPositions,
                  defaultHourlyRate,
                  plannedProfitPercent,
                );
                const hidePrice = lineItem.hiddenPriceInOffer === true;

                return (
                  <View key={row.id} style={s.itemRow}>
                    <Text style={[s.cell, s.colNr]}>{rowNr}</Text>
                    <Text style={[s.cell, s.colName]}>
                      {resolveLineItemDisplayName(lineItem)}
                    </Text>
                    <Text style={[s.cell, s.colTotal]}>
                      {hidePrice ? "" : fmtMoney(grand)}
                    </Text>
                  </View>
                );
              })}

              {(() => {
                let subRowNr = rowNr;
                const subcategoryRows = cat.subcategories.flatMap((sub) => {
                  const result = buildSubcategoryOfferRows(
                    sub,
                    subRowNr,
                    catalogPositions,
                    defaultHourlyRate,
                    plannedProfitPercent,
                    tx,
                  );
                  subRowNr = result.nextRowNr;
                  return result.rows;
                });
                rowNr = subRowNr;
                return subcategoryRows;
              })()}
            </View>
          );
        })}

        {/* Pavisam kopa */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>
            {showVat
              ? tx("exports.total_without_vat", "Summa bez PVN")
              : tx("exports.grand_total", "PAVISAM KOPĀ")}
          </Text>
          <Text style={s.totalValue}>{fmtMoney(totals.grand)}</Text>
        </View>

        {vatBreakdown ? (
          <>
            <View style={s.vatRow}>
              <Text style={s.vatLabel}>
                {`PVN ${vatBreakdown.ratePercent}%`}
              </Text>
              <Text style={s.vatValue}>{fmtMoney(vatBreakdown.vatAmount)}</Text>
            </View>
            <View style={s.grossRow}>
              <Text style={s.grossLabel}>{tx("exports.total_with_vat", "KOPĀ AR PVN")}</Text>
              <Text style={s.grossValue}>{fmtMoney(vatBreakdown.gross)}</Text>
            </View>
          </>
        ) : null}

        {excludedPositions.length > 0 ? (
          <View style={s.excludedBlock}>
            <Text style={s.excludedTitle}>
              {tx("exports.pdf.excluded_positions", "Piedāvājumā neiekļautās pozīcijas")}
            </Text>
            {excludedPositions.map((position, index) => (
              <Text key={position.id} style={s.excludedLine}>
                {`${index + 1}. ${position.name}`}
              </Text>
            ))}
          </View>
        ) : null}

        {showOfferNotes ? (
          <View style={s.offerNotesBlock}>
            {offerNoteLines.map((line, index) => (
              <Text key={index} style={s.offerNoteLine}>
                {line}
              </Text>
            ))}
            {company.offerValidityDays > 0 ? (
              <Text style={s.offerValidityLine}>
                {tx(
                  "exports.pdf.offer_valid_days",
                  "Piedāvājums spēkā {days} dienas",
                  { days: company.offerValidityDays },
                )}
              </Text>
            ) : null}
          </View>
        ) : null}

        {signatureLines.length > 0 ? (
          <View style={s.signatureBlock}>
            {signatureLines.map((line, index) => (
              <Text key={index} style={s.signatureLine}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Kajene */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{projectInfo.clientName}{" \u00B7 "}{projectInfo.address}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
