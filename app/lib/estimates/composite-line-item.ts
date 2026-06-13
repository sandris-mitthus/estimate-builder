import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import type {
  EstimateLineItem,
  LineItemCatalogRef,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import { resolvePositionCatalogUnitPrice } from "@/app/lib/positions/apply-catalog-to-line-item";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

/**
 * Kompozītā pozīcija (jaunais modelis): nosaukums + laika norma (darbs) +
 * piesaistīti materiāli + piesaistīti mehānismi. Cenas:
 * - darbs = laika norma (c/h) × stundas likme
 * - materiāls = piesaistīto kataloga pozīciju cenu summa
 * - mehānisms = Σ (kataloga likme (EUR/h) × laika norma) katram mehānismam
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
): PriceBreakdown {
  const timeNorm = Number.isFinite(item.laborTimeNorm)
    ? roundToTwoDecimals(item.laborTimeNorm ?? 0)
    : 0;
  const labor = roundToTwoDecimals(timeNorm * (defaultHourlyRate ?? 0));

  const materials = roundToTwoDecimals(
    resolveEffectiveMaterials(item).reduce(
      (sum, ref) => sum + resolveCatalogRefUnitPrice(ref, catalogPositions),
      0,
    ),
  );

  const mechanisms = roundToTwoDecimals(
    resolveEffectiveMechanisms(item).reduce((sum, ref) => {
      const rate = resolveCatalogRefUnitPrice(ref, catalogPositions);
      return sum + roundToTwoDecimals(rate * timeNorm);
    }, 0),
  );

  return { labor, materials, mechanisms };
}

export function hydrateCompositeLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  options?: { forceCatalogPrices?: boolean },
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

/** Jauna kompozītā pozīcija modālim. */
export function createCompositePosition(): EstimateLineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    unit: "gab.",
    quantity: 1,
    unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
    laborTimeNorm: 0,
    materials: [],
    mechanisms: [],
  };
}
