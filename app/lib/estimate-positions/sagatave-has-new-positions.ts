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
import {
  findProjectRowForSagataveRow,
  normalizeRowTitle,
  rowItemLabel,
} from "@/app/lib/estimate-positions/sagatave-row-matching";

function normalizeTitle(title: string): string {
  return normalizeRowTitle(title);
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
  sagataveItemCount: number,
): EstimateRowItem | undefined {
  return findProjectRowForSagataveRow(
    projectItems,
    sagataveRow,
    rowIndex,
    sagataveItemCount,
  );
}

function sagataveRowsMissingInProject(
  sagataveItems: EstimateRowItem[],
  projectItems: EstimateRowItem[],
): boolean {
  return sagataveItems.some(
    (row, rowIndex) =>
      !findProjectRowItem(projectItems, row, rowIndex, sagataveItems.length),
  );
}

function isStructureSelected(
  structureId: string,
  selectedSagataveRowIds?: ReadonlySet<string>,
): boolean {
  return !selectedSagataveRowIds || selectedSagataveRowIds.has(structureId);
}

function isMissingRowSelected(
  sagataveRow: EstimateRowItem,
  projectItems: EstimateRowItem[],
  rowIndex: number,
  sagataveItemCount: number,
  selectedSagataveRowIds?: ReadonlySet<string>,
): boolean {
  if (
    findProjectRowItem(
      projectItems,
      sagataveRow,
      rowIndex,
      sagataveItemCount,
    )
  ) {
    return false;
  }

  if (selectedSagataveRowIds && !selectedSagataveRowIds.has(sagataveRow.id)) {
    return false;
  }

  return true;
}

export type MissingSagatavePositionEntry = {
  sagataveRowId: string;
  name: string;
};

export type MissingSagataveStructureKind = "category" | "subcategory";

export type MissingSagatavePositionGroup = {
  categoryTitle: string;
  subcategoryTitle?: string;
  positions: MissingSagatavePositionEntry[];
  structureKind?: MissingSagataveStructureKind;
};

/**
 * Saraksts ar sagataves pozīcijām / multi, kuru nav projekta tāmē.
 */
export function listMissingSagatavePositions(
  sagataveSections: EstimateCategory[],
  projectCategories: EstimateCategory[],
): MissingSagatavePositionGroup[] {
  const groups: MissingSagatavePositionGroup[] = [];

  for (const [categoryIndex, sagataveCategory] of sagataveSections.entries()) {
    const projectCategory = findProjectCategory(
      projectCategories,
      sagataveCategory,
      categoryIndex,
    );

    const missingCategoryItems: MissingSagatavePositionEntry[] = [];
    for (const [rowIndex, row] of sagataveCategory.items.entries()) {
      if (
        !projectCategory ||
        !findProjectRowItem(
          projectCategory.items,
          row,
          rowIndex,
          sagataveCategory.items.length,
        )
      ) {
        missingCategoryItems.push({
          sagataveRowId: row.id,
          name: rowItemLabel(row),
        });
      }
    }

    if (missingCategoryItems.length > 0) {
      groups.push({
        categoryTitle: sagataveCategory.title,
        positions: missingCategoryItems,
      });
    } else if (
      !projectCategory &&
      sagataveCategory.items.length === 0 &&
      sagataveCategory.subcategories.length === 0
    ) {
      groups.push({
        categoryTitle: sagataveCategory.title,
        structureKind: "category",
        positions: [
          {
            sagataveRowId: sagataveCategory.id,
            name: sagataveCategory.title,
          },
        ],
      });
    }

    for (const [subcategoryIndex, sagataveSubcategory] of sagataveCategory.subcategories.entries()) {
      const projectSubcategory = projectCategory
        ? findProjectSubcategory(
            projectCategory.subcategories,
            sagataveSubcategory,
            subcategoryIndex,
          )
        : undefined;

      const missingSubcategoryItems: MissingSagatavePositionEntry[] = [];
      for (const [rowIndex, row] of sagataveSubcategory.items.entries()) {
        if (
          !projectSubcategory ||
          !findProjectRowItem(
            projectSubcategory.items,
            row,
            rowIndex,
            sagataveSubcategory.items.length,
          )
        ) {
          missingSubcategoryItems.push({
            sagataveRowId: row.id,
            name: rowItemLabel(row),
          });
        }
      }

      if (missingSubcategoryItems.length > 0) {
        groups.push({
          categoryTitle: sagataveCategory.title,
          subcategoryTitle: sagataveSubcategory.title,
          positions: missingSubcategoryItems,
        });
      } else if (
        !projectSubcategory &&
        sagataveSubcategory.items.length === 0
      ) {
        groups.push({
          categoryTitle: sagataveCategory.title,
          subcategoryTitle: sagataveSubcategory.title,
          structureKind: "subcategory",
          positions: [
            {
              sagataveRowId: sagataveSubcategory.id,
              name: sagataveSubcategory.title,
            },
          ],
        });
      }
    }
  }

  return groups;
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

export function collectRowItemNodeIds(row: EstimateRowItem): string[] {
  return [row.id];
}

export function collectSubcategoryNodeIds(subcategory: EstimateSubcategory): string[] {
  return [
    subcategory.id,
    ...subcategory.items.flatMap(collectRowItemNodeIds),
  ];
}

export function collectCategoryNodeIds(category: EstimateCategory): string[] {
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
  selectedSagataveRowIds?: ReadonlySet<string>,
): {
  categories: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
  addedNodeIds: string[];
} {
  const optionIdMap = new Map<string, string>();
  const categories = structuredClone(projectCategories);
  const addedNodeIds: string[] = [];

  for (const [categoryIndex, sagataveCategory] of sagataveSections.entries()) {
    const projectCategory = findProjectCategory(
      categories,
      sagataveCategory,
      categoryIndex,
    );

    if (!projectCategory) {
      const partialSubcategories: EstimateSubcategory[] = [];

      for (const sagataveSubcategory of sagataveCategory.subcategories) {
        const selectedItems = sagataveSubcategory.items.filter((row, rowIndex) =>
          isMissingRowSelected(
            row,
            [],
            rowIndex,
            sagataveSubcategory.items.length,
            selectedSagataveRowIds,
          ),
        );

        if (selectedItems.length > 0) {
          partialSubcategories.push({
            ...sagataveSubcategory,
            items: selectedItems,
          });
        }
      }

      const selectedCategoryItems = sagataveCategory.items.filter((row, rowIndex) =>
        isMissingRowSelected(
          row,
          [],
          rowIndex,
          sagataveCategory.items.length,
          selectedSagataveRowIds,
        ),
      );

      if (partialSubcategories.length === 0 && selectedCategoryItems.length === 0) {
        if (isStructureSelected(sagataveCategory.id, selectedSagataveRowIds)) {
          const clonedCategory = cloneCategory(sagataveCategory, optionIdMap);
          categories.push(clonedCategory);
          addedNodeIds.push(...collectCategoryNodeIds(clonedCategory));
        }
        continue;
      }

      const clonedCategory = cloneCategory(
        {
          ...sagataveCategory,
          subcategories: partialSubcategories,
          items: selectedCategoryItems,
        },
        optionIdMap,
      );
      categories.push(clonedCategory);
      addedNodeIds.push(...collectCategoryNodeIds(clonedCategory));
      continue;
    }

    for (const [subcategoryIndex, sagataveSubcategory] of sagataveCategory.subcategories.entries()) {
      const projectSubcategory = findProjectSubcategory(
        projectCategory.subcategories,
        sagataveSubcategory,
        subcategoryIndex,
      );

      if (!projectSubcategory) {
        const selectedItems = sagataveSubcategory.items.filter((row, rowIndex) =>
          isMissingRowSelected(
            row,
            [],
            rowIndex,
            sagataveSubcategory.items.length,
            selectedSagataveRowIds,
          ),
        );

        if (selectedItems.length === 0) {
          if (
            isStructureSelected(sagataveSubcategory.id, selectedSagataveRowIds)
          ) {
            const clonedSubcategory = cloneSubcategory(
              sagataveSubcategory,
              optionIdMap,
            );
            projectCategory.subcategories.push(clonedSubcategory);
            addedNodeIds.push(...collectSubcategoryNodeIds(clonedSubcategory));
          }
          continue;
        }

        const clonedSubcategory = cloneSubcategory(
          {
            ...sagataveSubcategory,
            items: selectedItems,
          },
          optionIdMap,
        );
        projectCategory.subcategories.push(clonedSubcategory);
        addedNodeIds.push(...collectSubcategoryNodeIds(clonedSubcategory));
        continue;
      }

      for (const [rowIndex, sagataveRow] of sagataveSubcategory.items.entries()) {
        if (
          isMissingRowSelected(
            sagataveRow,
            projectSubcategory.items,
            rowIndex,
            sagataveSubcategory.items.length,
            selectedSagataveRowIds,
          )
        ) {
          const clonedRow = cloneRowItem(sagataveRow, optionIdMap);
          projectSubcategory.items.push(clonedRow);
          addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
        }
      }
    }

    for (const [rowIndex, sagataveRow] of sagataveCategory.items.entries()) {
      if (
        isMissingRowSelected(
          sagataveRow,
          projectCategory.items,
          rowIndex,
          sagataveCategory.items.length,
          selectedSagataveRowIds,
        )
      ) {
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
