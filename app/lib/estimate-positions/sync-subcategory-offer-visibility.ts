import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";
import { isEstimateLineItem } from "@/app/lib/estimates/multi-position";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function findSagataveCategory(
  sagataveSections: EstimateCategory[],
  projectCategory: EstimateCategory,
  categoryIndex: number,
): EstimateCategory | undefined {
  const normalizedTitle = normalizeTitle(projectCategory.title);
  if (normalizedTitle) {
    const byTitle = sagataveSections.find(
      (section) => normalizeTitle(section.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return sagataveSections[categoryIndex];
}

function findSagataveSubcategory(
  sagataveSubcategories: EstimateSubcategory[],
  projectSubcategory: EstimateSubcategory,
  subcategoryIndex: number,
): EstimateSubcategory | undefined {
  const normalizedTitle = normalizeTitle(projectSubcategory.title);
  if (normalizedTitle) {
    const byTitle = sagataveSubcategories.find(
      (subcategory) => normalizeTitle(subcategory.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return sagataveSubcategories[subcategoryIndex];
}

function rowItemLabel(row: EstimateRowItem): string {
  return row.name;
}

function findSagataveRowItem(
  sagataveItems: EstimateRowItem[],
  projectRow: EstimateRowItem,
  rowIndex: number,
): EstimateRowItem | undefined {
  const byIndex = sagataveItems[rowIndex];
  if (
    byIndex &&
    normalizeTitle(rowItemLabel(byIndex)) === normalizeTitle(rowItemLabel(projectRow))
  ) {
    return byIndex;
  }

  const normalizedLabel = normalizeTitle(rowItemLabel(projectRow));
  if (!normalizedLabel) return undefined;

  return sagataveItems.find(
    (row) => normalizeTitle(rowItemLabel(row)) === normalizedLabel,
  );
}

function applyLineItemPriceVisibilityFromSagatave(
  projectLineItem: EstimateLineItem,
  sagataveLineItem: EstimateLineItem | undefined,
): EstimateLineItem {
  if (!sagataveLineItem) return projectLineItem;

  return {
    ...projectLineItem,
    hiddenPriceInOffer: sagataveLineItem.hiddenPriceInOffer === true,
  };
}

function applyCategoryItemVisibilityFromSagatave(
  projectRow: EstimateRowItem,
  sagataveRow: EstimateRowItem | undefined,
  rowIndex: number,
  sagataveItems: EstimateRowItem[],
): EstimateRowItem {
  const sagataveMatch =
    sagataveRow ?? findSagataveRowItem(sagataveItems, projectRow, rowIndex);

  if (!sagataveMatch || !isEstimateLineItem(projectRow)) {
    return projectRow;
  }

  if (!isEstimateLineItem(sagataveMatch)) {
    return projectRow;
  }

  return applyLineItemPriceVisibilityFromSagatave(projectRow, sagataveMatch);
}

function applyVisibilityFromSagataveSubcategory(
  projectSubcategory: EstimateSubcategory,
  sagataveSubcategory: EstimateSubcategory | undefined,
): EstimateSubcategory {
  if (!sagataveSubcategory) return projectSubcategory;

  return {
    ...projectSubcategory,
    hiddenInOffer: sagataveSubcategory.hiddenInOffer === true,
    hiddenPricesInOffer: sagataveSubcategory.hiddenPricesInOffer === true,
  };
}

/**
 * Piedāvājuma PDF — subkategoriju redzamības karodziņi (`hiddenInOffer`,
 * `hiddenPricesInOffer`) un kategorijas līmeņa pozīciju `hiddenPriceInOffer`
 * tiek ņemti no sagataves, nevis projekta kopijas.
 */
export function syncSubcategoryOfferVisibilityFromSagatave(
  projectCategories: EstimateCategory[],
  sagataveSections: EstimateCategory[],
): EstimateCategory[] {
  if (sagataveSections.length === 0) return projectCategories;

  return projectCategories.map((category, categoryIndex) => {
    const sagataveCategory = findSagataveCategory(
      sagataveSections,
      category,
      categoryIndex,
    );

    if (!sagataveCategory) return category;

    return {
      ...category,
      items: category.items.map((row, rowIndex) =>
        applyCategoryItemVisibilityFromSagatave(
          row,
          sagataveCategory.items[rowIndex],
          rowIndex,
          sagataveCategory.items,
        ),
      ),
      subcategories: category.subcategories.map((subcategory, subcategoryIndex) =>
        applyVisibilityFromSagataveSubcategory(
          subcategory,
          findSagataveSubcategory(
            sagataveCategory.subcategories,
            subcategory,
            subcategoryIndex,
          ),
        ),
      ),
    };
  });
}
