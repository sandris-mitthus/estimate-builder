import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import {
  isCompositeLineItem,
  deriveCompositeUnitPrice,
} from "@/app/lib/estimates/composite-line-item";
import { isEstimateMultiPosition } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPositionOption,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";
import {
  ensureDefaultEstimatePosition,
  saveEstimatePositionDocument,
} from "@/app/lib/estimate-positions/repository";
import {
  buildEstimatePositionSectionsStorage,
  parseEstimatePositionDocumentPayload,
} from "@/app/lib/estimate-positions/serialize-document";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { isProjectEstimateLocked } from "@/app/lib/projects/project-status";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

const PROJECT_SYNC_UPDATE_CONCURRENCY = 5;

export type LaborTimeNormLocation = {
  categoryIndex: number;
  subcategoryIndex: number | null;
  rowIndex: number;
  optionIndex: number | null;
};

export type LaborTimeNormPatch = LaborTimeNormLocation & {
  laborTimeNorm: number;
};

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function rowItemLabel(row: EstimateRowItem): string {
  return row.name;
}

function optionLabel(option: EstimateMultiPositionOption): string {
  return (
    option.lineItem.name.trim() ||
    option.lineItem.materials?.[0]?.name ||
    option.lineItem.mechanisms?.[0]?.name ||
    ""
  );
}

function findCategory(
  categories: EstimateCategory[],
  source: EstimateCategory,
  categoryIndex: number,
): EstimateCategory | undefined {
  const byIndex = categories[categoryIndex];
  if (byIndex) return byIndex;

  const normalizedTitle = normalizeTitle(source.title);
  if (!normalizedTitle) return undefined;

  return categories.find(
    (category) => normalizeTitle(category.title) === normalizedTitle,
  );
}

function findSubcategory(
  subcategories: EstimateSubcategory[],
  source: EstimateSubcategory,
  subcategoryIndex: number,
): EstimateSubcategory | undefined {
  const normalizedTitle = normalizeTitle(source.title);
  if (normalizedTitle) {
    const byTitle = subcategories.find(
      (subcategory) => normalizeTitle(subcategory.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return subcategories[subcategoryIndex];
}

function findRowItem(
  items: EstimateRowItem[],
  source: EstimateRowItem,
  rowIndex: number,
): EstimateRowItem | undefined {
  const byIndex = items[rowIndex];
  if (
    byIndex &&
    normalizeTitle(rowItemLabel(byIndex)) === normalizeTitle(rowItemLabel(source))
  ) {
    return byIndex;
  }

  const normalizedLabel = normalizeTitle(rowItemLabel(source));
  if (!normalizedLabel) return undefined;

  return items.find(
    (row) => normalizeTitle(rowItemLabel(row)) === normalizedLabel,
  );
}

function findMultiOption(
  options: EstimateMultiPositionOption[],
  source: EstimateMultiPositionOption,
  optionIndex: number,
): EstimateMultiPositionOption | undefined {
  const byIndex = options[optionIndex];
  if (
    byIndex &&
    normalizeTitle(optionLabel(byIndex)) === normalizeTitle(optionLabel(source))
  ) {
    return byIndex;
  }

  const normalizedLabel = normalizeTitle(optionLabel(source));
  if (!normalizedLabel) return undefined;

  return options.find(
    (option) => normalizeTitle(optionLabel(option)) === normalizedLabel,
  );
}

function normalizedLaborTimeNorm(value: number | undefined): number {
  return roundToTwoDecimals(Number.isFinite(value) ? (value ?? 0) : 0);
}

function collectCompositeLineItemPatches(
  projectItem: EstimateLineItem,
  targetItem: EstimateLineItem,
  location: LaborTimeNormLocation,
  patches: LaborTimeNormPatch[],
): void {
  if (!isCompositeLineItem(projectItem) || !isCompositeLineItem(targetItem)) {
    return;
  }

  const projectNorm = normalizedLaborTimeNorm(projectItem.laborTimeNorm);
  const targetNorm = normalizedLaborTimeNorm(targetItem.laborTimeNorm);

  if (projectNorm === targetNorm) {
    return;
  }

  patches.push({
    ...location,
    laborTimeNorm: projectNorm,
  });
}

function collectRowItemPatches(
  projectRow: EstimateRowItem,
  targetRow: EstimateRowItem,
  location: Omit<LaborTimeNormLocation, "optionIndex">,
  patches: LaborTimeNormPatch[],
): void {
  if (isEstimateMultiPosition(projectRow) && isEstimateMultiPosition(targetRow)) {
    projectRow.options.forEach((projectOption, optionIndex) => {
      const targetOption = findMultiOption(
        targetRow.options,
        projectOption,
        optionIndex,
      );
      if (!targetOption) {
        return;
      }

      collectCompositeLineItemPatches(
        projectOption.lineItem,
        targetOption.lineItem,
        { ...location, optionIndex },
        patches,
      );
    });
    return;
  }

  if (!isEstimateMultiPosition(projectRow) && !isEstimateMultiPosition(targetRow)) {
    collectCompositeLineItemPatches(
      projectRow,
      targetRow,
      { ...location, optionIndex: null },
      patches,
    );
  }
}

function collectItemListPatches(
  projectItems: EstimateRowItem[],
  targetItems: EstimateRowItem[],
  location: Pick<LaborTimeNormLocation, "categoryIndex" | "subcategoryIndex">,
  patches: LaborTimeNormPatch[],
): void {
  projectItems.forEach((projectRow, rowIndex) => {
    const targetRow = findRowItem(targetItems, projectRow, rowIndex);
    if (!targetRow) {
      return;
    }

    collectRowItemPatches(
      projectRow,
      targetRow,
      { ...location, rowIndex },
      patches,
    );
  });
}

/** Salīdzina projekta tāmi ar mērķa sadaļām un atgriež atšķirīgās laika normas. */
export function collectLaborTimeNormPatches(
  projectCategories: EstimateCategory[],
  targetCategories: EstimateCategory[],
): LaborTimeNormPatch[] {
  const patches: LaborTimeNormPatch[] = [];

  projectCategories.forEach((projectCategory, categoryIndex) => {
    const targetCategory = findCategory(
      targetCategories,
      projectCategory,
      categoryIndex,
    );
    if (!targetCategory) {
      return;
    }

    projectCategory.subcategories.forEach((projectSubcategory, subcategoryIndex) => {
      const targetSubcategory = findSubcategory(
        targetCategory.subcategories,
        projectSubcategory,
        subcategoryIndex,
      );
      if (!targetSubcategory) {
        return;
      }

      collectItemListPatches(
        projectSubcategory.items,
        targetSubcategory.items,
        { categoryIndex, subcategoryIndex },
        patches,
      );
    });

    collectItemListPatches(
      projectCategory.items,
      targetCategory.items,
      { categoryIndex, subcategoryIndex: null },
      patches,
    );
  });

  return patches;
}

function updateLineItemLaborTimeNorm(
  item: EstimateLineItem,
  laborTimeNorm: number,
  catalogPositions: Awaited<ReturnType<typeof listPositionPrices>>,
  defaultHourlyRate: number | null,
): EstimateLineItem {
  if (!isCompositeLineItem(item)) {
    return item;
  }

  const nextItem = {
    ...item,
    laborTimeNorm,
  };

  return {
    ...nextItem,
    unitPrice: deriveCompositeUnitPrice(
      nextItem,
      catalogPositions,
      defaultHourlyRate,
    ),
  };
}

function updateRowItemLaborTimeNorm(
  row: EstimateRowItem,
  patch: LaborTimeNormPatch,
  catalogPositions: Awaited<ReturnType<typeof listPositionPrices>>,
  defaultHourlyRate: number | null,
): EstimateRowItem {
  if (patch.optionIndex != null) {
    if (!isEstimateMultiPosition(row)) {
      return row;
    }

    return {
      ...row,
      options: row.options.map((option, optionIndex) =>
        optionIndex === patch.optionIndex
          ? {
              ...option,
              lineItem: updateLineItemLaborTimeNorm(
                option.lineItem,
                patch.laborTimeNorm,
                catalogPositions,
                defaultHourlyRate,
              ),
            }
          : option,
      ),
    };
  }

  if (isEstimateMultiPosition(row)) {
    return row;
  }

  return updateLineItemLaborTimeNorm(
    row,
    patch.laborTimeNorm,
    catalogPositions,
    defaultHourlyRate,
  );
}

function applyLaborTimeNormPatchesToCategories(
  categories: EstimateCategory[],
  patches: LaborTimeNormPatch[],
  catalogPositions: Awaited<ReturnType<typeof listPositionPrices>>,
  defaultHourlyRate: number | null,
): EstimateCategory[] {
  if (patches.length === 0) {
    return categories;
  }

  const patchMap = new Map(
    patches.map((patch) => [
      `${patch.categoryIndex}:${patch.subcategoryIndex ?? "c"}:${patch.rowIndex}:${patch.optionIndex ?? "r"}`,
      patch,
    ]),
  );

  return categories.map((category, categoryIndex) => {
    const updateItems = (items: EstimateRowItem[], subcategoryIndex: number | null) =>
      items.map((row, rowIndex) => {
        const directPatch = patchMap.get(
          `${categoryIndex}:${subcategoryIndex ?? "c"}:${rowIndex}:r`,
        );
        if (directPatch) {
          return updateRowItemLaborTimeNorm(
            row,
            directPatch,
            catalogPositions,
            defaultHourlyRate,
          );
        }

        if (!isEstimateMultiPosition(row)) {
          return row;
        }

        return {
          ...row,
          options: row.options.map((option, optionIndex) => {
            const optionPatch = patchMap.get(
              `${categoryIndex}:${subcategoryIndex ?? "c"}:${rowIndex}:${optionIndex}`,
            );
            if (!optionPatch) {
              return option;
            }

            return {
              ...option,
              lineItem: updateLineItemLaborTimeNorm(
                option.lineItem,
                optionPatch.laborTimeNorm,
                catalogPositions,
                defaultHourlyRate,
              ),
            };
          }),
        };
      });

    return {
      ...category,
      subcategories: category.subcategories.map((subcategory, subcategoryIndex) => ({
        ...subcategory,
        items: updateItems(subcategory.items, subcategoryIndex),
      })),
      items: updateItems(category.items, null),
    };
  });
}

/** Projekta saglabāšana — atjaunina sagatavi un citus neapstiprinātos projektus. */
export async function propagateLaborTimeNormsFromProject(
  sourceProjectId: string,
  projectCategories: EstimateCategory[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: true };
  }

  const sagatave = await ensureDefaultEstimatePosition();

  const patches = collectLaborTimeNormPatches(
    projectCategories,
    sagatave.sections,
  );

  if (patches.length === 0) {
    return { ok: true };
  }

  const [catalogPositions, companySettings] = await Promise.all([
    listPositionPrices(),
    getCompanySettings(),
  ]);
  const defaultHourlyRate = companySettings.defaultHourlyRate;

  const nextSagataveSections = applyLaborTimeNormPatchesToCategories(
    sagatave.sections,
    patches,
    catalogPositions,
    defaultHourlyRate,
  );

  const sagataveResult = await saveEstimatePositionDocument({
    id: sagatave.id,
    title: sagatave.title,
    sections: nextSagataveSections,
    multiOptionLinks: sagatave.multiOptionLinks,
  });

  if (!sagataveResult.ok) {
    return sagataveResult;
  }

  const supabase = createAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const { data: projectRows, error: projectsError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("company_id", companyId)
    .neq("id", sourceProjectId);

  if (projectsError) {
    return { ok: false, error: "Neizdevās ielādēt projektus laika normu sinhronizācijai." };
  }

  const eligibleProjectIds = (projectRows ?? [])
    .filter((row) => !isProjectEstimateLocked(row.status))
    .map((row) => row.id as string);

  if (eligibleProjectIds.length === 0) {
    return { ok: true };
  }

  const { data: estimateRows, error: estimatesError } = await supabase
    .from("estimates")
    .select("project_id, title, meta, categories")
    .eq("company_id", companyId)
    .in("project_id", eligibleProjectIds);

  if (estimatesError) {
    return { ok: false, error: "Neizdevās ielādēt projektu tāmes laika normu sinhronizācijai." };
  }

  const updates: Array<() => Promise<{ error: { message?: string } | null }>> = [];

  for (const row of estimateRows ?? []) {
    const parsed = parseEstimatePositionDocumentPayload(
      row.categories as EstimateCategory[],
    );

    const nextCategories = applyLaborTimeNormPatchesToCategories(
      parsed.sections,
      patches,
      catalogPositions,
      defaultHourlyRate,
    );

    const currentSnapshot = JSON.stringify(parsed.sections);
    const nextSnapshot = JSON.stringify(nextCategories);
    if (nextSnapshot === currentSnapshot) {
      continue;
    }

    const categories = buildEstimatePositionSectionsStorage(
      nextCategories,
      parsed.multiOptionLinks,
    );

    updates.push(async () => {
      const { error } = await supabase
        .from("estimates")
        .update({ categories })
        .eq("project_id", row.project_id as string)
        .eq("company_id", companyId);

      return { error };
    });
  }

  for (let index = 0; index < updates.length; index += PROJECT_SYNC_UPDATE_CONCURRENCY) {
    const batch = updates.slice(index, index + PROJECT_SYNC_UPDATE_CONCURRENCY);
    const results = await Promise.all(batch.map((update) => update()));
    if (results.some((result) => result.error)) {
      return { ok: false, error: "Neizdevās sinhronizēt laika normu citos projektos." };
    }
  }

  return { ok: true };
}
