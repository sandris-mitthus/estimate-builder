import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import type {
  EstimateCategory,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";
import {
  cloneCategory,
  cloneRowItem,
  cloneSubcategory,
  remapMultiOptionLinks,
} from "@/app/lib/estimate-positions/clone-sagatave-for-project";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function rowItemLabel(row: EstimateRowItem): string {
  return row.name;
}

function findProjectCategory(
  projectCategories: EstimateCategory[],
  sagataveCategory: EstimateCategory,
  categoryIndex: number,
): EstimateCategory | undefined {
  const byIndex = projectCategories[categoryIndex];
  if (byIndex) return byIndex;

  const normalizedTitle = normalizeTitle(sagataveCategory.title);
  if (!normalizedTitle) return undefined;

  return projectCategories.find(
    (category) => normalizeTitle(category.title) === normalizedTitle,
  );
}

function findProjectSubcategory(
  projectSubcategories: EstimateSubcategory[],
  sagataveSubcategory: EstimateSubcategory,
  subcategoryIndex: number,
): EstimateSubcategory | undefined {
  const byIndex = projectSubcategories[subcategoryIndex];
  if (byIndex) return byIndex;

  const normalizedTitle = normalizeTitle(sagataveSubcategory.title);
  if (!normalizedTitle) return undefined;

  return projectSubcategories.find(
    (subcategory) => normalizeTitle(subcategory.title) === normalizedTitle,
  );
}

function findProjectRowItem(
  projectItems: EstimateRowItem[],
  sagataveRow: EstimateRowItem,
  rowIndex: number,
): EstimateRowItem | undefined {
  const byIndex = projectItems[rowIndex];
  if (byIndex && normalizeTitle(rowItemLabel(byIndex)) === normalizeTitle(rowItemLabel(sagataveRow))) {
    return byIndex;
  }

  const normalizedLabel = normalizeTitle(rowItemLabel(sagataveRow));
  if (!normalizedLabel) return undefined;

  return projectItems.find(
    (row) => normalizeTitle(rowItemLabel(row)) === normalizedLabel,
  );
}

function sagataveRowsMissingInProject(
  sagataveItems: EstimateRowItem[],
  projectItems: EstimateRowItem[],
): boolean {
  return sagataveItems.some(
    (row, rowIndex) => !findProjectRowItem(projectItems, row, rowIndex),
  );
}

/**
 * `true`, ja sagatavē ir kategorija, subkategorija vai rinda (pozīcija / multi),
 * kuras nav projekta tāmē (pēc indeksa vai nosaukuma).
 */
export function sagataveHasNewPositionsForProject(
  sagataveSections: EstimateCategory[],
  projectCategories: EstimateCategory[],
): boolean {
  for (const [categoryIndex, sagataveCategory] of sagataveSections.entries()) {
    const projectCategory = findProjectCategory(
      projectCategories,
      sagataveCategory,
      categoryIndex,
    );

    if (!projectCategory) {
      return true;
    }

    for (const [subcategoryIndex, sagataveSubcategory] of sagataveCategory.subcategories.entries()) {
      const projectSubcategory = findProjectSubcategory(
        projectCategory.subcategories,
        sagataveSubcategory,
        subcategoryIndex,
      );

      if (!projectSubcategory) {
        return true;
      }

      if (
        sagataveRowsMissingInProject(
          sagataveSubcategory.items,
          projectSubcategory.items,
        )
      ) {
        return true;
      }
    }

    if (
      sagataveRowsMissingInProject(sagataveCategory.items, projectCategory.items)
    ) {
      return true;
    }
  }

  return false;
}

function collectRowItemNodeIds(row: EstimateRowItem): string[] {
  return [row.id];
}

function collectSubcategoryNodeIds(subcategory: EstimateSubcategory): string[] {
  return [
    subcategory.id,
    ...subcategory.items.flatMap(collectRowItemNodeIds),
  ];
}

function collectCategoryNodeIds(category: EstimateCategory): string[] {
  return [
    category.id,
    ...category.subcategories.flatMap(collectSubcategoryNodeIds),
    ...category.items.flatMap(collectRowItemNodeIds),
  ];
}

function multiOptionLinkKey(optionIds: string[]): string {
  return [...optionIds].sort().join("\0");
}

function mergeMultiOptionLinks(
  projectLinks: MultiOptionLinkGroup[],
  sagataveLinks: MultiOptionLinkGroup[],
  optionIdMap: Map<string, string>,
): MultiOptionLinkGroup[] {
  const existingKeys = new Set(
    projectLinks.map((group) => multiOptionLinkKey(group.optionIds)),
  );
  const appended = remapMultiOptionLinks(
    sagataveLinks.filter((group) =>
      group.optionIds.some((optionId) => optionIdMap.has(optionId)),
    ),
    optionIdMap,
  ).filter((group) => {
    const key = multiOptionLinkKey(group.optionIds);
    if (existingKeys.has(key)) {
      return false;
    }

    existingKeys.add(key);
    return true;
  });

  return [...projectLinks, ...appended];
}

/**
 * Pievieno projekta tāmei tikai tās sagataves daļas, kuras vēl nav projektā.
 */
export function mergeNewSagatavePositionsIntoProject(
  projectCategories: EstimateCategory[],
  projectMultiOptionLinks: MultiOptionLinkGroup[],
  sagataveSections: EstimateCategory[],
  sagataveMultiOptionLinks: MultiOptionLinkGroup[] = [],
): {
  categories: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
  addedNodeIds: string[];
} {
  const optionIdMap = new Map<string, string>();
  const categories = structuredClone(projectCategories);
  const addedNodeIds: string[] = [];

  for (const [categoryIndex, sagataveCategory] of sagataveSections.entries()) {
    let projectCategory = findProjectCategory(
      categories,
      sagataveCategory,
      categoryIndex,
    );

    if (!projectCategory) {
      const clonedCategory = cloneCategory(sagataveCategory, optionIdMap);
      categories.push(clonedCategory);
      addedNodeIds.push(...collectCategoryNodeIds(clonedCategory));
      continue;
    }

    for (const [subcategoryIndex, sagataveSubcategory] of sagataveCategory.subcategories.entries()) {
      let projectSubcategory = findProjectSubcategory(
        projectCategory.subcategories,
        sagataveSubcategory,
        subcategoryIndex,
      );

      if (!projectSubcategory) {
        const clonedSubcategory = cloneSubcategory(
          sagataveSubcategory,
          optionIdMap,
        );
        projectCategory.subcategories.push(clonedSubcategory);
        addedNodeIds.push(...collectSubcategoryNodeIds(clonedSubcategory));
        continue;
      }

      for (const [rowIndex, sagataveRow] of sagataveSubcategory.items.entries()) {
        if (!findProjectRowItem(projectSubcategory.items, sagataveRow, rowIndex)) {
          const clonedRow = cloneRowItem(sagataveRow, optionIdMap);
          projectSubcategory.items.push(clonedRow);
          addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
        }
      }
    }

    for (const [rowIndex, sagataveRow] of sagataveCategory.items.entries()) {
      if (!findProjectRowItem(projectCategory.items, sagataveRow, rowIndex)) {
        const clonedRow = cloneRowItem(sagataveRow, optionIdMap);
        projectCategory.items.push(clonedRow);
        addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
      }
    }
  }

  return {
    categories,
    multiOptionLinks: mergeMultiOptionLinks(
      projectMultiOptionLinks,
      sagataveMultiOptionLinks,
      optionIdMap,
    ),
    addedNodeIds,
  };
}
