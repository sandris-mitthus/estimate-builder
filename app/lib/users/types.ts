export type UserSummary = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  companyStatus: "active" | "invited" | "disabled";
};
