import { enableAdditionalWorkManualQuantity } from "@/app/lib/estimates/additional-work-quantity";
import { collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import {
  resolveEffectiveMaterials,
  resolveEffectiveMechanisms,
} from "@/app/lib/estimates/composite-line-item";
import {
  resolveLineItemDisplayName,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  LineItemCatalogRef,
  LineItemModuleSizeAttachment,
} from "@/app/lib/estimates/types";
import { normalizePositionSearchText } from "@/app/lib/positions/filter-positions";

const positionNameCollator = new Intl.Collator("lv-LV", {
  numeric: true,
  sensitivity: "base",
});

function cloneModuleSizeAttachment(
  attachment: LineItemModuleSizeAttachment | undefined,
): LineItemModuleSizeAttachment | undefined {
  if (!attachment) {
    return undefined;
  }

  return {
    ...attachment,
    itemKeys: attachment.itemKeys ? [...attachment.itemKeys] : undefined,
    itemSigns: attachment.itemSigns
      ? { ...attachment.itemSigns }
      : undefined,
    itemMultipliers: attachment.itemMultipliers
      ? { ...attachment.itemMultipliers }
      : undefined,
    adjustments: attachment.adjustments
      ? { ...attachment.adjustments }
      : undefined,
  };
}

function cloneCatalogRef(ref: LineItemCatalogRef): LineItemCatalogRef {
  return {
    ...ref,
    consumptionVolumeAttachment: cloneModuleSizeAttachment(
      ref.consumptionVolumeAttachment,
    ),
  };
}

/** Meklēšanai / hintiem — ievadītais nosaukums vai atvasinātais no materiāla/mehānisma. */
export function resolvePositionTemplateName(item: EstimateLineItem): string {
  const resolved = resolveLineItemDisplayName(item);
  return resolved === "—" ? "" : resolved;
}

/**
 * Savāc unikālas nosauktas pozīcijas no tāmes/sagataves dokumenta —
 * izmantojamas kā hinti PositionModal nosaukuma laukā.
 */
export function collectPositionTemplates(
  categories: EstimateCategory[],
  options?: { excludeId?: string },
): EstimateLineItem[] {
  const seen = new Set<string>();
  const templates: EstimateLineItem[] = [];

  for (const item of collectEstimateLineItems(categories)) {
    if (options?.excludeId && item.id === options.excludeId) {
      continue;
    }

    const name = resolvePositionTemplateName(item);
    if (!name) {
      continue;
    }

    const key = normalizePositionSearchText(name);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    templates.push(item);
  }

  return templates.sort((left, right) =>
    positionNameCollator.compare(
      resolvePositionTemplateName(left),
      resolvePositionTemplateName(right),
    ),
  );
}

/** Apvieno avotus (piem. sagatave + pašreizējā tāme), bez dublikātiem pēc nosaukuma. */
export function mergePositionTemplates(
  ...groups: EstimateLineItem[][]
): EstimateLineItem[] {
  const seen = new Set<string>();
  const templates: EstimateLineItem[] = [];

  for (const group of groups) {
    for (const item of group) {
      const name = resolvePositionTemplateName(item);
      if (!name) {
        continue;
      }

      const key = normalizePositionSearchText(name);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      templates.push(item);
    }
  }

  return templates.sort((left, right) =>
    positionNameCollator.compare(
      resolvePositionTemplateName(left),
      resolvePositionTemplateName(right),
    ),
  );
}

export function filterPositionTemplatesByQuery(
  templates: EstimateLineItem[],
  query: string,
): EstimateLineItem[] {
  const normalizedQuery = normalizePositionSearchText(query.trim());
  if (!normalizedQuery) {
    return templates;
  }

  return templates.filter((item) => {
    const name = normalizePositionSearchText(resolvePositionTemplateName(item));
    const unit = normalizePositionSearchText(item.unit);
    return name.includes(normalizedQuery) || unit.includes(normalizedQuery);
  });
}

/**
 * Aizpilda draftu no sagataves/esošās pozīcijas — saglabā draft `id` un `quantity`.
 */
export function applyPositionTemplateToDraft(
  draft: EstimateLineItem,
  template: EstimateLineItem,
  options?: { forceManualQuantity?: boolean },
): EstimateLineItem {
  const materials = resolveEffectiveMaterials(template).map(cloneCatalogRef);
  const mechanisms = resolveEffectiveMechanisms(template).map(cloneCatalogRef);
  const forceManual = options?.forceManualQuantity === true;

  const next: EstimateLineItem = {
    ...draft,
    name: template.name.trim() || resolvePositionTemplateName(template),
    note: template.note,
    unit: template.unit,
    laborTimeNorm: template.laborTimeNorm,
    customHourlyRateEnabled: template.customHourlyRateEnabled,
    customHourlyRate: template.customHourlyRate,
    materials,
    mechanisms,
    material: undefined,
    mechanism: undefined,
    moduleSizeAttachment: forceManual
      ? undefined
      : cloneModuleSizeAttachment(template.moduleSizeAttachment),
    variableQuantity: forceManual
      ? true
      : template.variableQuantity === true
        ? true
        : undefined,
    manualUnitEnabled: template.manualUnitEnabled,
    manualUnit: template.manualUnit,
    requiresAttention: template.requiresAttention,
    attentionBudget: template.attentionBudget,
    showOnlyTotalPrice: template.showOnlyTotalPrice,
    positionPriceId: undefined,
    unitPrice: { ...template.unitPrice },
  };

  return forceManual ? enableAdditionalWorkManualQuantity(next) : next;
}
