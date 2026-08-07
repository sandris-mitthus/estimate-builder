export type FrontendModuleSummary = {
  id: string;
  moduleKey: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CompanyFrontendModuleAssignment = {
  moduleKey: string;
  /** Globally available in site_frontend_modules. */
  globalEnabled: boolean;
  /** Enabled for this company (default false). */
  companyEnabled: boolean;
  sortOrder: number;
};
