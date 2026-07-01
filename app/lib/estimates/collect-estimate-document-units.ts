import { collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import { resolveCompositeLineItemDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { ESTIMATE_UNITS, normalizeEstimateUnit } from "@/app/lib/estimates/units";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";

export function collectEstimateDocumentUnits(
  categories: EstimateCategory[],
  moduleSizeOptions: BuildingModuleSizeOption[] = [],
): string[] {
  const seen = new Set<string>();
  const units: string[] = [];

  for (const item of collectEstimateLineItems(categories)) {
    const unit = resolveCompositeLineItemDisplayUnit(item, moduleSizeOptions);
    if (!unit) {
      continue;
    }

    const key = normalizeEstimateUnit(unit);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    units.push(unit);
  }

  return units.sort((left, right) =>
    left.localeCompare(right, "lv-LV", { sensitivity: "base" }),
  );
}

export function buildManualUnitSelectOptions(
  estimateUnits: string[],
): string[] {
  return estimateUnits.length > 0 ? estimateUnits : [...ESTIMATE_UNITS];
}
