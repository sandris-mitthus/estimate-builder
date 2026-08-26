import {
  isEstimateLineItem,
  isEstimateMultiPosition,
  resolveLineItemDisplayName,
} from "@/app/lib/estimates/multi-position";
import {
  getLineItemModuleSizeItemKeys,
  getLineItemModuleSizeItemMultipliers,
  getLineItemModuleSizeItemSigns,
} from "@/app/lib/estimates/module-size-attachment";
import { resolveLineItemStoredDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateRowItem,
  EstimateSubcategory,
  LineItemCatalogRef,
  LineItemModuleSizeAttachment,
} from "@/app/lib/estimates/types";
import { cloneMultiOption } from "@/app/lib/estimate-positions/clone-sagatave-for-project";
import {
  findSagataveRowForProjectRow,
  findUnpairedProjectOptionForSagataveOption,
  normalizeRowTitle,
} from "@/app/lib/estimate-positions/sagatave-row-matching";
import { normalizeAttentionBudget } from "@/app/lib/estimates/attention-budget";

export type SagataveChangeField =
  | "name"
  | "unit"
  | "note"
  | "laborTimeNorm"
  | "variableQuantity"
  | "manualUnit"
  | "moduleSizeAttachment"
  | "customHourlyRate"
  | "hiddenPriceInOffer"
  | "showOnlyTotalPrice"
  | "requiresAttention"
  | "attentionBudget"
  | "materials"
  | "mechanisms"
  | "multiName"
  | "multiNote"
  | "multiRequiresAttention"
  | "multiAttentionBudget"
  | "multiOptionAdd"
  | "hiddenInOffer"
  | "hiddenPricesInOffer";

export type SagataveChangePath = {
  categoryIndex: number;
  subcategoryIndex?: number;
  rowIndex?: number;
  optionIndex?: number;
};

export type SagatavePositionChange = {
  changeId: string;
  path: SagataveChangePath;
  field: SagataveChangeField;
  categoryTitle: string;
  subcategoryTitle?: string;
  positionName: string;
  fromValue: string | number | boolean | null;
  toValue: string | number | boolean | null;
};

function normalizeTitle(title: string): string {
  return normalizeRowTitle(title);
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
  const normalizedTitle = normalizeTitle(projectSubcategory.title);
  if (normalizedTitle) {
    const byTitle = sagataveSubcategories.find(
      (subcategory) => normalizeTitle(subcategory.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return sagataveSubcategories[subcategoryIndex];
}

export function buildSagataveChangeId(
  path: SagataveChangePath,
  field: SagataveChangeField,
): string {
  const parts = [`c${path.categoryIndex}`];
  if (path.subcategoryIndex !== undefined) {
    parts.push(`s${path.subcategoryIndex}`);
  }
  if (path.rowIndex !== undefined) {
    parts.push(`r${path.rowIndex}`);
  }
  if (path.optionIndex !== undefined) {
    parts.push(`o${path.optionIndex}`);
  }
  return `${parts.join(":")}:${field}`;
}

function normalizeOptionalText(value: string | undefined): string {
  return (value ?? "").trim();
}

function attentionBudgetValue(
  item: { attentionBudget?: number },
): number | null {
  return normalizeAttentionBudget(item.attentionBudget) ?? null;
}

function normalizeLaborTimeNorm(value: number | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function normalizeCatalogRefs(
  refs: LineItemCatalogRef[] | undefined,
): LineItemCatalogRef[] {
  return (refs ?? []).map((ref) => ({
    positionPriceId: ref.positionPriceId,
    name: ref.name.trim(),
    unit: ref.unit.trim(),
    consumption: ref.consumption ?? undefined,
    consumptionVolumeAttachment: ref.consumptionVolumeAttachment,
    manualConsumption: ref.manualConsumption === true ? true : undefined,
    fixedQuantity: ref.fixedQuantity === true ? true : undefined,
  }));
}

function catalogRefsEqual(
  left: LineItemCatalogRef[] | undefined,
  right: LineItemCatalogRef[] | undefined,
): boolean {
  return (
    JSON.stringify(normalizeCatalogRefs(left)) ===
    JSON.stringify(normalizeCatalogRefs(right))
  );
}

function normalizeModuleSizeAdjustments(
  adjustments: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!adjustments) {
    return undefined;
  }

  const entries = Object.entries(adjustments).filter(
    ([, value]) => value.trim() !== "",
  );
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    entries.map(([key, value]) => [key, value.trim()]),
  );
}

function normalizeModuleSizeAttachment(
  attachment: LineItemModuleSizeAttachment | undefined,
): LineItemModuleSizeAttachment | null {
  if (!attachment) {
    return null;
  }

  const itemKeys = getLineItemModuleSizeItemKeys(attachment);
  const itemSigns = getLineItemModuleSizeItemSigns(attachment);
  const itemMultipliers = getLineItemModuleSizeItemMultipliers(attachment);

  return {
    moduleId: attachment.moduleId,
    itemKey: itemKeys[0] ?? attachment.itemKey,
    itemKeys,
    itemSigns: Object.keys(itemSigns).length > 0 ? itemSigns : undefined,
    itemMultipliers:
      Object.keys(itemMultipliers).length > 0 ? itemMultipliers : undefined,
    adjustments: normalizeModuleSizeAdjustments(attachment.adjustments),
  };
}

function moduleSizeAttachmentSemantics(
  attachment: LineItemModuleSizeAttachment | undefined,
): string {
  const normalized = normalizeModuleSizeAttachment(attachment);
  if (!normalized) {
    return "";
  }

  // moduleId sagatavē ir tikai piemērs — salīdzinām piesaistes atslēgas un korekcijas.
  const { moduleId: _moduleId, ...semantics } = normalized;
  return JSON.stringify(semantics);
}

function moduleSizeAttachmentsEqual(
  left: LineItemModuleSizeAttachment | undefined,
  right: LineItemModuleSizeAttachment | undefined,
): boolean {
  return (
    moduleSizeAttachmentSemantics(left) === moduleSizeAttachmentSemantics(right)
  );
}

function customHourlyRateSnapshot(item: EstimateLineItem): {
  enabled: boolean;
  rate: number | null;
} {
  return {
    enabled: item.customHourlyRateEnabled === true,
    rate:
      item.customHourlyRateEnabled === true
        ? normalizeLaborTimeNorm(item.customHourlyRate)
        : null,
  };
}

function pushChange(
  changes: SagatavePositionChange[],
  context: {
    path: SagataveChangePath;
    field: SagataveChangeField;
    categoryTitle: string;
    subcategoryTitle?: string;
    positionName: string;
    fromValue: string | number | boolean | null;
    toValue: string | number | boolean | null;
  },
) {
  if (context.fromValue === context.toValue) {
    return;
  }

  changes.push({
    changeId: buildSagataveChangeId(context.path, context.field),
    path: context.path,
    field: context.field,
    categoryTitle: context.categoryTitle,
    subcategoryTitle: context.subcategoryTitle,
    positionName: context.positionName,
    fromValue: context.fromValue,
    toValue: context.toValue,
  });
}

function collectLineItemChanges(
  changes: SagatavePositionChange[],
  projectItem: EstimateLineItem,
  sagataveItem: EstimateLineItem,
  context: {
    path: SagataveChangePath;
    categoryTitle: string;
    subcategoryTitle?: string;
    positionName: string;
  },
) {
  pushChange(changes, {
    ...context,
    field: "name",
    fromValue: normalizeOptionalText(projectItem.name),
    toValue: normalizeOptionalText(sagataveItem.name),
  });

  pushChange(changes, {
    ...context,
    field: "unit",
    fromValue: resolveLineItemStoredDisplayUnit(projectItem),
    toValue: resolveLineItemStoredDisplayUnit(sagataveItem),
  });

  pushChange(changes, {
    ...context,
    field: "note",
    fromValue: normalizeOptionalText(projectItem.note),
    toValue: normalizeOptionalText(sagataveItem.note),
  });

  pushChange(changes, {
    ...context,
    field: "laborTimeNorm",
    fromValue: normalizeLaborTimeNorm(projectItem.laborTimeNorm),
    toValue: normalizeLaborTimeNorm(sagataveItem.laborTimeNorm),
  });

  pushChange(changes, {
    ...context,
    field: "variableQuantity",
    fromValue: projectItem.variableQuantity === true,
    toValue: sagataveItem.variableQuantity === true,
  });

  pushChange(changes, {
    ...context,
    field: "moduleSizeAttachment",
    fromValue: moduleSizeAttachmentsEqual(
      projectItem.moduleSizeAttachment,
      sagataveItem.moduleSizeAttachment,
    )
      ? null
      : JSON.stringify(normalizeModuleSizeAttachment(projectItem.moduleSizeAttachment)),
    toValue: moduleSizeAttachmentsEqual(
      projectItem.moduleSizeAttachment,
      sagataveItem.moduleSizeAttachment,
    )
      ? null
      : JSON.stringify(normalizeModuleSizeAttachment(sagataveItem.moduleSizeAttachment)),
  });

  const projectRate = customHourlyRateSnapshot(projectItem);
  const sagataveRate = customHourlyRateSnapshot(sagataveItem);
  pushChange(changes, {
    ...context,
    field: "customHourlyRate",
    fromValue: projectRate.enabled ? projectRate.rate ?? true : false,
    toValue: sagataveRate.enabled ? sagataveRate.rate ?? true : false,
  });

  pushChange(changes, {
    ...context,
    field: "hiddenPriceInOffer",
    fromValue: projectItem.hiddenPriceInOffer === true,
    toValue: sagataveItem.hiddenPriceInOffer === true,
  });

  pushChange(changes, {
    ...context,
    field: "showOnlyTotalPrice",
    fromValue: projectItem.showOnlyTotalPrice === true,
    toValue: sagataveItem.showOnlyTotalPrice === true,
  });

  pushChange(changes, {
    ...context,
    field: "requiresAttention",
    fromValue: projectItem.requiresAttention === true,
    toValue: sagataveItem.requiresAttention === true,
  });

  pushChange(changes, {
    ...context,
    field: "attentionBudget",
    fromValue: attentionBudgetValue(projectItem),
    toValue: attentionBudgetValue(sagataveItem),
  });

  if (!catalogRefsEqual(projectItem.materials, sagataveItem.materials)) {
    changes.push({
      changeId: buildSagataveChangeId(context.path, "materials"),
      path: context.path,
      field: "materials",
      categoryTitle: context.categoryTitle,
      subcategoryTitle: context.subcategoryTitle,
      positionName: context.positionName,
      fromValue: "current",
      toValue: "template",
    });
  }

  if (!catalogRefsEqual(projectItem.mechanisms, sagataveItem.mechanisms)) {
    changes.push({
      changeId: buildSagataveChangeId(context.path, "mechanisms"),
      path: context.path,
      field: "mechanisms",
      categoryTitle: context.categoryTitle,
      subcategoryTitle: context.subcategoryTitle,
      positionName: context.positionName,
      fromValue: "current",
      toValue: "template",
    });
  }
}

function collectRowChanges(
  changes: SagatavePositionChange[],
  projectRow: EstimateRowItem,
  sagataveRow: EstimateRowItem,
  context: {
    path: SagataveChangePath;
    categoryTitle: string;
    subcategoryTitle?: string;
  },
) {
  if (isEstimateMultiPosition(projectRow) && isEstimateMultiPosition(sagataveRow)) {
    const projectMulti = projectRow as EstimateMultiPosition;
    const sagataveMulti = sagataveRow as EstimateMultiPosition;

    pushChange(changes, {
      ...context,
      positionName: projectMulti.name,
      field: "multiName",
      fromValue: normalizeOptionalText(projectMulti.name),
      toValue: normalizeOptionalText(sagataveMulti.name),
    });

    pushChange(changes, {
      ...context,
      positionName: projectMulti.name,
      field: "multiNote",
      fromValue: normalizeOptionalText(projectMulti.note),
      toValue: normalizeOptionalText(sagataveMulti.note),
    });

    pushChange(changes, {
      ...context,
      positionName: projectMulti.name,
      field: "multiRequiresAttention",
      fromValue: projectMulti.requiresAttention === true,
      toValue: sagataveMulti.requiresAttention === true,
    });

    pushChange(changes, {
      ...context,
      positionName: projectMulti.name,
      field: "multiAttentionBudget",
      fromValue: attentionBudgetValue(projectMulti),
      toValue: attentionBudgetValue(sagataveMulti),
    });

    const usedProjectOptionIds = new Set<string>();

    for (const [optionIndex, sagataveOption] of sagataveMulti.options.entries()) {
      const projectOption = findUnpairedProjectOptionForSagataveOption(
        projectMulti.options,
        sagataveOption,
        optionIndex,
        sagataveMulti.options,
        usedProjectOptionIds,
      );

      if (!projectOption) {
        const optionLabel = resolveLineItemDisplayName(sagataveOption.lineItem);
        pushChange(changes, {
          ...context,
          path: { ...context.path, optionIndex },
          positionName: `${projectMulti.name} — ${optionLabel}`,
          field: "multiOptionAdd",
          fromValue: null,
          toValue: optionLabel,
        });
        continue;
      }

      usedProjectOptionIds.add(projectOption.id);

      collectLineItemChanges(
        changes,
        projectOption.lineItem,
        sagataveOption.lineItem,
        {
          ...context,
          path: { ...context.path, optionIndex },
          positionName: `${projectMulti.name} — ${resolveLineItemDisplayName(projectOption.lineItem)}`,
        },
      );
    }

    return;
  }

  if (!isEstimateLineItem(projectRow) || !isEstimateLineItem(sagataveRow)) {
    return;
  }

  collectLineItemChanges(changes, projectRow, sagataveRow, {
    ...context,
    positionName: projectRow.name,
  });
}

function collectSubcategoryChanges(
  changes: SagatavePositionChange[],
  projectSubcategory: EstimateSubcategory,
  sagataveSubcategory: EstimateSubcategory | undefined,
  context: {
    categoryIndex: number;
    subcategoryIndex: number;
    categoryTitle: string;
  },
) {
  if (!sagataveSubcategory) {
    return;
  }

  const path: SagataveChangePath = {
    categoryIndex: context.categoryIndex,
    subcategoryIndex: context.subcategoryIndex,
  };

  pushChange(changes, {
    path,
    field: "hiddenInOffer",
    categoryTitle: context.categoryTitle,
    subcategoryTitle: projectSubcategory.title,
    positionName: projectSubcategory.title,
    fromValue: projectSubcategory.hiddenInOffer === true,
    toValue: sagataveSubcategory.hiddenInOffer === true,
  });

  pushChange(changes, {
    path,
    field: "hiddenPricesInOffer",
    categoryTitle: context.categoryTitle,
    subcategoryTitle: projectSubcategory.title,
    positionName: projectSubcategory.title,
    fromValue: projectSubcategory.hiddenPricesInOffer === true,
    toValue: sagataveSubcategory.hiddenPricesInOffer === true,
  });

  for (const [rowIndex, projectRow] of projectSubcategory.items.entries()) {
    const sagataveRow = findSagataveRowForProjectRow(
      sagataveSubcategory.items,
      projectRow,
      rowIndex,
      projectSubcategory.items.length,
      projectSubcategory.items,
    );
    if (!sagataveRow) {
      continue;
    }

    collectRowChanges(changes, projectRow, sagataveRow, {
      path: {
        categoryIndex: context.categoryIndex,
        subcategoryIndex: context.subcategoryIndex,
        rowIndex,
      },
      categoryTitle: context.categoryTitle,
      subcategoryTitle: projectSubcategory.title,
    });
  }
}

/**
 * Atgriež sagataves un projekta atbilstošo rindu lauku atšķirības.
 */
export function listSagatavePositionChanges(
  sagataveSections: EstimateCategory[],
  projectCategories: EstimateCategory[],
): SagatavePositionChange[] {
  if (sagataveSections.length === 0 || projectCategories.length === 0) {
    return [];
  }

  const changes: SagatavePositionChange[] = [];

  for (const [categoryIndex, projectCategory] of projectCategories.entries()) {
    const sagataveCategory = findSagataveCategory(
      sagataveSections,
      projectCategory,
      categoryIndex,
    );
    if (!sagataveCategory) {
      continue;
    }

    for (const [subcategoryIndex, projectSubcategory] of projectCategory.subcategories.entries()) {
      collectSubcategoryChanges(changes, projectSubcategory, findSagataveSubcategory(
        sagataveCategory.subcategories,
        projectSubcategory,
        subcategoryIndex,
      ), {
        categoryIndex,
        subcategoryIndex,
        categoryTitle: projectCategory.title,
      });
    }

    for (const [rowIndex, projectRow] of projectCategory.items.entries()) {
      const sagataveRow = findSagataveRowForProjectRow(
        sagataveCategory.items,
        projectRow,
        rowIndex,
        projectCategory.items.length,
        projectCategory.items,
      );
      if (!sagataveRow) {
        continue;
      }

      collectRowChanges(changes, projectRow, sagataveRow, {
        path: { categoryIndex, rowIndex },
        categoryTitle: projectCategory.title,
      });
    }
  }

  return changes;
}

export function sagataveHasPositionChangesForProject(
  sagataveSections: EstimateCategory[],
  projectCategories: EstimateCategory[],
): boolean {
  return listSagatavePositionChanges(sagataveSections, projectCategories).length > 0;
}

function applyUnitFromSagatave(
  item: EstimateLineItem,
  sagataveItem: EstimateLineItem,
): EstimateLineItem {
  if (sagataveItem.manualUnitEnabled === true) {
    const unit =
      sagataveItem.manualUnit?.trim() || sagataveItem.unit.trim();
    return {
      ...item,
      manualUnitEnabled: true,
      manualUnit: unit,
      unit,
    };
  }

  return {
    ...item,
    manualUnitEnabled: undefined,
    manualUnit: undefined,
    unit: sagataveItem.unit,
  };
}

function applyManualUnit(
  item: EstimateLineItem,
  sagataveItem: EstimateLineItem,
): EstimateLineItem {
  return applyUnitFromSagatave(item, sagataveItem);
}

function applyCustomHourlyRate(
  item: EstimateLineItem,
  sagataveItem: EstimateLineItem,
): EstimateLineItem {
  if (sagataveItem.customHourlyRateEnabled === true) {
    return {
      ...item,
      customHourlyRateEnabled: true,
      customHourlyRate: sagataveItem.customHourlyRate,
    };
  }

  return {
    ...item,
    customHourlyRateEnabled: undefined,
    customHourlyRate: undefined,
  };
}

function applyLineItemField(
  item: EstimateLineItem,
  sagataveItem: EstimateLineItem,
  field: SagataveChangeField,
): EstimateLineItem {
  switch (field) {
    case "name":
      return { ...item, name: sagataveItem.name };
    case "unit":
      return applyUnitFromSagatave(item, sagataveItem);
    case "note":
      return {
        ...item,
        note: normalizeOptionalText(sagataveItem.note) || undefined,
      };
    case "laborTimeNorm":
      return {
        ...item,
        laborTimeNorm: sagataveItem.laborTimeNorm,
      };
    case "variableQuantity":
      return {
        ...item,
        variableQuantity: sagataveItem.variableQuantity === true ? true : undefined,
        ...(sagataveItem.variableQuantity === true && item.variableQuantity !== true
          ? { quantity: 0 }
          : {}),
      };
    case "manualUnit":
      return applyManualUnit(item, sagataveItem);
    case "moduleSizeAttachment":
      return {
        ...item,
        moduleSizeAttachment: sagataveItem.moduleSizeAttachment
          ? normalizeModuleSizeAttachment(sagataveItem.moduleSizeAttachment) ??
            undefined
          : undefined,
      };
    case "customHourlyRate":
      return applyCustomHourlyRate(item, sagataveItem);
    case "hiddenPriceInOffer":
      return {
        ...item,
        hiddenPriceInOffer:
          sagataveItem.hiddenPriceInOffer === true ? true : undefined,
      };
    case "showOnlyTotalPrice":
      return {
        ...item,
        showOnlyTotalPrice:
          sagataveItem.showOnlyTotalPrice === true ? true : undefined,
      };
    case "requiresAttention":
      return {
        ...item,
        requiresAttention:
          sagataveItem.requiresAttention === true ? true : undefined,
        attentionBudget:
          sagataveItem.requiresAttention === true
            ? item.attentionBudget
            : undefined,
      };
    case "attentionBudget":
      return {
        ...item,
        attentionBudget: normalizeAttentionBudget(sagataveItem.attentionBudget),
      };
    case "materials":
      return {
        ...item,
        materials: normalizeCatalogRefs(sagataveItem.materials),
      };
    case "mechanisms":
      return {
        ...item,
        mechanisms: normalizeCatalogRefs(sagataveItem.mechanisms),
      };
    default:
      return item;
  }
}

function collectTouchedNodeIds(row: EstimateRowItem): string[] {
  if (isEstimateMultiPosition(row)) {
    return [
      row.id,
      ...row.options.flatMap((option) => [option.id, option.lineItem.id]),
    ];
  }

  return [row.id];
}

const LINE_ITEM_SYNC_FIELDS = [
  "name",
  "unit",
  "note",
  "laborTimeNorm",
  "variableQuantity",
  "moduleSizeAttachment",
  "customHourlyRate",
  "hiddenPriceInOffer",
  "showOnlyTotalPrice",
  "requiresAttention",
  "materials",
  "mechanisms",
] as const satisfies readonly SagataveChangeField[];

function syncLineItemFromSagatave(
  projectItem: EstimateLineItem,
  sagataveItem: EstimateLineItem,
): EstimateLineItem {
  return LINE_ITEM_SYNC_FIELDS.reduce(
    (item, field) => applyLineItemField(item, sagataveItem, field),
    projectItem,
  );
}

function rowOnlySyncKey(path: SagataveChangePath): string {
  const parts = [`c${path.categoryIndex}`];
  if (path.subcategoryIndex !== undefined) {
    parts.push(`s${path.subcategoryIndex}`);
  }
  if (path.rowIndex !== undefined) {
    parts.push(`r${path.rowIndex}`);
  }
  return parts.join(":");
}

function optionSyncKey(path: SagataveChangePath): string | null {
  if (path.rowIndex == null || path.optionIndex == null) {
    return null;
  }

  return `${rowOnlySyncKey(path)}:o${path.optionIndex}`;
}

function resolveRowContext(
  categories: EstimateCategory[],
  sagataveSections: EstimateCategory[],
  path: SagataveChangePath,
): {
  projectItems: EstimateRowItem[];
  sagataveItems: EstimateRowItem[];
  projectRow: EstimateRowItem;
  sagataveRow: EstimateRowItem;
} | null {
  const projectCategory = categories[path.categoryIndex];
  const sagataveCategory = projectCategory
    ? findSagataveCategory(sagataveSections, projectCategory, path.categoryIndex)
    : undefined;
  if (!projectCategory || !sagataveCategory || path.rowIndex == null) {
    return null;
  }

  const projectItems =
    path.subcategoryIndex != null
      ? projectCategory.subcategories[path.subcategoryIndex]?.items
      : projectCategory.items;
  const sagataveItems =
    path.subcategoryIndex != null
      ? sagataveCategory.subcategories[path.subcategoryIndex]?.items
      : sagataveCategory.items;

  if (!projectItems || !sagataveItems) {
    return null;
  }

  const projectRow = projectItems[path.rowIndex];
  const sagataveRow = findSagataveRowForProjectRow(
    sagataveItems,
    projectRow,
    path.rowIndex,
    projectItems.length,
    projectItems,
  );
  if (!projectRow || !sagataveRow) {
    return null;
  }

  return { projectItems, sagataveItems, projectRow, sagataveRow };
}

/**
 * Pielāgo atzīmētās sagataves izmaiņas projekta tāmei (tikai UI).
 */
export function applySelectedSagataveChangesToProject(
  projectCategories: EstimateCategory[],
  sagataveSections: EstimateCategory[],
  selectedChangeIds: ReadonlySet<string>,
): {
  categories: EstimateCategory[];
  appliedNodeIds: string[];
} {
  if (selectedChangeIds.size === 0) {
    return { categories: projectCategories, appliedNodeIds: [] };
  }

  const changes = listSagatavePositionChanges(
    sagataveSections,
    projectCategories,
  ).filter((change) => selectedChangeIds.has(change.changeId));

  if (changes.length === 0) {
    return { categories: projectCategories, appliedNodeIds: [] };
  }

  const categories = structuredClone(projectCategories);
  const appliedNodeIds: string[] = [];
  const rowKeysToSync = new Set<string>();
  const optionKeysToSync = new Set<string>();
  const rowKeysWithMultiName = new Set<string>();
  const rowKeysWithMultiNote = new Set<string>();
  const rowKeysWithMultiRequiresAttention = new Set<string>();
  const rowKeysWithMultiAttentionBudget = new Set<string>();
  const rowKeysWithLineAttentionBudget = new Set<string>();

  for (const change of changes) {
    if (
      change.path.subcategoryIndex != null &&
      change.path.rowIndex == null &&
      change.path.optionIndex == null
    ) {
      const projectCategory = categories[change.path.categoryIndex];
      const sagataveCategory = projectCategory
        ? findSagataveCategory(
            sagataveSections,
            projectCategory,
            change.path.categoryIndex,
          )
        : undefined;
      if (!projectCategory || !sagataveCategory) {
        continue;
      }

      const projectSubcategory =
        projectCategory.subcategories[change.path.subcategoryIndex];
      const sagataveSubcategory = findSagataveSubcategory(
        sagataveCategory.subcategories,
        projectSubcategory,
        change.path.subcategoryIndex,
      );
      if (!projectSubcategory || !sagataveSubcategory) {
        continue;
      }

      if (change.field === "hiddenInOffer") {
        projectSubcategory.hiddenInOffer =
          sagataveSubcategory.hiddenInOffer === true ? true : undefined;
      } else if (change.field === "hiddenPricesInOffer") {
        projectSubcategory.hiddenPricesInOffer =
          sagataveSubcategory.hiddenPricesInOffer === true ? true : undefined;
      }

      appliedNodeIds.push(projectSubcategory.id);
      continue;
    }

    if (change.path.rowIndex == null) {
      continue;
    }

    rowKeysToSync.add(rowOnlySyncKey(change.path));

    const optionKey = optionSyncKey(change.path);
    if (optionKey) {
      optionKeysToSync.add(optionKey);
    }

    if (change.field === "multiName") {
      rowKeysWithMultiName.add(rowOnlySyncKey(change.path));
    }

    if (change.field === "multiNote") {
      rowKeysWithMultiNote.add(rowOnlySyncKey(change.path));
    }

    if (change.field === "multiRequiresAttention") {
      rowKeysWithMultiRequiresAttention.add(rowOnlySyncKey(change.path));
    }

    if (change.field === "multiAttentionBudget") {
      rowKeysWithMultiAttentionBudget.add(rowOnlySyncKey(change.path));
    }

    if (change.field === "attentionBudget") {
      rowKeysWithLineAttentionBudget.add(rowOnlySyncKey(change.path));
    }
  }

  for (const rowKey of rowKeysToSync) {
    const samplePath = changes.find(
      (change) => rowOnlySyncKey(change.path) === rowKey,
    )?.path;
    if (!samplePath) {
      continue;
    }

    const context = resolveRowContext(categories, sagataveSections, samplePath);
    if (!context) {
      continue;
    }

    const { projectItems, projectRow, sagataveRow } = context;
    const rowIndex = samplePath.rowIndex;
    if (rowIndex == null) {
      continue;
    }

    if (isEstimateMultiPosition(projectRow) && isEstimateMultiPosition(sagataveRow)) {
      let nextMulti = projectRow;

      if (rowKeysWithMultiName.has(rowKey)) {
        nextMulti = {
          ...nextMulti,
          name: sagataveRow.name,
        };
      }

      if (rowKeysWithMultiNote.has(rowKey)) {
        nextMulti = {
          ...nextMulti,
          note: normalizeOptionalText(sagataveRow.note) || undefined,
        };
      }

      if (rowKeysWithMultiRequiresAttention.has(rowKey)) {
        nextMulti = {
          ...nextMulti,
          requiresAttention:
            sagataveRow.requiresAttention === true ? true : undefined,
          attentionBudget:
            sagataveRow.requiresAttention === true
              ? nextMulti.attentionBudget
              : undefined,
        };
      }

      if (rowKeysWithMultiAttentionBudget.has(rowKey)) {
        nextMulti = {
          ...nextMulti,
          attentionBudget: normalizeAttentionBudget(sagataveRow.attentionBudget),
        };
      }

      const usedProjectOptionIds = new Set<string>();
      const sagataveToProjectOptionId = new Map<number, string>();

      for (const [optionIndex, sagataveOption] of sagataveRow.options.entries()) {
        const projectOption = findUnpairedProjectOptionForSagataveOption(
          nextMulti.options,
          sagataveOption,
          optionIndex,
          sagataveRow.options,
          usedProjectOptionIds,
        );
        if (projectOption) {
          usedProjectOptionIds.add(projectOption.id);
          sagataveToProjectOptionId.set(optionIndex, projectOption.id);
        }
      }

      const options = [...nextMulti.options];
      let optionsChanged = nextMulti !== projectRow;

      for (const [optionIndex, sagataveOption] of sagataveRow.options.entries()) {
        const optionKey = `${rowKey}:o${optionIndex}`;
        const hasSelectedOptionFieldChange =
          optionKeysToSync.has(optionKey) ||
          changes.some(
            (change) =>
              change.field !== "multiOptionAdd" &&
              rowOnlySyncKey(change.path) === rowKey &&
              change.path.optionIndex === optionIndex,
          );

        if (!hasSelectedOptionFieldChange) {
          continue;
        }

        const projectOptionId = sagataveToProjectOptionId.get(optionIndex);
        if (projectOptionId == null) {
          continue;
        }

        const optionArrayIndex = options.findIndex(
          (option) => option.id === projectOptionId,
        );
        const projectOption = optionArrayIndex >= 0 ? options[optionArrayIndex] : undefined;
        if (!projectOption) {
          continue;
        }

        const nextLineItem = syncLineItemFromSagatave(
          projectOption.lineItem,
          sagataveOption.lineItem,
        );
        if (nextLineItem === projectOption.lineItem) {
          continue;
        }

        options[optionArrayIndex] = { ...projectOption, lineItem: nextLineItem };
        optionsChanged = true;
      }

      const optionIndicesToAdd = changes
        .filter(
          (change) =>
            change.field === "multiOptionAdd" &&
            rowOnlySyncKey(change.path) === rowKey &&
            change.path.optionIndex != null,
        )
        .map((change) => change.path.optionIndex as number)
        .sort((a, b) => a - b);

      for (const optionIndex of optionIndicesToAdd) {
        if (sagataveToProjectOptionId.has(optionIndex)) {
          continue;
        }

        const sagataveOption = sagataveRow.options[optionIndex];
        if (!sagataveOption) {
          continue;
        }

        const cloned = cloneMultiOption(sagataveOption, new Map());
        let insertAt = Math.min(optionIndex, options.length);

        for (let previousIndex = optionIndex - 1; previousIndex >= 0; previousIndex -= 1) {
          const previousOptionId = sagataveToProjectOptionId.get(previousIndex);
          if (!previousOptionId) {
            continue;
          }

          const previousArrayIndex = options.findIndex(
            (option) => option.id === previousOptionId,
          );
          if (previousArrayIndex >= 0) {
            insertAt = previousArrayIndex + 1;
            break;
          }
        }

        options.splice(insertAt, 0, cloned);
        sagataveToProjectOptionId.set(optionIndex, cloned.id);
        optionsChanged = true;
      }

      if (optionsChanged) {
        const nextRow = { ...nextMulti, options };
        projectItems[rowIndex] = nextRow;
        appliedNodeIds.push(...collectTouchedNodeIds(nextRow));
      }

      continue;
    }

    if (!isEstimateLineItem(projectRow) || !isEstimateLineItem(sagataveRow)) {
      continue;
    }

    let nextRow: EstimateLineItem = projectRow;
    if (rowKeysWithLineAttentionBudget.has(rowKey)) {
      nextRow = applyLineItemField(projectRow, sagataveRow, "attentionBudget");
    }

    const syncedRow = syncLineItemFromSagatave(nextRow, sagataveRow);
    if (syncedRow !== projectRow) {
      projectItems[rowIndex] = syncedRow;
      appliedNodeIds.push(...collectTouchedNodeIds(syncedRow));
    }
  }

  return {
    categories,
    appliedNodeIds: Array.from(new Set(appliedNodeIds)),
  };
}
