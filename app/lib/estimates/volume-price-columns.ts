/** Apjoma cenas apakškolonnas (pirms Darbs / Materiāls / …). */
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export const VOLUME_PRICE_COLUMN_COUNT = 5;

export const VOLUME_PRICE_SUBHEADER_LABELS = [
  "Darbietilpība (c/h)",
  "Darbs",
  "Materiāls",
  "Mehānismi",
  "Kopā",
] as const;

export function getVolumePriceSubheaderLabels(t?: Translate): readonly string[] {
  return [
    t ? t("estimate.volume_price_columns.workload", "Darbietilpība") : "Darbietilpība",
    t ? t("estimate.column.labor", "Darbs") : "Darbs",
    t ? t("estimate.column.material", "Materiāls") : "Materiāls",
    t ? t("estimate.column.mechanisms", "Mehānismi") : "Mehānismi",
    t ? t("common.total", "Kopā") : "Kopā",
  ];
}
