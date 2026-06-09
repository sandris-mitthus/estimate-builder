const ISO_TO_CALLING_CODE: Record<string, string> = {
  LV: "+371",
  LT: "+370",
  EE: "+372",
  DE: "+49",
  PL: "+48",
  SE: "+46",
  FI: "+358",
  GB: "+44",
  US: "+1",
  RU: "+7",
};

export const CALLING_CODE_OPTIONS = [
  { label: "LV +371", value: "+371" },
  { label: "LT +370", value: "+370" },
  { label: "EE +372", value: "+372" },
  { label: "DE +49", value: "+49" },
  { label: "PL +48", value: "+48" },
  { label: "SE +46", value: "+46" },
  { label: "FI +358", value: "+358" },
  { label: "GB +44", value: "+44" },
  { label: "US +1", value: "+1" },
  { label: "RU +7", value: "+7" },
  { label: "NO +47", value: "+47" },
  { label: "DK +45", value: "+45" },
  { label: "NL +31", value: "+31" },
  { label: "FR +33", value: "+33" },
  { label: "IE +353", value: "+353" },
  { label: "UA +380", value: "+380" },
  { label: "BY +375", value: "+375" },
] as const;

export const DEFAULT_CALLING_CODE = "+371";

export function callingCodeFromCountryIso(iso: string | null | undefined): string {
  if (!iso) return DEFAULT_CALLING_CODE;
  return ISO_TO_CALLING_CODE[iso.toUpperCase()] ?? DEFAULT_CALLING_CODE;
}

export function normalizeCallingCode(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_CALLING_CODE;
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}
