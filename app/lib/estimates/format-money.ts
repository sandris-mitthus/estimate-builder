import { formatAmount } from "@/app/lib/estimates/calculate-line";

export function formatMoney(value: number): string {
  return `€ ${formatAmount(value)}`;
}
