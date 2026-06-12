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
 * piesaistīts materiāls + piesaistīts mehānisms. Cenas:
 * - darbs = laika norma (c/h) × stundas likme
 * - materiāls = piesaistītā kataloga pozīcijas cena
 * - mehānisms = kataloga likme (EUR/h) × laika norma (c/h)
 */
export function isCompositeLineItem(item: EstimateLineItem): boolean {
  return (
    item.laborTimeNorm !== undefined ||
    item.material !== undefined ||
    item.mechanism !== undefined
  );
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

/** Atsvaidzina materiāla / mehānisma nosaukumu un mērvienību no kataloga (ja vēl pastāv). */
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
    resolveCatalogRefUnitPrice(item.material, catalogPositions),
  );
  const mechanismHourlyRate = resolveCatalogRefUnitPrice(
    item.mechanism,
    catalogPositions,
  );
  const mechanisms = roundToTwoDecimals(mechanismHourlyRate * timeNorm);

  return { labor, materials, mechanisms };
}

export function hydrateCompositeLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  options?: { forceCatalogPrices?: boolean },
): EstimateLineItem {
  const material = refreshCatalogRef(item.material, catalogPositions);
  const mechanism = refreshCatalogRef(item.mechanism, catalogPositions);
  const next: EstimateLineItem = {
    ...item,
    material,
    mechanism,
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
    material: null,
    mechanism: null,
  };
}
