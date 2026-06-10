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
};
