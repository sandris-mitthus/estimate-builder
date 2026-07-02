import { collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import { isCompositeLineItem } from "@/app/lib/estimates/composite-line-item";
import {
  isEstimateLineItem,
  isEstimateMultiPosition,
} from "@/app/lib/estimates/multi-position";
import {
  getLineItemModuleSizeAdjustments,
  getLineItemModuleSizeItemKeys,
  normalizeLineItemModuleSizeAttachment,
} from "@/app/lib/estimates/module-size-attachment";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateRowItem,
  LineItemModuleSizeAttachment,
} from "@/app/lib/estimates/types";
import {
  buildAdjustedModuleSizeSummarySections,
  findModuleSizeSummaryItem,
} from "@/app/lib/modules/apply-module-size-adjustments";
import { buildModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";
import { hasProjectDescriptionData } from "@/app/lib/modules/has-project-description-data";
import type { ProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";
import type { ModuleSizeSummaryItem } from "@/app/lib/modules/module-size-summary-types";
import type {
  BuildingModuleDetail,
  BuildingModuleSizeOption,
} from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import { roundQuantity } from "@/app/lib/positions/variable-quantity";
import type { ProjectSummary } from "@/app/lib/projects/types";

export function getEffectiveProjectDescription(
  project: ProjectSummary,
  buildingModule: BuildingModuleDetail | null,
): ProjectDescriptionFormState {
  if (project.buildingModuleId && buildingModule) {
    return buildingModule.projectDescription;
  }

  return project.projectDescription;
}

export function collectAttachmentModuleIds(
  categories: EstimateCategory[],
): string[] {
  const ids = new Set<string>();

  for (const item of collectEstimateLineItems(categories)) {
    const attachment = normalizeLineItemModuleSizeAttachment(
      item.moduleSizeAttachment,
    );
    if (attachment) {
      ids.add(attachment.moduleId);
    }
  }

  return [...ids];
}

export function buildProjectModuleSizeOptions(
  project: ProjectSummary,
  buildingModule: BuildingModuleDetail | null,
  moduleName: string,
  categories: EstimateCategory[],
): BuildingModuleSizeOption[] {
  const projectDescription = getEffectiveProjectDescription(
    project,
    buildingModule,
  );

  if (!hasProjectDescriptionData(projectDescription)) {
    return [];
  }

  const sections = buildModuleSizeSummarySections(projectDescription);
  const base = {
    name: moduleName,
    sections,
    projectDescription,
  };
  const options: BuildingModuleSizeOption[] = [];
  const primaryId = project.buildingModuleId ?? project.id;

  options.push({ id: primaryId, ...base });

  for (const moduleId of collectAttachmentModuleIds(categories)) {
    if (moduleId !== primaryId && !options.some((entry) => entry.id === moduleId)) {
      options.push({ id: moduleId, ...base });
    }
  }

  return options;
}

function buildAttachmentSummarySections(
  attachment: LineItemModuleSizeAttachment,
  projectDescription: ProjectDescriptionFormState,
) {
  const adjustments = getLineItemModuleSizeAdjustments(attachment);
  return Object.keys(adjustments).length > 0
    ? buildAdjustedModuleSizeSummarySections(projectDescription, adjustments)
    : buildModuleSizeSummarySections(projectDescription);
}

function resolveSummaryItemsFromAttachment(
  attachment: LineItemModuleSizeAttachment,
  projectDescription: ProjectDescriptionFormState,
): ModuleSizeSummaryItem[] {
  const sections = buildAttachmentSummarySections(attachment, projectDescription);
  return getLineItemModuleSizeItemKeys(attachment)
    .map((itemKey) => findModuleSizeSummaryItem(sections, itemKey))
    .filter((item): item is ModuleSizeSummaryItem => item != null);
}

function resolveSummaryItemFromAttachment(
  attachment: LineItemModuleSizeAttachment,
  projectDescription: ProjectDescriptionFormState,
) {
  return resolveSummaryItemsFromAttachment(attachment, projectDescription)[0] ?? null;
}

export function resolveQuantityFromModuleSizeAttachment(
  attachment: LineItemModuleSizeAttachment,
  projectDescription: ProjectDescriptionFormState,
): number | null {
  const items = resolveSummaryItemsFromAttachment(attachment, projectDescription);
  let total = 0;
  let hasValue = false;

  for (const item of items) {
    if (item.numericValue != null && Number.isFinite(item.numericValue)) {
      total += item.numericValue;
      hasValue = true;
    }
  }

  if (!hasValue) {
    return null;
  }

  return roundQuantity(total);
}

export function hasModuleSizeAttachment(item: EstimateLineItem): boolean {
  return (
    normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment) != null
  );
}

/** Kompozītās pozīcijas efektīvā mērvienība tabulā un patēriņa aprēķinam. */
export function resolveCompositeLineItemDisplayUnit(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): string | null {
  if (item.manualUnitEnabled && item.manualUnit?.trim()) {
    return item.manualUnit.trim();
  }

  if (item.variableQuantity) {
    const unit = item.unit.trim();
    return unit || null;
  }

  return resolveLineItemDisplayUnitFromModuleSize(item, moduleSizeOptions);
}

/** Saglabātā mērvienība salīdzināšanai (ar manuālo mērvienību, ja ieslēgta). */
export function resolveLineItemStoredDisplayUnit(item: EstimateLineItem): string {
  if (item.manualUnitEnabled === true && item.manualUnit?.trim()) {
    return item.manualUnit.trim();
  }

  return item.unit.trim();
}

/** Vienota mērvienība projekta un sagataves tabulās. */
export function resolveEstimateRowDisplayUnit(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
  catalogUnit?: string | null,
): string {
  if (isCompositeLineItem(item)) {
    return (
      resolveCompositeLineItemDisplayUnit(item, moduleSizeOptions) ??
      catalogUnit?.trim() ??
      item.unit.trim()
    );
  }

  if (item.manualUnitEnabled === true && item.manualUnit?.trim()) {
    return item.manualUnit.trim();
  }

  return catalogUnit?.trim() || item.unit.trim();
}

/** Mērvienība no piesaistītā moduļa lieluma pozīcijas (piem. "m²", "m"). */
export function resolveLineItemDisplayUnitFromModuleSize(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): string | null {
  const attachment = normalizeLineItemModuleSizeAttachment(
    item.moduleSizeAttachment,
  );
  if (!attachment || moduleSizeOptions.length === 0) {
    return null;
  }

  const moduleOption =
    moduleSizeOptions.find((entry) => entry.id === attachment.moduleId) ??
    moduleSizeOptions[0];

  const items = resolveSummaryItemsFromAttachment(
    attachment,
    moduleOption.projectDescription,
  );
  const units = [
    ...new Set(
      items
        .map((item) => item.unit)
        .filter((unit): unit is string => unit != null && unit.trim().length > 0),
    ),
  ];

  return units[0] ?? null;
}

export function resolveLineItemDisplayQuantityFromModuleSize(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): number | null {
  const attachment = normalizeLineItemModuleSizeAttachment(
    item.moduleSizeAttachment,
  );

  if (!attachment || moduleSizeOptions.length === 0) {
    return null;
  }

  const moduleOption =
    moduleSizeOptions.find((entry) => entry.id === attachment.moduleId) ??
    moduleSizeOptions[0];

  return resolveQuantityFromModuleSizeAttachment(
    attachment,
    moduleOption.projectDescription,
  );
}

export function syncLineItemQuantityFromModuleSize(
  item: EstimateLineItem,
  projectDescription: ProjectDescriptionFormState,
  _catalogPositions: PositionPriceSummary[],
): EstimateLineItem {
  const attachment = normalizeLineItemModuleSizeAttachment(
    item.moduleSizeAttachment,
  );

  if (!attachment) {
    return item;
  }

  const normalizedItem = { ...item, moduleSizeAttachment: attachment };
  const quantity = resolveQuantityFromModuleSizeAttachment(
    attachment,
    projectDescription,
  );
  const summaryItem = resolveSummaryItemFromAttachment(
    attachment,
    projectDescription,
  );
  const unit = summaryItem?.unit ?? null;

  if (quantity == null && summaryItem == null) {
    return normalizedItem;
  }

  return {
    ...normalizedItem,
    ...(quantity != null ? { quantity } : {}),
    ...(unit ? { unit } : {}),
  };
}

function syncRowItemQuantityFromModuleSize(
  row: EstimateRowItem,
  projectDescription: ProjectDescriptionFormState,
  catalogPositions: PositionPriceSummary[],
): EstimateRowItem {
  if (isEstimateLineItem(row)) {
    return syncLineItemQuantityFromModuleSize(
      row,
      projectDescription,
      catalogPositions,
    );
  }

  if (!isEstimateMultiPosition(row)) {
    return row;
  }

  return {
    ...row,
    options: row.options.map((option) => ({
      ...option,
      lineItem: syncLineItemQuantityFromModuleSize(
        option.lineItem,
        projectDescription,
        catalogPositions,
      ),
    })),
  };
}

export function syncCategoriesQuantitiesFromModuleSizes(
  categories: EstimateCategory[],
  projectDescription: ProjectDescriptionFormState,
  catalogPositions: PositionPriceSummary[],
): EstimateCategory[] {
  return categories.map((category) => ({
    ...category,
    items: category.items.map((row) =>
      syncRowItemQuantityFromModuleSize(
        row,
        projectDescription,
        catalogPositions,
      ),
    ),
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: subcategory.items.map((row) =>
        syncRowItemQuantityFromModuleSize(
          row,
          projectDescription,
          catalogPositions,
        ),
      ),
    })),
  }));
}
