export const ESTIMATE_UNITS = [
  "gab.",
  "m",
  "m²",
  "m³",
  "kg",
  "t",
  "h",
  "kompl.",
] as const;

export function normalizeEstimateUnit(unit: string): string {
  return unit
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLocaleLowerCase("lv-LV");
}

export function areEstimateUnitsEquivalent(left: string, right: string): boolean {
  return normalizeEstimateUnit(left) === normalizeEstimateUnit(right);
}
