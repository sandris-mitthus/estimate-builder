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
} from "@/app/lib/estimates/types";

export function isEstimateRowHidden(row: EstimateRowItem): boolean {
  return row.hiddenInEstimate === true;
}

export function hideEstimateRow(row: EstimateRowItem): EstimateRowItem {
  return { ...row, hiddenInEstimate: true };
}

export function restoreEstimateRow(row: EstimateRowItem): EstimateRowItem {
  return { ...row, hiddenInEstimate: undefined };
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
    for (const row of category.items) {
      if (isEstimateRowHidden(row)) {
        count += 1;
      }
    }

    for (const subcategory of category.subcategories) {
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
    ids.push(categoryDragId(category.id));

    for (const ref of resolveCategoryChildOrder(category)) {
      if (ref.kind === "subcategory") {
        ids.push(subcategoryDragId(ref.id));
        const subcategory = category.subcategories.find(
          (entry) => entry.id === ref.id,
        );
        if (!subcategory) {
          continue;
        }

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
