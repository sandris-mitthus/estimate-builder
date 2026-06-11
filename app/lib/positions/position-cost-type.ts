export const POSITION_COST_TYPES = [
  "labor",
  "materials",
  "mechanisms",
] as const;

export type PositionCostType = (typeof POSITION_COST_TYPES)[number];

export const DEFAULT_POSITION_COST_TYPE: PositionCostType = "labor";

export const POSITION_COST_TYPE_LABELS: Record<PositionCostType, string> = {
  labor: "Darbs",
  materials: "Materiāls",
  mechanisms: "Mehānismi",
};

export const POSITION_COST_TYPE_ICONS: Record<PositionCostType, string> = {
  labor: "fas fa-people-carry",
  materials: "fas fa-layer-group",
  mechanisms: "fas fa-car-side",
};

export const POSITION_COST_TYPE_OPTIONS = POSITION_COST_TYPES.map((value) => ({
  value,
  label: POSITION_COST_TYPE_LABELS[value],
  icon: POSITION_COST_TYPE_ICONS[value],
}));

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
