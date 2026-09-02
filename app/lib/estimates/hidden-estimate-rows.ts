import {
  categoryDragId,
  itemDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import { resolveCategoryChildOrder } from "@/app/lib/estimates/category-child-order";
import {
  getRowItemId,
  removeRowItemById,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";

export function isEstimateRowHidden(row: EstimateRowItem): boolean {
  return row.hiddenInEstimate === true;
}

export function isEstimateSubcategoryHidden(
  subcategory: { hiddenInEstimate?: boolean },
): boolean {
  return subcategory.hiddenInEstimate === true;
}

export function isEstimateCategoryHidden(
  category: { hiddenInEstimate?: boolean },
): boolean {
  return category.hiddenInEstimate === true;
}

export function hideEstimateRow(row: EstimateRowItem): EstimateRowItem {
  return { ...row, hiddenInEstimate: true };
}

export function restoreEstimateRow(row: EstimateRowItem): EstimateRowItem {
  return { ...row, hiddenInEstimate: undefined };
}

export function hideEstimateCategory(
  category: EstimateCategory,
): EstimateCategory {
  return { ...category, hiddenInEstimate: true };
}

export function hideEstimateSubcategory(
  subcategory: EstimateSubcategory,
): EstimateSubcategory {
  return { ...subcategory, hiddenInEstimate: true };
}

export function hideEstimateStructureByNodeIds(
  categories: EstimateCategory[],
  nodeIds: ReadonlySet<string>,
): EstimateCategory[] {
  if (nodeIds.size === 0) {
    return categories;
  }

  return categories.map((category) => ({
    ...(nodeIds.has(category.id)
      ? { ...category, hiddenInEstimate: true as const }
      : category),
    items: category.items.map((row) =>
      nodeIds.has(getRowItemId(row)) ? hideEstimateRow(row) : row,
    ),
    subcategories: category.subcategories.map((subcategory) => ({
      ...(nodeIds.has(subcategory.id)
        ? { ...subcategory, hiddenInEstimate: true as const }
        : subcategory),
      items: subcategory.items.map((row) =>
        nodeIds.has(getRowItemId(row)) ? hideEstimateRow(row) : row,
      ),
    })),
  }));
}

export function restoreEstimateCategory(
  category: EstimateCategory,
): EstimateCategory {
  return { ...category, hiddenInEstimate: undefined };
}

export function restoreEstimateSubcategory(
  subcategory: EstimateSubcategory,
): EstimateSubcategory {
  return { ...subcategory, hiddenInEstimate: undefined };
}

export function hideRowItemById(
  rows: EstimateRowItem[],
  rowId: string,
): EstimateRowItem[] {
  return rows.map((row) =>
    getRowItemId(row) === rowId ? hideEstimateRow(row) : row,
  );
}

export function restoreRowItemById(
  rows: EstimateRowItem[],
  rowId: string,
): EstimateRowItem[] {
  return rows.map((row) =>
    getRowItemId(row) === rowId ? restoreEstimateRow(row) : row,
  );
}

export function removeOrHideRowItemById(
  rows: EstimateRowItem[],
  rowId: string,
  softDelete: boolean,
): EstimateRowItem[] {
  if (softDelete) {
    return hideRowItemById(rows, rowId);
  }

  return removeRowItemById(rows, rowId);
}

export function shouldRenderEstimateRow(
  row: EstimateRowItem,
  showHidden: boolean,
): boolean {
  if (!isEstimateRowHidden(row)) {
    return true;
  }

  return showHidden;
}

export function countHiddenEstimateRows(categories: EstimateCategory[]): number {
  let count = 0;

  for (const category of categories) {
    if (isEstimateCategoryHidden(category)) {
      count += 1;
    }

    for (const row of category.items) {
      if (isEstimateRowHidden(row)) {
        count += 1;
      }
    }

    for (const subcategory of category.subcategories) {
      if (isEstimateSubcategoryHidden(subcategory)) {
        count += 1;
      }

      for (const row of subcategory.items) {
        if (isEstimateRowHidden(row)) {
          count += 1;
        }
      }
    }
  }

  return count;
}

export function hideMultiFromCategories(
  categories: EstimateCategory[],
  multiId: string,
): EstimateCategory[] {
  return categories.map((category) => ({
    ...category,
    items: hideRowItemById(category.items, multiId),
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: hideRowItemById(subcategory.items, multiId),
    })),
  }));
}

export function collectAllDragIds(
  categories: EstimateCategory[],
  options?: { includeHiddenRows?: boolean },
): string[] {
  const includeHiddenRows = options?.includeHiddenRows === true;
  const ids: string[] = [];

  for (const category of categories) {
    if (!includeHiddenRows && isEstimateCategoryHidden(category)) {
      continue;
    }

    ids.push(categoryDragId(category.id));

    for (const ref of resolveCategoryChildOrder(category)) {
      if (ref.kind === "subcategory") {
        const subcategory = category.subcategories.find(
          (entry) => entry.id === ref.id,
        );
        if (
          !subcategory ||
          (!includeHiddenRows && isEstimateSubcategoryHidden(subcategory))
        ) {
          continue;
        }

        ids.push(subcategoryDragId(ref.id));

        for (const row of subcategory.items) {
          if (!includeHiddenRows && isEstimateRowHidden(row)) {
            continue;
          }

          ids.push(itemDragId(getRowItemId(row)));
        }
        continue;
      }

      const row = category.items.find((entry) => getRowItemId(entry) === ref.id);
      if (row && !includeHiddenRows && isEstimateRowHidden(row)) {
        continue;
      }

      ids.push(itemDragId(ref.id));
    }
  }

  return ids;
}
