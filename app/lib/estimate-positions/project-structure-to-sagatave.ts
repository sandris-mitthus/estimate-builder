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
  insertCategoryLevelItem,
  insertCategoryLevelSubcategory,
} from "@/app/lib/estimates/category-child-order";
import {
  collectCategoryNodeIds,
  collectRowItemNodeIds,
  collectSubcategoryNodeIds,
} from "@/app/lib/estimate-positions/sagatave-has-new-positions";
import {
  findSagataveCategoryForProject,
  findSagataveRowForProjectRow,
  findSagataveSubcategoryForProject,
} from "@/app/lib/estimate-positions/sagatave-row-matching";
import {
  ensureDefaultEstimatePosition,
  saveEstimatePositionDocument,
} from "@/app/lib/estimate-positions/repository";

function multiOptionLinkKey(optionIds: string[]): string {
  return [...optionIds].sort().join("\0");
}

function mergeProjectMultiOptionLinksIntoSagatave(
  sagataveLinks: MultiOptionLinkGroup[],
  projectLinks: MultiOptionLinkGroup[],
  optionIdMap: Map<string, string>,
): MultiOptionLinkGroup[] {
  const existingKeys = new Set(
    sagataveLinks.map((group) => multiOptionLinkKey(group.optionIds)),
  );
  const appended = remapMultiOptionLinks(
    projectLinks.filter((group) =>
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

  return [...sagataveLinks, ...appended];
}

function projectRowsMissingInSagatave(
  projectItems: EstimateRowItem[],
  sagataveItems: EstimateRowItem[],
): boolean {
  return projectItems.some(
    (row, rowIndex) =>
      !findSagataveRowForProjectRow(
        sagataveItems,
        row,
        rowIndex,
        projectItems.length,
        projectItems,
      ),
  );
}

/**
 * `true`, ja projekta tāmē ir kategorija, subkategorija vai rinda, kuras nav sagatavē.
 */
export function projectHasNewStructureForSagatave(
  projectCategories: EstimateCategory[],
  sagataveSections: EstimateCategory[],
): boolean {
  for (const [categoryIndex, projectCategory] of projectCategories.entries()) {
    const sagataveCategory = findSagataveCategoryForProject(
      sagataveSections,
      projectCategory,
      categoryIndex,
    );

    if (!sagataveCategory) {
      return true;
    }

    for (const [subcategoryIndex, projectSubcategory] of projectCategory.subcategories.entries()) {
      const sagataveSubcategory = findSagataveSubcategoryForProject(
        sagataveCategory.subcategories,
        projectSubcategory,
        subcategoryIndex,
      );

      if (!sagataveSubcategory) {
        return true;
      }

      if (
        projectRowsMissingInSagatave(
          projectSubcategory.items,
          sagataveSubcategory.items,
        )
      ) {
        return true;
      }
    }

    if (
      projectRowsMissingInSagatave(
        projectCategory.items,
        sagataveCategory.items,
      )
    ) {
      return true;
    }
  }

  return false;
}

function countExistingProjectRowPredecessors(
  sagataveItems: EstimateRowItem[],
  projectItems: EstimateRowItem[],
  rowIndex: number,
): number {
  let count = 0;

  for (let index = 0; index < rowIndex; index++) {
    if (
      findSagataveRowForProjectRow(
        sagataveItems,
        projectItems[index],
        index,
        projectItems.length,
        projectItems,
      )
    ) {
      count++;
    }
  }

  return count;
}

function countExistingProjectSubcategoryPredecessors(
  sagataveSubcategories: EstimateSubcategory[],
  projectSubcategories: EstimateSubcategory[],
  subcategoryIndex: number,
): number {
  let count = 0;

  for (let index = 0; index < subcategoryIndex; index++) {
    if (
      findSagataveSubcategoryForProject(
        sagataveSubcategories,
        projectSubcategories[index],
        index,
      )
    ) {
      count++;
    }
  }

  return count;
}

function countExistingProjectCategoryPredecessors(
  sagataveSections: EstimateCategory[],
  projectCategories: EstimateCategory[],
  categoryIndex: number,
): number {
  let count = 0;

  for (let index = 0; index < categoryIndex; index++) {
    if (
      findSagataveCategoryForProject(
        sagataveSections,
        projectCategories[index],
        index,
      )
    ) {
      count++;
    }
  }

  return count;
}

function replaceSagataveCategory(
  sections: EstimateCategory[],
  nextCategory: EstimateCategory,
): void {
  const categoryIndex = sections.findIndex(
    (category) => category.id === nextCategory.id,
  );

  if (categoryIndex >= 0) {
    sections[categoryIndex] = nextCategory;
  }
}

/**
 * Pievieno sagatavē tikai to projekta struktūru, kuras vēl nav sagatavē.
 */
export function mergeNewProjectStructureIntoSagatave(
  sagataveSections: EstimateCategory[],
  sagataveMultiOptionLinks: MultiOptionLinkGroup[],
  projectCategories: EstimateCategory[],
  projectMultiOptionLinks: MultiOptionLinkGroup[] = [],
): {
  sections: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
  addedNodeIds: string[];
} {
  const optionIdMap = new Map<string, string>();
  const sections = structuredClone(sagataveSections);
  const addedNodeIds: string[] = [];

  for (const [categoryIndex, projectCategory] of projectCategories.entries()) {
    const sagataveCategory = findSagataveCategoryForProject(
      sections,
      projectCategory,
      categoryIndex,
    );

    if (!sagataveCategory) {
      const clonedCategory = cloneCategory(projectCategory, optionIdMap);
      const insertIndex = countExistingProjectCategoryPredecessors(
        sections,
        projectCategories,
        categoryIndex,
      );
      sections.splice(insertIndex, 0, clonedCategory);
      addedNodeIds.push(...collectCategoryNodeIds(clonedCategory));
      continue;
    }

    let currentCategory = sagataveCategory;

    for (const [subcategoryIndex, projectSubcategory] of projectCategory.subcategories.entries()) {
      const sagataveSubcategory = findSagataveSubcategoryForProject(
        currentCategory.subcategories,
        projectSubcategory,
        subcategoryIndex,
      );

      if (!sagataveSubcategory) {
        const clonedSubcategory = cloneSubcategory(projectSubcategory, optionIdMap);
        const subInsertIndex = countExistingProjectSubcategoryPredecessors(
          currentCategory.subcategories,
          projectCategory.subcategories,
          subcategoryIndex,
        );
        currentCategory = insertCategoryLevelSubcategory(
          currentCategory,
          clonedSubcategory,
          subInsertIndex,
        );
        replaceSagataveCategory(sections, currentCategory);
        addedNodeIds.push(...collectSubcategoryNodeIds(clonedSubcategory));
        continue;
      }

      const subcategoryIndexInCategory = currentCategory.subcategories.findIndex(
        (subcategory) => subcategory.id === sagataveSubcategory.id,
      );
      let currentSubcategory = sagataveSubcategory;

      for (const [rowIndex, projectRow] of projectSubcategory.items.entries()) {
        if (
          !findSagataveRowForProjectRow(
            currentSubcategory.items,
            projectRow,
            rowIndex,
            projectSubcategory.items.length,
            projectSubcategory.items,
          )
        ) {
          const clonedRow = cloneRowItem(projectRow, optionIdMap);
          const insertIndex = countExistingProjectRowPredecessors(
            currentSubcategory.items,
            projectSubcategory.items,
            rowIndex,
          );
          const items = [...currentSubcategory.items];
          items.splice(insertIndex, 0, clonedRow);
          currentSubcategory = { ...currentSubcategory, items };
          if (subcategoryIndexInCategory >= 0) {
            const subcategories = [...currentCategory.subcategories];
            subcategories[subcategoryIndexInCategory] = currentSubcategory;
            currentCategory = { ...currentCategory, subcategories };
            replaceSagataveCategory(sections, currentCategory);
          }
          addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
        }
      }
    }

    for (const [rowIndex, projectRow] of projectCategory.items.entries()) {
      if (
        !findSagataveRowForProjectRow(
          currentCategory.items,
          projectRow,
          rowIndex,
          projectCategory.items.length,
          projectCategory.items,
        )
      ) {
        const clonedRow = cloneRowItem(projectRow, optionIdMap);
        const insertIndex = countExistingProjectRowPredecessors(
          currentCategory.items,
          projectCategory.items,
          rowIndex,
        );
        currentCategory = insertCategoryLevelItem(
          currentCategory,
          clonedRow,
          insertIndex,
        );
        replaceSagataveCategory(sections, currentCategory);
        addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
      }
    }
  }

  return {
    sections,
    multiOptionLinks: mergeProjectMultiOptionLinksIntoSagatave(
      sagataveMultiOptionLinks,
      projectMultiOptionLinks,
      optionIdMap,
    ),
    addedNodeIds,
  };
}

/** Projekta saglabāšana — jaunā struktūra tiek pievienota sagatavē. */
export async function propagateProjectStructureToSagatave(
  projectCategories: EstimateCategory[],
  projectMultiOptionLinks: MultiOptionLinkGroup[],
): Promise<
  | { ok: true; addedNodeIds: string[] }
  | { ok: false; error: string }
> {
  const sagatave = await ensureDefaultEstimatePosition();

  if (
    !projectHasNewStructureForSagatave(projectCategories, sagatave.sections)
  ) {
    return { ok: true, addedNodeIds: [] };
  }

  const merged = mergeNewProjectStructureIntoSagatave(
    sagatave.sections,
    sagatave.multiOptionLinks,
    projectCategories,
    projectMultiOptionLinks,
  );

  if (merged.addedNodeIds.length === 0) {
    return { ok: true, addedNodeIds: [] };
  }

  const result = await saveEstimatePositionDocument({
    id: sagatave.id,
    title: sagatave.title,
    sections: merged.sections,
    multiOptionLinks: merged.multiOptionLinks,
  });

  if (!result.ok) {
    return result;
  }

  return { ok: true, addedNodeIds: merged.addedNodeIds };
}
