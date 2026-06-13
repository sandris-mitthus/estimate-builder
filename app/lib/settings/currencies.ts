export const CURRENCY_OPTIONS = [
  { value: "EUR", label: "EUR — Euro", symbol: "€" },
  { value: "USD", label: "USD — ASV dolārs", symbol: "$" },
  { value: "GBP", label: "GBP — Lielbritānijas mārciņa", symbol: "£" },
  { value: "PLN", label: "PLN — Polijas zlots", symbol: "zł" },
  { value: "SEK", label: "SEK — Zviedrijas krona", symbol: "kr" },
  { value: "NOK", label: "NOK — Norvēģijas krona", symbol: "kr" },
  { value: "DKK", label: "DKK — Dānijas krona", symbol: "kr" },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["value"];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_OPTIONS.some((option) => option.value === value);
}

/** Atgriež valūtas simbolu (piem. "€") pēc koda (piem. "EUR"). */
export function getCurrencySymbol(currency: string | null | undefined): string {
  if (!currency) return "€";
  const found = CURRENCY_OPTIONS.find((opt) => opt.value === currency);
  return found ? found.symbol : currency;
}
