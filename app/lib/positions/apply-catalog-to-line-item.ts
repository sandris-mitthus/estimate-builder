import type { EstimateLineItem, PriceBreakdown } from "@/app/lib/estimates/types";
import type { PositionCostType } from "@/app/lib/positions/position-cost-type";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

const UNIT_PRICE_FIELD_BY_COST_TYPE: Record<
  Exclude<PositionCostType, "labor">,
  "materials" | "mechanisms"
> = {
  materials: "materials",
  mechanisms: "mechanisms",
};

export function resolvePositionCatalogUnitPrice(
  position: PositionPriceSummary,
): number | undefined {
  const raw = position.unitPrice;
  if (raw === undefined || raw === null) {
    return undefined;
  }

  const price = Number(raw);
  return Number.isFinite(price) ? price : undefined;
}

export function getMaterialsOrMechanismsUnitPrice(
  unitPrice: PriceBreakdown,
): number | null {
  if (
    unitPrice.materials > 0 &&
    unitPrice.labor === 0 &&
    unitPrice.mechanisms === 0
  ) {
    return unitPrice.materials;
  }

  if (
    unitPrice.mechanisms > 0 &&
    unitPrice.labor === 0 &&
    unitPrice.materials === 0
  ) {
    return unitPrice.mechanisms;
  }

  return null;
}

export function getCatalogHintPrice(
  position: PositionPriceSummary,
  defaultHourlyRate: number | null,
): number | null {
  if (position.costType === "labor") {
    return defaultHourlyRate;
  }

  const catalogUnitPrice = resolvePositionCatalogUnitPrice(position);
  return catalogUnitPrice ?? null;
}

export function isMaterialsOrMechanismsCostType(
  costType: PositionCostType,
): boolean {
  return costType === "materials" || costType === "mechanisms";
}

export function buildUnitPriceForCatalogPosition(
  position: PositionPriceSummary,
  defaultHourlyRate: number | null,
): PriceBreakdown {
  const unitPrice: PriceBreakdown = { labor: 0, materials: 0, mechanisms: 0 };
  const catalogUnitPrice = resolvePositionCatalogUnitPrice(position);

  if (position.costType === "labor") {
    unitPrice.labor = defaultHourlyRate ?? 0;
  } else if (
    position.costType === "materials" ||
    position.costType === "mechanisms"
  ) {
    const field = UNIT_PRICE_FIELD_BY_COST_TYPE[position.costType];
    unitPrice[field] = catalogUnitPrice ?? 0;
  }

  return unitPrice;
}

/** Aizpilda vienības cenu atbilstošajā kolonnā (Darbs / Materiāls / Mehānismi). */
export function applyCatalogPricesToLinkedLineItem(
  item: EstimateLineItem,
  position: PositionPriceSummary,
  defaultHourlyRate: number | null,
): EstimateLineItem {
  return {
    ...item,
    unit: item.unit.trim() ? item.unit : position.unit,
    unitPrice: buildUnitPriceForCatalogPosition(position, defaultHourlyRate),
    positionPriceId: position.id,
  };
}

export function applyCatalogPositionToLineItem(
  item: EstimateLineItem,
  position: PositionPriceSummary,
  defaultHourlyRate: number | null,
): EstimateLineItem {
  return {
    ...applyCatalogPricesToLinkedLineItem(item, position, defaultHourlyRate),
    name: position.name,
    unit: position.unit,
  };
}
