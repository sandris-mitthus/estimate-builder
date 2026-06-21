/** Vienības cenas apakškolonnas (pirms Darbs / Materiāls / …). */
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export const UNIT_PRICE_COLUMN_COUNT = 6;

export const UNIT_PRICE_SUBHEADER_LABELS = [
  "Laika norma (c/h)",
  "Darba samaksas likme",
  "Darbs",
  "Materiāls",
  "Mehānismi",
  "Kopā",
] as const;

/** Atgriež kolonnu virsrakstu masīvu ar valūtu otrajā kolonnā. */
export function getUnitPriceSubheaderLabels(
  currency: string | null | undefined,
  t?: Translate,
): readonly string[] {
  return [
    t ? t("estimate.unit_price_columns.time_norm", "Laika norma (c/h)") : "Laika norma (c/h)",
    currency
      ? t
        ? t(
            "estimate.unit_price_columns.labor_rate_currency",
            "Darba samaksas likme {currency}/h",
            { currency },
          )
        : `Darba samaksas likme ${currency}/h`
      : t
        ? t("estimate.unit_price_columns.labor_rate", "Darba samaksas likme")
        : "Darba samaksas likme",
    t ? t("estimate.column.labor", "Darbs") : "Darbs",
    t ? t("estimate.column.material", "Materiāls") : "Materiāls",
    t ? t("estimate.column.mechanisms", "Mehānismi") : "Mehānismi",
    t ? t("common.total", "Kopā") : "Kopā",
  ];
}
