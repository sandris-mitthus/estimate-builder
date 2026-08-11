import {
  callingCodeFromCountryIso,
  DEFAULT_CALLING_CODE,
} from "@/app/lib/geo/country-calling-codes";
import { detectCountryIsoFromRequest } from "@/app/lib/geo/detect-country";

export async function detectCallingCodeFromRequest(): Promise<string> {
  const country = await detectCountryIsoFromRequest();
  if (!country) {
    return DEFAULT_CALLING_CODE;
  }
  return callingCodeFromCountryIso(country);
}
