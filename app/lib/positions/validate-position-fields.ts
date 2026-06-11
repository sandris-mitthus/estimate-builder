import {
  isPositionCostType,
  type PositionCostType,
} from "@/app/lib/positions/position-cost-type";

export function validatePositionFields(
  name: string,
  unit: string,
  costType: PositionCostType | string,
): string | null {
  if (!name.trim()) {
    return "Ievadi nosaukumu.";
  }

  if (!unit.trim()) {
    return "Ievadi mērvienību.";
  }

  if (!isPositionCostType(costType)) {
    return "Izvēlies izmaksu veidu.";
  }

  return null;
}
