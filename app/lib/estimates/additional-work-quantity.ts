import { createCompositePosition } from "@/app/lib/estimates/composite-line-item";
import { createLineItem } from "@/app/lib/estimates/create-empty";
import {
  isEstimateLineItem,
  isEstimateMultiPosition,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";

/** Jauna rinda papildu darbu tāmē — apjoms vienmēr manuāls. */
export function createAdditionalWorkLineItem(): EstimateLineItem {
  return {
    ...createLineItem(),
    variableQuantity: true,
    quantity: 0,
  };
}

/**
 * Jauna kompozītā pozīcija papildu darbu tāmē — tāpat kā sagatavē,
 * bet ar manuālu apjomu katram objektam.
 */
export function createAdditionalWorkCompositePosition(): EstimateLineItem {
  return enableAdditionalWorkManualQuantity({
    ...createCompositePosition(),
    quantity: 0,
  });
}

export function enableAdditionalWorkManualQuantity(
  item: EstimateLineItem,
): EstimateLineItem {
  if (item.variableQuantity === true) {
    return item;
  }

  return {
    ...item,
    variableQuantity: true,
    moduleSizeAttachment: undefined,
  };
}

function enableRowManualQuantity(row: EstimateRowItem): EstimateRowItem {
  if (isEstimateLineItem(row)) {
    return enableAdditionalWorkManualQuantity(row);
  }

  if (!isEstimateMultiPosition(row)) {
    return row;
  }

  return {
    ...row,
    options: row.options.map((option) => ({
      ...option,
      lineItem: enableAdditionalWorkManualQuantity(option.lineItem),
    })),
  };
}

function enableSubcategoryManualQuantity(
  subcategory: EstimateSubcategory,
): EstimateSubcategory {
  return {
    ...subcategory,
    items: subcategory.items.map(enableRowManualQuantity),
  };
}

/**
 * Papildu darbu tāmē katrai pozīcijai apjoms ir objekta-specifisks —
 * ieslēdz `variableQuantity` visām rindām (arī jau saglabātām).
 */
export function ensureAdditionalWorkManualQuantities(
  categories: EstimateCategory[],
): EstimateCategory[] {
  return categories.map((category) => ({
    ...category,
    items: category.items.map(enableRowManualQuantity),
    subcategories: category.subcategories.map(enableSubcategoryManualQuantity),
  }));
}
