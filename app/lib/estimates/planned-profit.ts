import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import type { PriceBreakdown } from "@/app/lib/estimates/types";

export function normalizePlannedProfitPercent(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return roundToTwoDecimals(value);
}

export function isPlannedProfitUnset(value: unknown): boolean {
  return normalizePlannedProfitPercent(value) <= 0;
}

/**
 * Planned profit only applies when the company has `module_profit`. Stored
 * values stay untouched in the database, but every calculation and export
 * reads 0% so amounts never include profit the company cannot see or edit.
 */
export function resolvePlannedProfitPercent(
  value: unknown,
  profitModuleEnabled: boolean,
): number {
  return profitModuleEnabled ? normalizePlannedProfitPercent(value) : 0;
}

/** Estimate meta with profit stripped when the company has no profit module. */
export function applyProfitModuleToMeta<T extends { plannedProfitPercent?: number }>(
  meta: T,
  profitModuleEnabled: boolean,
): T {
  if (profitModuleEnabled) {
    return meta;
  }

  return { ...meta, plannedProfitPercent: 0 };
}

export function parsePlannedProfitInput(raw: string): number {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return roundToTwoDecimals(parsed);
}

export function getPlannedProfitMultiplier(percent: number): number {
  const normalized = normalizePlannedProfitPercent(percent);
  if (normalized <= 0) {
    return 1;
  }

  return 1 + normalized / 100;
}

export function applyPlannedProfitPercent(
  values: PriceBreakdown,
  percent: number,
): PriceBreakdown {
  const multiplier = getPlannedProfitMultiplier(percent);
  if (multiplier === 1) {
    return values;
  }

  return {
    labor: roundToTwoDecimals(values.labor * multiplier),
    materials: roundToTwoDecimals(values.materials * multiplier),
    mechanisms: roundToTwoDecimals(values.mechanisms * multiplier),
  };
}
