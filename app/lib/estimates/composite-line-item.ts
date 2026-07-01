import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import { resolveMaterialUnitPriceContribution } from "@/app/lib/estimates/material-consumption-basis";
import type {
  EstimateLineItem,
  LineItemCatalogRef,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import { resolvePositionCatalogUnitPrice } from "@/app/lib/positions/apply-catalog-to-line-item";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";

/**
 * Kompozītā pozīcija (jaunais modelis): nosaukums + laika norma (darbs) +
 * piesaistīti materiāli + piesaistīti mehānismi. Cenas:
 * - darbs = laika norma (c/h) × stundas likme
 * - materiāls = piesaistīto kataloga pozīciju cenu summa
 * - mehānisms = Σ (kataloga likme × laika norma × daudzums) vai fiksētam mehānismam Σ (kataloga likme × daudzums)
 */
export function isCompositeLineItem(item: EstimateLineItem): boolean {
  return (
    item.laborTimeNorm !== undefined ||
    item.material !== undefined ||
    item.mechanism !== undefined ||
    item.materials !== undefined ||
    item.mechanisms !== undefined
  );
}

/** Atgriež materiālu sarakstu ar atbalstu vecajam singular formātam. */
export function resolveEffectiveMaterials(
  item: EstimateLineItem,
): LineItemCatalogRef[] {
  if (item.materials !== undefined) {
    return item.materials;
  }
  return item.material ? [item.material] : [];
}

/** Atgriež mehānismu sarakstu ar atbalstu vecajam singular formātam. */
export function resolveEffectiveMechanisms(
  item: EstimateLineItem,
): LineItemCatalogRef[] {
  if (item.mechanisms !== undefined) {
    return item.mechanisms;
  }
  return item.mechanism ? [item.mechanism] : [];
}

export function resolveCatalogRefUnitPrice(
  ref: LineItemCatalogRef | null | undefined,
  catalogPositions: PositionPriceSummary[],
): number {
  if (!ref) {
    return 0;
  }

  const position = catalogPositions.find(
    (entry) => entry.id === ref.positionPriceId,
  );
  return resolvePositionCatalogUnitPrice(position ?? ({} as PositionPriceSummary)) ?? 0;
}

/** Atsvaidzina viena materiāla / mehānisma nosaukumu un mērvienību no kataloga (ja vēl pastāv). */
function refreshCatalogRef(
  ref: LineItemCatalogRef | null | undefined,
  catalogPositions: PositionPriceSummary[],
): LineItemCatalogRef | null {
  if (!ref) {
    return null;
  }

  const position = catalogPositions.find(
    (entry) => entry.id === ref.positionPriceId,
  );

  if (!position) {
    return ref;
  }

  return {
    positionPriceId: position.id,
    name: position.name,
    unit: position.unit,
    ...(ref.consumption != null ? { consumption: ref.consumption } : {}),
    ...(ref.consumptionVolumeAttachment
      ? { consumptionVolumeAttachment: ref.consumptionVolumeAttachment }
      : {}),
    ...(ref.manualConsumption === true ? { manualConsumption: true } : {}),
    ...(ref.fixedQuantity === true ? { fixedQuantity: true } : {}),
  };
}

/** Atsvaidzina masīva katru ierakstu; izmet neesošos. */
function refreshCatalogRefs(
  refs: LineItemCatalogRef[],
  catalogPositions: PositionPriceSummary[],
): LineItemCatalogRef[] {
  return refs
    .map((ref) => refreshCatalogRef(ref, catalogPositions))
    .filter((ref): ref is LineItemCatalogRef => ref !== null);
}

export function deriveCompositeUnitPrice(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  moduleSizeOptions: BuildingModuleSizeOption[] = [],
): PriceBreakdown {
  const timeNorm = Number.isFinite(item.laborTimeNorm)
    ? roundToTwoDecimals(item.laborTimeNorm ?? 0)
    : 0;
  const labor = roundToTwoDecimals(
    timeNorm * resolveLineItemHourlyRate(item, defaultHourlyRate),
  );

  const materials = roundToTwoDecimals(
    resolveEffectiveMaterials(item).reduce((sum, ref) => {
      const price = resolveCatalogRefUnitPrice(ref, catalogPositions);
      if (moduleSizeOptions.length > 0) {
        return (
          sum +
          resolveMaterialUnitPriceContribution(
            ref,
            item,
            price,
            moduleSizeOptions,
          )
        );
      }

      const consumption = ref.consumption ?? 1;
      return sum + roundToTwoDecimals(price * consumption);
    }, 0),
  );

  const mechanisms = roundToTwoDecimals(
    resolveEffectiveMechanisms(item).reduce((sum, ref) => {
      const rate = resolveCatalogRefUnitPrice(ref, catalogPositions);
      const quantity = ref.consumption ?? 1;
      const effectiveQuantity =
        ref.fixedQuantity === true ? quantity : timeNorm * quantity;
      return sum + roundToTwoDecimals(rate * effectiveQuantity);
    }, 0),
  );

  return { labor, materials, mechanisms };
}

export function resolveLineItemHourlyRate(
  item: EstimateLineItem | null | undefined,
  defaultHourlyRate: number | null,
): number {
  if (
    item?.customHourlyRateEnabled === true &&
    Number.isFinite(item.customHourlyRate) &&
    (item.customHourlyRate ?? 0) >= 0
  ) {
    return roundToTwoDecimals(item.customHourlyRate ?? 0);
  }

  return defaultHourlyRate ?? 0;
}

export function hydrateCompositeLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  options?: {
    forceCatalogPrices?: boolean;
    moduleSizeOptions?: BuildingModuleSizeOption[];
  },
): EstimateLineItem {
  // Migrācija no veca singular formāta uz masīviem
  const rawMaterials = item.materials ?? (item.material ? [item.material] : []);
  const rawMechanisms = item.mechanisms ?? (item.mechanism ? [item.mechanism] : []);

  const materials = refreshCatalogRefs(rawMaterials, catalogPositions);
  const mechanisms = refreshCatalogRefs(rawMechanisms, catalogPositions);

  const next: EstimateLineItem = {
    ...item,
    materials,
    mechanisms,
    material: undefined,
    mechanism: undefined,
  };

  if (options?.forceCatalogPrices) {
    return {
      ...next,
      unitPrice: deriveCompositeUnitPrice(
        next,
        catalogPositions,
        defaultHourlyRate,
        options.moduleSizeOptions ?? [],
      ),
    };
  }

  return next;
}

export function catalogPositionToLineItemRef(
  position: PositionPriceSummary,
): LineItemCatalogRef {
  return {
    positionPriceId: position.id,
    name: position.name,
    unit: position.unit,
  };
}

/** Kataloga pozīciju ID, kas jau piesaistītas rindai — hintu sarakstā nerāda. */
export function buildExcludedCatalogKeysFromRefs(
  refs: ReadonlyArray<{ positionPriceId: string }>,
): ReadonlySet<string> {
  if (refs.length === 0) {
    return new Set<string>();
  }

  return new Set(refs.map((ref) => `catalog:${ref.positionPriceId}`));
}

/** Jauna kompozītā pozīcija modālim. */
export function createCompositePosition(): EstimateLineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    unit: "gab.",
    quantity: 1,
    unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
    laborTimeNorm: 0,
    customHourlyRateEnabled: false,
    materials: [],
    mechanisms: [],
  };
}

/** Atjaunina laika normu un pārrēķina kompozīta vienības cenu (tabula / modālis). */
export function patchLineItemLaborTimeNorm(
  item: EstimateLineItem,
  laborTimeNorm: number,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  moduleSizeOptions: BuildingModuleSizeOption[] = [],
): EstimateLineItem {
  const nextItem = {
    ...item,
    laborTimeNorm: roundToTwoDecimals(laborTimeNorm),
  };

  if (!isCompositeLineItem(nextItem)) {
    return nextItem;
  }

  return {
    ...nextItem,
    unitPrice: deriveCompositeUnitPrice(
      nextItem,
      catalogPositions,
      defaultHourlyRate,
      moduleSizeOptions,
    ),
  };
}
