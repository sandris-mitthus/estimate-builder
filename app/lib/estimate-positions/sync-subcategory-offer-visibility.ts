import type { EstimateCategory, EstimateSubcategory } from "@/app/lib/estimates/types";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function findSagataveCategory(
  sagataveSections: EstimateCategory[],
  projectCategory: EstimateCategory,
  categoryIndex: number,
): EstimateCategory | undefined {
  const byIndex = sagataveSections[categoryIndex];
  if (byIndex) return byIndex;

  const normalizedTitle = normalizeTitle(projectCategory.title);
  if (!normalizedTitle) return undefined;

  return sagataveSections.find(
    (section) => normalizeTitle(section.title) === normalizedTitle,
  );
}

function findSagataveSubcategory(
  sagataveSubcategories: EstimateSubcategory[],
  projectSubcategory: EstimateSubcategory,
  subcategoryIndex: number,
): EstimateSubcategory | undefined {
  const byIndex = sagataveSubcategories[subcategoryIndex];
  if (byIndex) return byIndex;

  const normalizedTitle = normalizeTitle(projectSubcategory.title);
  if (!normalizedTitle) return undefined;

  return sagataveSubcategories.find(
    (subcategory) => normalizeTitle(subcategory.title) === normalizedTitle,
  );
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
 * `hiddenPricesInOffer`) tiek ņemti no sagataves, nevis projekta kopijas.
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
