import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";

export const DEFAULT_VAT_RATE_PERCENT = 21;

export function hasCompanyVatNumber(vatNumber: string): boolean {
  return vatNumber.trim().length > 0;
}

export type VatBreakdown = {
  net: number;
  vatAmount: number;
  gross: number;
  ratePercent: number;
};

export function calculateVatBreakdown(
  netTotal: number,
  ratePercent: number = DEFAULT_VAT_RATE_PERCENT,
): VatBreakdown {
  const net = roundToTwoDecimals(netTotal);
  const vatAmount = roundToTwoDecimals((net * ratePercent) / 100);
  const gross = roundToTwoDecimals(net + vatAmount);

  return { net, vatAmount, gross, ratePercent };
}
