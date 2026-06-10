import { DEFAULT_CURRENCY } from "@/app/lib/settings/currencies";
import { DEFAULT_ESTIMATE_VALIDITY_DAYS } from "@/app/lib/settings/estimate-validity-days";
import type { CompanySettings } from "@/app/lib/settings/types";

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "",
  address: "",
  registrationNumber: "",
  vatNumber: "",
  bankName: "",
  swift: "",
  bankAccountNumber: "",
  phone: "",
  email: "",
  currency: DEFAULT_CURRENCY,
  logoUrl: "",
  estimateValidityDays: DEFAULT_ESTIMATE_VALIDITY_DAYS,
};
