/** Vienības cenas apakškolonnas (pirms Darbs / Materiāls / …). */
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
): readonly string[] {
  return [
    "Laika norma (c/h)",
    currency ? `Darba samaksas likme ${currency}/h` : "Darba samaksas likme",
    "Darbs",
    "Materiāls",
    "Mehānismi",
    "Kopā",
  ];
}
