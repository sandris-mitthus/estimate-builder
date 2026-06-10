export const DEFAULT_ESTIMATE_VALIDITY_DAYS = 30;

export function normalizeEstimateValidityDays(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_ESTIMATE_VALIDITY_DAYS;
  }

  return parsed;
}

export function parseEstimateValidityDaysInput(value: string): string {
  return value.replace(/\D/g, "");
}

export function estimateValidityDaysSuffix(days: number): string {
  return `${days} dienas`;
}
