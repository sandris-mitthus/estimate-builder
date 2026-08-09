export type SiteCompanySummary = {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  settingsCompanyName: string;
  registrationNumber: string;
  address: string;
  email: string;
  phone: string;
  userCount: number;
  activeUserCount: number;
  paymentPlanId: string | null;
  paymentPlanUntil: string | null;
  paymentPlanPaid: boolean;
  /** Plan came from the signup trial, not from a real payment. */
  paymentPlanIsTrial: boolean;
  accessBlocked: boolean;
  isVip: boolean;
};

export type SiteLanguageSummary = {
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
};
