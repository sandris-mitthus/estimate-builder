export type LocalizedValues = Record<string, string>;

export function parseLocalizedValues(raw: unknown): LocalizedValues {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: LocalizedValues = {};
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") {
      out[code] = value;
    }
  }
  return out;
}

export function normalizeLocalizedValues(
  values: LocalizedValues,
): LocalizedValues {
  return Object.fromEntries(
    Object.entries(values).map(([code, value]) => [
      code.trim(),
      value.trim(),
    ]),
  );
}

export function resolveLocalizedValue(
  values: LocalizedValues,
  languageCode: string,
  fallbackCodes: string[] = ["lv", "en"],
): string {
  const preferred = values[languageCode]?.trim();
  if (preferred) return preferred;
  for (const code of fallbackCodes) {
    const value = values[code]?.trim();
    if (value) return value;
  }
  const first = Object.values(values).find((value) => value.trim());
  return first?.trim() ?? "";
}

export function emptyLocalizedValuesForCodes(codes: string[]): LocalizedValues {
  return Object.fromEntries(codes.map((code) => [code, ""]));
}
