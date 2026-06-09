export type ResolvedBank = {
  bankName: string;
  swift: string;
};

/**
 * Latvian IBAN: LV + 2 check digits + 4-char bank code (matches BIC prefix).
 * Source: Latvijas Banka — BIC noteikšana pēc IBAN.
 */
const LV_BANKS: Record<string, ResolvedBank> = {
  HABA: { bankName: "Swedbank", swift: "HABALV22" },
  HANZ: { bankName: "Swedbank", swift: "HABALV22" },
  UNLA: { bankName: "SEB banka", swift: "UNLALV2X" },
  PARX: { bankName: "Citadele banka", swift: "PARXLV22" },
  RIKO: { bankName: "Luminor Bank", swift: "RIKOLV2X" },
  NDEA: { bankName: "Luminor Bank", swift: "NDEALV2X" },
  MULT: { bankName: "Industra Bank", swift: "MULTLV2X" },
  CBBR: { bankName: "BluOr Bank", swift: "CBBRLV22" },
  LLBB: { bankName: "Signet Bank", swift: "LLBBLV22" },
  RIBR: { bankName: "Reģionālā investīciju banka", swift: "RIBRLV22" },
  LACB: { bankName: "Latvijas Banka", swift: "LACBLV2X" },
  RTMB: { bankName: "Rietumu Banka", swift: "RTMBLV2X" },
  BLBB: { bankName: "Baltic International Bank", swift: "BLBBLV22" },
  LPNS: { bankName: "Latvijas Pasta banka", swift: "LAPBLV2X" },
  IDXO: { bankName: "Indexo banka", swift: "IDXOLV22" },
  AOSA: { bankName: "AP Operations", swift: "AOSALV22" },
};

function normalizeAccountNumber(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function resolveBankFromAccountNumber(
  accountNumber: string,
): ResolvedBank | null {
  const normalized = normalizeAccountNumber(accountNumber);

  if (!normalized.startsWith("LV") || normalized.length < 8) {
    return null;
  }

  const bankCode = normalized.slice(4, 8);
  return LV_BANKS[bankCode] ?? null;
}
