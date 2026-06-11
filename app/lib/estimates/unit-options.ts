import { ESTIMATE_UNITS } from "@/app/lib/estimates/units";

export function getEstimateUnitOptions(unit: string): string[] {
  const trimmed = unit.trim();
  if (!trimmed) {
    return [...ESTIMATE_UNITS];
  }

  if ((ESTIMATE_UNITS as readonly string[]).includes(trimmed)) {
    return [...ESTIMATE_UNITS];
  }

  return [...ESTIMATE_UNITS, trimmed];
}
