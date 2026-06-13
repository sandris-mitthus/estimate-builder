import { collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import { isEstimateMultiPosition } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";

type VariableQuantityIndex = {
  byPriceId: Set<string>;
  byName: Set<string>;
};

function buildVariableQuantityIndex(
  sections: EstimateCategory[],
): VariableQuantityIndex {
  const byPriceId = new Set<string>();
  const byName = new Set<string>();

  for (const item of collectEstimateLineItems(sections)) {
    if (item.variableQuantity !== true) continue;
    if (item.positionPriceId) byPriceId.add(item.positionPriceId);
    const name = item.name.trim().toLowerCase();
    if (name) byName.add(name);
  }

  return { byPriceId, byName };
}

function shouldBeVariable(
  item: EstimateLineItem,
  index: VariableQuantityIndex,
): boolean {
  if (item.variableQuantity === true) return true;
  if (item.positionPriceId && index.byPriceId.has(item.positionPriceId))
    return true;
  const name = item.name.trim().toLowerCase();
  return name.length > 0 && index.byName.has(name);
}

function applyToLineItem(
  item: EstimateLineItem,
  index: VariableQuantityIndex,
): EstimateLineItem {
  if (!shouldBeVariable(item, index)) return item;
  return { ...item, variableQuantity: true };
}

function applyToMultiPosition(
  multi: EstimateMultiPosition,
  index: VariableQuantityIndex,
): EstimateMultiPosition {
  const options = multi.options.map((opt) => ({
    ...opt,
    lineItem: applyToLineItem(opt.lineItem, index),
  }));
  return { ...multi, options };
}

function applyToRow(
  row: EstimateRowItem,
  index: VariableQuantityIndex,
): EstimateRowItem {
  if (isEstimateMultiPosition(row)) {
    return applyToMultiPosition(row as EstimateMultiPosition, index);
  }
  return applyToLineItem(row as EstimateLineItem, index);
}

function applyToSubcategory(
  sub: EstimateSubcategory,
  index: VariableQuantityIndex,
): EstimateSubcategory {
  return {
    ...sub,
    items: sub.items.map((row) => applyToRow(row, index)),
  };
}

function applyToCategory(
  category: EstimateCategory,
  index: VariableQuantityIndex,
): EstimateCategory {
  return {
    ...category,
    items: category.items.map((row) => applyToRow(row, index)),
    subcategories: category.subcategories.map((sub) =>
      applyToSubcategory(sub, index),
    ),
  };
}

/**
 * Sinhronizē `variableQuantity` no sagataves vienumiem uz projekta vienumiem.
 * Salīdzina pēc `positionPriceId` (kataloga saistītiem) vai vienuma nosaukuma.
 * Tikai PIEVIENO `true` — nenoņem esošos `true` vērtību.
 */
export function syncVariableQuantityFromSagatave(
  projectCategories: EstimateCategory[],
  sagataveSections: EstimateCategory[],
): EstimateCategory[] {
  const index = buildVariableQuantityIndex(sagataveSections);

  if (index.byPriceId.size === 0 && index.byName.size === 0) {
    return projectCategories;
  }

  return projectCategories.map((cat) => applyToCategory(cat, index));
}
