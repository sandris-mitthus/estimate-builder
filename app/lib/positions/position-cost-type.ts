import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export const POSITION_COST_TYPES = [
  "labor",
  "materials",
  "mechanisms",
] as const;

export type PositionCostType = (typeof POSITION_COST_TYPES)[number];

export const CATALOG_POSITION_COST_TYPES = [
  "materials",
  "mechanisms",
] as const;

export type CatalogPositionCostType =
  (typeof CATALOG_POSITION_COST_TYPES)[number];

export const DEFAULT_POSITION_COST_TYPE: PositionCostType = "labor";

export const DEFAULT_CATALOG_POSITION_COST_TYPE: CatalogPositionCostType =
  "materials";

export const POSITION_COST_TYPE_LABELS: Record<PositionCostType, string> = {
  labor: "Darbs",
  materials: "Materiāls",
  mechanisms: "Mehānismi",
};

export const POSITION_COST_TYPE_LABEL_KEYS: Record<PositionCostType, string> = {
  labor: "position.cost_type.labor",
  materials: "position.cost_type.materials",
  mechanisms: "position.cost_type.mechanisms",
};

export const POSITION_COST_TYPE_ICONS: Record<PositionCostType, string> = {
  labor: "fas fa-people-carry",
  materials: "fas fa-layer-group",
  mechanisms: "fas fa-car-side",
};

export function getPositionCostTypeLabel(
  costType: PositionCostType,
  t?: Translate,
): string {
  return t
    ? t(POSITION_COST_TYPE_LABEL_KEYS[costType], POSITION_COST_TYPE_LABELS[costType])
    : POSITION_COST_TYPE_LABELS[costType];
}

export function getPositionCostTypeOptions(t?: Translate) {
  return POSITION_COST_TYPES.map((value) => ({
    value,
    label: getPositionCostTypeLabel(value, t),
    icon: POSITION_COST_TYPE_ICONS[value],
  }));
}

export function getCatalogPositionCostTypeOptions(t?: Translate) {
  return getPositionCostTypeOptions(t).filter((option) =>
    (CATALOG_POSITION_COST_TYPES as readonly string[]).includes(option.value),
  );
}

export function isCatalogPositionCostType(
  value: PositionCostType,
): value is CatalogPositionCostType {
  return (CATALOG_POSITION_COST_TYPES as readonly string[]).includes(value);
}

export function isPositionCostType(value: unknown): value is PositionCostType {
  return (
    typeof value === "string" &&
    (POSITION_COST_TYPES as readonly string[]).includes(value)
  );
}

export function normalizePositionCostType(
  value: unknown,
): PositionCostType | null {
  return isPositionCostType(value) ? value : null;
}
