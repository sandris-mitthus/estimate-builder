import type { PositionPriceSummary } from "@/app/lib/positions/types";

type CollectKnownUnitsOptions = {
  excludePositionId?: string;
};

export function collectKnownUnits(
  positions: PositionPriceSummary[],
  options: CollectKnownUnitsOptions = {},
): string[] {
  const seen = new Set<string>();
  const units: string[] = [];

  for (const position of positions) {
    if (
      options.excludePositionId &&
      position.id === options.excludePositionId
    ) {
      continue;
    }

    const unit = position.unit.trim();
    if (!unit) continue;

    const key = unit.toLocaleLowerCase("lv-LV");
    if (seen.has(key)) continue;

    seen.add(key);
    units.push(unit);
  }

  return units.sort((left, right) =>
    left.localeCompare(right, "lv-LV", { sensitivity: "base" }),
  );
}

export function filterUnitSuggestions(
  query: string,
  units: string[],
): string[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("lv-LV");

  const filtered = units.filter((unit) => {
    const normalizedUnit = unit.toLocaleLowerCase("lv-LV");
    if (normalizedQuery && normalizedUnit === normalizedQuery) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return normalizedUnit.includes(normalizedQuery);
  });

  return filtered.sort((left, right) => {
    if (!normalizedQuery) {
      return left.localeCompare(right, "lv-LV", { sensitivity: "base" });
    }

    const leftStarts = left
      .toLocaleLowerCase("lv-LV")
      .startsWith(normalizedQuery);
    const rightStarts = right
      .toLocaleLowerCase("lv-LV")
      .startsWith(normalizedQuery);

    if (leftStarts !== rightStarts) {
      return leftStarts ? -1 : 1;
    }

    return left.localeCompare(right, "lv-LV", { sensitivity: "base" });
  });
}
