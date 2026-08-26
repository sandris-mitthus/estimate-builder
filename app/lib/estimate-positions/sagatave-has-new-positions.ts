import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import type {
  EstimateCategory,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";
import { isEstimateRowHidden } from "@/app/lib/estimates/hidden-estimate-rows";
import { getRowItemId } from "@/app/lib/estimates/multi-position";
import {
  cloneCategory,
  cloneRowItem,
  cloneSubcategory,
  remapMultiOptionLinks,
} from "@/app/lib/estimate-positions/clone-sagatave-for-project";
import {
  insertCategoryLevelItem,
  insertCategoryLevelSubcategory,
} from "@/app/lib/estimates/category-child-order";
import {
  buildSagataveMultiLabelCounts,
  collectOneToOnePairedProjectRowIds,
  findUnpairedProjectRowForSagataveRow,
  getMultiLabelOccurrenceAtIndex,
  normalizeRowTitle,
  rowItemLabel,
} from "@/app/lib/estimate-positions/sagatave-row-matching";
import type { EstimateMeta } from "@/app/lib/projects/types";

function normalizeTitle(title: string): string {
  return normalizeRowTitle(title);
}

function findProjectCategory(
  projectCategories: EstimateCategory[],
  sagataveCategory: EstimateCategory,
  categoryIndex: number,
): EstimateCategory | undefined {
  const normalizedTitle = normalizeTitle(sagataveCategory.title);
  if (normalizedTitle) {
    const byTitle = projectCategories.find(
      (category) => normalizeTitle(category.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return projectCategories[categoryIndex];
}

function findProjectSubcategory(
  projectSubcategories: EstimateSubcategory[],
  sagataveSubcategory: EstimateSubcategory,
  subcategoryIndex: number,
): EstimateSubcategory | undefined {
  const normalizedTitle = normalizeTitle(sagataveSubcategory.title);
  if (normalizedTitle) {
    const byTitle = projectSubcategories.find(
      (subcategory) => normalizeTitle(subcategory.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return projectSubcategories[subcategoryIndex];
}

function countExistingSagataveRowPredecessors(
  projectItems: EstimateRowItem[],
  sagataveItems: EstimateRowItem[],
  rowIndex: number,
): number {
  const usedProjectRowIds = new Set<string>();
  let count = 0;

  for (let index = 0; index < rowIndex; index++) {
    const match = findUnpairedProjectRowForSagataveRow(
      projectItems,
      sagataveItems[index],
      index,
      sagataveItems,
      usedProjectRowIds,
    );

    if (match) {
      usedProjectRowIds.add(getRowItemId(match));
      count++;
    }
  }

  return count;
}

function countExistingSagataveSubcategoryPredecessors(
  projectSubcategories: EstimateSubcategory[],
  sagataveSubcategories: EstimateSubcategory[],
  subcategoryIndex: number,
): number {
  let count = 0;

  for (let index = 0; index < subcategoryIndex; index++) {
    if (
      findProjectSubcategory(
        projectSubcategories,
        sagataveSubcategories[index],
        index,
      )
    ) {
      count++;
    }
  }

  return count;
}

function countExistingSagataveCategoryPredecessors(
  projectCategories: EstimateCategory[],
  sagataveSections: EstimateCategory[],
  categoryIndex: number,
): number {
  let count = 0;

  for (let index = 0; index < categoryIndex; index++) {
    if (findProjectCategory(projectCategories, sagataveSections[index], index)) {
      count++;
    }
  }

  return count;
}

function replaceProjectCategory(
  categories: EstimateCategory[],
  nextCategory: EstimateCategory,
): void {
  const categoryIndex = categories.findIndex(
    (category) => category.id === nextCategory.id,
  );

  if (categoryIndex >= 0) {
    categories[categoryIndex] = nextCategory;
  }
}

function sagataveRowsMissingInProject(
  sagataveItems: EstimateRowItem[],
  projectItems: EstimateRowItem[],
): boolean {
  const usedProjectRowIds = new Set<string>();

  for (let rowIndex = 0; rowIndex < sagataveItems.length; rowIndex++) {
    const match = findUnpairedProjectRowForSagataveRow(
      projectItems,
      sagataveItems[rowIndex],
      rowIndex,
      sagataveItems,
      usedProjectRowIds,
    );

    if (!match) {
      return true;
    }

    usedProjectRowIds.add(getRowItemId(match));
  }

  return false;
}

function isSagataveRowMissingInProject(
  sagataveItems: EstimateRowItem[],
  projectItems: EstimateRowItem[],
  rowIndex: number,
): boolean {
  const usedProjectRowIds = new Set<string>();

  for (let index = 0; index < sagataveItems.length; index++) {
    const sagataveRow = sagataveItems[index];
    const match = findUnpairedProjectRowForSagataveRow(
      projectItems,
      sagataveRow,
      index,
      sagataveItems,
      usedProjectRowIds,
    );

    if (index === rowIndex) {
      return !match;
    }

    if (match) {
      usedProjectRowIds.add(getRowItemId(match));
    }
  }

  return true;
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
  sagataveItems: EstimateRowItem[],
  usedProjectRowIds: ReadonlySet<string>,
  selectedSagataveRowIds?: ReadonlySet<string>,
): boolean {
  if (
    findUnpairedProjectRowForSagataveRow(
      projectItems,
      sagataveRow,
      rowIndex,
      sagataveItems,
      usedProjectRowIds,
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
        isSagataveRowMissingInProject(
          sagataveCategory.items,
          projectCategory.items,
          rowIndex,
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
          isSagataveRowMissingInProject(
            sagataveSubcategory.items,
            projectSubcategory.items,
            rowIndex,
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

function pruneExcessHiddenProjectRowItems(
  sagataveItems: EstimateRowItem[],
  projectItems: EstimateRowItem[],
): {
  items: EstimateRowItem[];
  removedIds: string[];
} {
  const pairedIds = collectOneToOnePairedProjectRowIds(
    sagataveItems,
    projectItems,
  );
  const sagataveMultiLabelCounts = buildSagataveMultiLabelCounts(sagataveItems);
  const removedIds: string[] = [];

  const items = projectItems.filter((row, rowIndex) => {
    const rowId = getRowItemId(row);

    if (!isEstimateRowHidden(row) || pairedIds.has(rowId)) {
      return true;
    }

    const multiOccurrence = getMultiLabelOccurrenceAtIndex(
      projectItems,
      rowIndex,
    );

    if (multiOccurrence) {
      const sagataveCount =
        sagataveMultiLabelCounts.get(multiOccurrence.label) ?? 0;

      // Sagatavē šī multi vairs nav — projekta rinda paliek (arī paslēpta).
      if (sagataveCount === 0) {
        return true;
      }

      if (multiOccurrence.occurrence >= sagataveCount) {
        removedIds.push(rowId);
        return false;
      }
    }

    return true;
  });

  return { items, removedIds };
}

/**
 * Noņem liekas paslēptās rindas, ko sagataves sinhronizācija pievienojusi kļūdaini
 * (piem. otru „95mm”, ja sagatavē ir tikai viena).
 */
export function pruneOrphanedHiddenSagataveSyncRows(
  projectCategories: EstimateCategory[],
  projectMeta: EstimateMeta,
  sagataveSections: EstimateCategory[],
): {
  categories: EstimateCategory[];
  meta: EstimateMeta;
  removedNodeIds: string[];
  changed: boolean;
} {
  const unacknowledgedIds = new Set(
    projectMeta.unacknowledgedSagataveStructureIds ?? [],
  );

  const categories = structuredClone(projectCategories);
  const removedNodeIds: string[] = [];

  for (const [categoryIndex, sagataveCategory] of sagataveSections.entries()) {
    const projectCategory = findProjectCategory(
      categories,
      sagataveCategory,
      categoryIndex,
    );

    if (!projectCategory) {
      continue;
    }

    const categoryIndexInList = categories.findIndex(
      (category) => category.id === projectCategory.id,
    );
    let currentCategory = projectCategory;

    for (const [subcategoryIndex, sagataveSubcategory] of sagataveCategory.subcategories.entries()) {
      const projectSubcategory = findProjectSubcategory(
        currentCategory.subcategories,
        sagataveSubcategory,
        subcategoryIndex,
      );

      if (!projectSubcategory) {
        continue;
      }

      const subcategoryIndexInCategory = currentCategory.subcategories.findIndex(
        (subcategory) => subcategory.id === projectSubcategory.id,
      );
      const pruned = pruneExcessHiddenProjectRowItems(
        sagataveSubcategory.items,
        projectSubcategory.items,
      );

      if (pruned.removedIds.length === 0) {
        continue;
      }

      removedNodeIds.push(...pruned.removedIds);
      for (const removedId of pruned.removedIds) {
        unacknowledgedIds.delete(removedId);
      }

      const subcategories = [...currentCategory.subcategories];
      subcategories[subcategoryIndexInCategory] = {
        ...projectSubcategory,
        items: pruned.items,
      };
      currentCategory = { ...currentCategory, subcategories };

      if (categoryIndexInList >= 0) {
        categories[categoryIndexInList] = currentCategory;
      }
    }

    const prunedCategoryItems = pruneExcessHiddenProjectRowItems(
      sagataveCategory.items,
      currentCategory.items,
    );

    if (prunedCategoryItems.removedIds.length > 0) {
      removedNodeIds.push(...prunedCategoryItems.removedIds);
      for (const removedId of prunedCategoryItems.removedIds) {
        unacknowledgedIds.delete(removedId);
      }

      currentCategory = {
        ...currentCategory,
        items: prunedCategoryItems.items,
      };

      if (categoryIndexInList >= 0) {
        categories[categoryIndexInList] = currentCategory;
      }
    }
  }

  const meta: EstimateMeta = { ...projectMeta };
  if (unacknowledgedIds.size > 0) {
    meta.unacknowledgedSagataveStructureIds = Array.from(unacknowledgedIds);
  } else {
    delete meta.unacknowledgedSagataveStructureIds;
  }

  return {
    categories,
    meta,
    removedNodeIds,
    changed: removedNodeIds.length > 0,
  };
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
            sagataveSubcategory.items,
            new Set(),
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
          sagataveCategory.items,
          new Set(),
          selectedSagataveRowIds,
        ),
      );

      if (partialSubcategories.length === 0 && selectedCategoryItems.length === 0) {
        if (isStructureSelected(sagataveCategory.id, selectedSagataveRowIds)) {
          const clonedCategory = cloneCategory(sagataveCategory, optionIdMap);
          const insertIndex = countExistingSagataveCategoryPredecessors(
            categories,
            sagataveSections,
            categoryIndex,
          );
          categories.splice(insertIndex, 0, clonedCategory);
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
      const insertIndex = countExistingSagataveCategoryPredecessors(
        categories,
        sagataveSections,
        categoryIndex,
      );
      categories.splice(insertIndex, 0, clonedCategory);
      addedNodeIds.push(...collectCategoryNodeIds(clonedCategory));
      continue;
    }

    let currentCategory = projectCategory;

    for (const [subcategoryIndex, sagataveSubcategory] of sagataveCategory.subcategories.entries()) {
      const projectSubcategory = findProjectSubcategory(
        currentCategory.subcategories,
        sagataveSubcategory,
        subcategoryIndex,
      );

      if (!projectSubcategory) {
        const selectedItems = sagataveSubcategory.items.filter((row, rowIndex) =>
          isMissingRowSelected(
            row,
            [],
            rowIndex,
            sagataveSubcategory.items,
            new Set(),
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
            const subInsertIndex = countExistingSagataveSubcategoryPredecessors(
              currentCategory.subcategories,
              sagataveCategory.subcategories,
              subcategoryIndex,
            );
            currentCategory = insertCategoryLevelSubcategory(
              currentCategory,
              clonedSubcategory,
              subInsertIndex,
            );
            replaceProjectCategory(categories, currentCategory);
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
        const subInsertIndex = countExistingSagataveSubcategoryPredecessors(
          currentCategory.subcategories,
          sagataveCategory.subcategories,
          subcategoryIndex,
        );
        currentCategory = insertCategoryLevelSubcategory(
          currentCategory,
          clonedSubcategory,
          subInsertIndex,
        );
        replaceProjectCategory(categories, currentCategory);
        addedNodeIds.push(...collectSubcategoryNodeIds(clonedSubcategory));
        continue;
      }

      const subcategoryIndexInCategory = currentCategory.subcategories.findIndex(
        (subcategory) => subcategory.id === projectSubcategory.id,
      );
      let currentSubcategory = projectSubcategory;
      const usedProjectRowIds = new Set<string>();

      for (const [rowIndex, sagataveRow] of sagataveSubcategory.items.entries()) {
        const existingMatch = findUnpairedProjectRowForSagataveRow(
          currentSubcategory.items,
          sagataveRow,
          rowIndex,
          sagataveSubcategory.items,
          usedProjectRowIds,
        );

        if (existingMatch) {
          usedProjectRowIds.add(getRowItemId(existingMatch));
          continue;
        }

        if (
          selectedSagataveRowIds &&
          !selectedSagataveRowIds.has(sagataveRow.id)
        ) {
          continue;
        }

        const clonedRow = cloneRowItem(sagataveRow, optionIdMap);
        const insertIndex = countExistingSagataveRowPredecessors(
          currentSubcategory.items,
          sagataveSubcategory.items,
          rowIndex,
        );
        const items = [...currentSubcategory.items];
        items.splice(insertIndex, 0, clonedRow);
        currentSubcategory = { ...currentSubcategory, items };
        if (subcategoryIndexInCategory >= 0) {
          const subcategories = [...currentCategory.subcategories];
          subcategories[subcategoryIndexInCategory] = currentSubcategory;
          currentCategory = { ...currentCategory, subcategories };
          replaceProjectCategory(categories, currentCategory);
        }
        usedProjectRowIds.add(getRowItemId(clonedRow));
        addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
      }
    }

    const usedCategoryRowIds = new Set<string>();

    for (const [rowIndex, sagataveRow] of sagataveCategory.items.entries()) {
      const existingMatch = findUnpairedProjectRowForSagataveRow(
        currentCategory.items,
        sagataveRow,
        rowIndex,
        sagataveCategory.items,
        usedCategoryRowIds,
      );

      if (existingMatch) {
        usedCategoryRowIds.add(getRowItemId(existingMatch));
        continue;
      }

      if (
        selectedSagataveRowIds &&
        !selectedSagataveRowIds.has(sagataveRow.id)
      ) {
        continue;
      }

      const clonedRow = cloneRowItem(sagataveRow, optionIdMap);
      const insertIndex = countExistingSagataveRowPredecessors(
        currentCategory.items,
        sagataveCategory.items,
        rowIndex,
      );
      currentCategory = insertCategoryLevelItem(
        currentCategory,
        clonedRow,
        insertIndex,
      );
      replaceProjectCategory(categories, currentCategory);
      usedCategoryRowIds.add(getRowItemId(clonedRow));
      addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
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
