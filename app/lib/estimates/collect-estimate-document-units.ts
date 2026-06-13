import { collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import { resolveCompositeLineItemDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { ESTIMATE_UNITS } from "@/app/lib/estimates/units";
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

    const key = unit.toLocaleLowerCase("lv-LV");
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
  selectedUnit: string,
): string[] {
  const baseUnits = estimateUnits.length > 0 ? estimateUnits : [...ESTIMATE_UNITS];
  const trimmed = selectedUnit.trim();
  if (!trimmed) {
    return baseUnits;
  }

  const normalized = trimmed.toLocaleLowerCase("lv-LV");
  if (
    baseUnits.some(
      (unit) => unit.toLocaleLowerCase("lv-LV") === normalized,
    )
  ) {
    return baseUnits;
  }

  return [...baseUnits, trimmed].sort((left, right) =>
    left.localeCompare(right, "lv-LV", { sensitivity: "base" }),
  );
}
