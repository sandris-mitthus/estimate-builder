import { DEFAULT_CURRENCY } from "@/app/lib/settings/currencies";
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
};
