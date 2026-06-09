export const CURRENCY_OPTIONS = [
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — ASV dolārs" },
  { value: "GBP", label: "GBP — Lielbritānijas mārciņa" },
  { value: "PLN", label: "PLN — Polijas zlots" },
  { value: "SEK", label: "SEK — Zviedrijas krona" },
  { value: "NOK", label: "NOK — Norvēģijas krona" },
  { value: "DKK", label: "DKK — Dānijas krona" },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["value"];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_OPTIONS.some((option) => option.value === value);
}
