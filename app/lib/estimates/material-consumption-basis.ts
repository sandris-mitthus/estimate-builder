import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import { normalizeLineItemModuleSizeAttachment } from "@/app/lib/estimates/module-size-attachment";
import {
  resolveLineItemDisplayQuantityFromModuleSize,
  resolveLineItemDisplayUnitFromModuleSize,
  resolveQuantityFromModuleSizeAttachment,
} from "@/app/lib/estimates/sync-module-size-quantities";
import type {
  EstimateLineItem,
  LineItemCatalogRef,
  LineItemModuleSizeAttachment,
} from "@/app/lib/estimates/types";
import { areEstimateUnitsEquivalent } from "@/app/lib/estimates/units";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import { roundQuantity } from "@/app/lib/positions/variable-quantity";

export function hasMaterialCustomConsumptionVolume(
  ref: LineItemCatalogRef,
): boolean {
  return (
    normalizeLineItemModuleSizeAttachment(ref.consumptionVolumeAttachment) !=
    null
  );
}

export function resolveMaterialConsumptionVolumeAttachment(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
): LineItemModuleSizeAttachment | null {
  const custom = normalizeLineItemModuleSizeAttachment(
    ref.consumptionVolumeAttachment,
  );
  if (custom) {
    return custom;
  }

  return (
    normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment) ?? null
  );
}

function resolveQuantityForAttachment(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
): number | null {
  if (moduleSizeOptions.length === 0) {
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

/** Patēriņa mērvienība — moduļa apjoms, uz kuru attiecas `consumption`. */
export function resolveMaterialConsumptionBasisUnit(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): string | null {
  const attachment = resolveMaterialConsumptionVolumeAttachment(ref, item);
  if (!attachment || moduleSizeOptions.length === 0) {
    return null;
  }

  return resolveLineItemDisplayUnitFromModuleSize(
    { ...item, moduleSizeAttachment: attachment },
    moduleSizeOptions,
  );
}

export function resolveMaterialConsumptionBasisQuantity(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): number | null {
  const attachment = normalizeLineItemModuleSizeAttachment(
    ref.consumptionVolumeAttachment,
  );
  if (!attachment) {
    return null;
  }

  return resolveQuantityForAttachment(attachment, moduleSizeOptions);
}

export function resolvePositionQuantityForMaterialRatio(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): number | null {
  const attached = resolveLineItemDisplayQuantityFromModuleSize(
    item,
    moduleSizeOptions,
  );
  if (attached != null && attached > 0) {
    return attached;
  }

  if (item.variableQuantity && item.quantity > 0) {
    return roundQuantity(item.quantity);
  }

  return null;
}

export function shouldShowMaterialConsumptionInput(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): boolean {
  const basisUnit = resolveMaterialConsumptionBasisUnit(
    ref,
    item,
    moduleSizeOptions,
  );
  return (
    basisUnit != null && !areEstimateUnitsEquivalent(ref.unit, basisUnit)
  );
}

/** Materiāla cenas daļa kompozīta vienības cenā (uz 1 pozīcijas mērvienību). */
export function resolveMaterialUnitPriceContribution(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
  catalogUnitPrice: number,
  moduleSizeOptions: BuildingModuleSizeOption[],
): number {
  const consumption = ref.consumption ?? 1;

  if (moduleSizeOptions.length > 0) {
    const basisUnit = resolveMaterialConsumptionBasisUnit(
      ref,
      item,
      moduleSizeOptions,
    );
    const needsModuleRatio =
      hasMaterialCustomConsumptionVolume(ref) ||
      (basisUnit != null && !areEstimateUnitsEquivalent(ref.unit, basisUnit));

    if (needsModuleRatio) {
      const attachment = resolveMaterialConsumptionVolumeAttachment(ref, item);
      const basisQty = attachment
        ? resolveQuantityForAttachment(attachment, moduleSizeOptions)
        : null;
      const positionQty = resolvePositionQuantityForMaterialRatio(
        item,
        moduleSizeOptions,
      );

      if (
        basisQty != null &&
        basisQty > 0 &&
        positionQty != null &&
        positionQty > 0
      ) {
        return roundToTwoDecimals(
          catalogUnitPrice * consumption * (basisQty / positionQty),
        );
      }
    }
  }

  return roundToTwoDecimals(catalogUnitPrice * consumption);
}

/** Kopējais materiāla daudzums projekta/tāmes aprēķinam. */
export function resolveMaterialTotalQuantity(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
  positionQuantity: number,
  moduleSizeOptions: BuildingModuleSizeOption[],
): number {
  const consumption = ref.consumption ?? 1;

  if (hasMaterialCustomConsumptionVolume(ref)) {
    const basisQty = resolveMaterialConsumptionBasisQuantity(
      ref,
      item,
      moduleSizeOptions,
    );
    if (basisQty != null && basisQty > 0) {
      return roundQuantity(basisQty * consumption);
    }
  }

  return roundQuantity(positionQuantity * consumption);
}

export function defaultMaterialConsumptionVolumeAttachment(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
  itemKey: string,
): LineItemModuleSizeAttachment | null {
  const positionAttachment = normalizeLineItemModuleSizeAttachment(
    item.moduleSizeAttachment,
  );
  const moduleId =
    positionAttachment?.moduleId ?? moduleSizeOptions[0]?.id ?? null;

  if (!moduleId || !itemKey.trim()) {
    return null;
  }

  return {
    moduleId,
    itemKey,
  };
}

export function flattenModuleSizeSelectOptions(
  moduleSizeOptions: BuildingModuleSizeOption[],
) {
  const firstModuleOption = moduleSizeOptions[0];
  if (!firstModuleOption) {
    return [];
  }

  return firstModuleOption.sections.flatMap((section) =>
    section.items.map((entry) => ({
      key: entry.key,
      label: entry.label,
      unit: entry.unit,
      sectionTitle: section.title,
    })),
  );
}
