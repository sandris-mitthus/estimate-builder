export type CompanySettings = {
  companyName: string;
  address: string;
  registrationNumber: string;
  vatNumber: string;
  bankName: string;
  swift: string;
  bankAccountNumber: string;
  phone: string;
  email: string;
  currency: string;
  logoUrl: string;
  estimateValidityDays: number;
  defaultHourlyRate: number | null;
  offerAdditionalInfo: string;
  offerValidityDays: number;
};

export type CompanySettingsRow = {
  id: number;
  company_name: string;
  address: string;
  registration_number: string;
  vat_number: string;
  bank_name: string;
  swift: string;
  bank_account_number: string;
  phone: string;
  email: string;
  currency: string;
  logo_url: string;
  estimate_validity_days?: number;
  default_hourly_rate?: number | null;
  offer_additional_info?: string;
  offer_validity_days?: number;
};
