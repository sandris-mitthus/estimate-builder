import { ESTIMATE_UNITS, normalizeEstimateUnit } from "@/app/lib/estimates/units";

export function getEstimateUnitOptions(unit: string): string[] {
  const trimmed = unit.trim();
  if (!trimmed) {
    return [...ESTIMATE_UNITS];
  }

  const normalized = normalizeEstimateUnit(trimmed);
  if (
    (ESTIMATE_UNITS as readonly string[]).some(
      (unit) => normalizeEstimateUnit(unit) === normalized,
    )
  ) {
    return [...ESTIMATE_UNITS];
  }

  return [...ESTIMATE_UNITS, trimmed];
}
