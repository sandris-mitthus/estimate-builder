import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import type {
  EstimateCategory,
  EstimateRowItem,
} from "@/app/lib/estimates/types";
import {
  cloneCategory,
  cloneRowItem,
  cloneSubcategory,
  remapMultiOptionLinks,
} from "@/app/lib/estimate-positions/clone-sagatave-for-project";
import {
  ensureDefaultEstimatePosition,
  saveEstimatePositionDocument,
} from "@/app/lib/estimate-positions/repository";
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
      sections.push(clonedCategory);
      addedNodeIds.push(...collectCategoryNodeIds(clonedCategory));
      continue;
    }

    for (const [subcategoryIndex, projectSubcategory] of projectCategory.subcategories.entries()) {
      const sagataveSubcategory = findSagataveSubcategoryForProject(
        sagataveCategory.subcategories,
        projectSubcategory,
        subcategoryIndex,
      );

      if (!sagataveSubcategory) {
        const clonedSubcategory = cloneSubcategory(projectSubcategory, optionIdMap);
        sagataveCategory.subcategories.push(clonedSubcategory);
        addedNodeIds.push(...collectSubcategoryNodeIds(clonedSubcategory));
        continue;
      }

      for (const [rowIndex, projectRow] of projectSubcategory.items.entries()) {
        if (
          !findSagataveRowForProjectRow(
            sagataveSubcategory.items,
            projectRow,
            rowIndex,
            projectSubcategory.items.length,
          )
        ) {
          const clonedRow = cloneRowItem(projectRow, optionIdMap);
          sagataveSubcategory.items.push(clonedRow);
          addedNodeIds.push(...collectRowItemNodeIds(clonedRow));
        }
      }
    }

    for (const [rowIndex, projectRow] of projectCategory.items.entries()) {
      if (
        !findSagataveRowForProjectRow(
          sagataveCategory.items,
          projectRow,
          rowIndex,
          projectCategory.items.length,
        )
      ) {
        const clonedRow = cloneRowItem(projectRow, optionIdMap);
        sagataveCategory.items.push(clonedRow);
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
