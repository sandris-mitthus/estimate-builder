export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export const SAMPLE_USERS: UserSummary[] = [
  {
    id: "user-1",
    name: "Jānis Bērziņš",
    email: "janis.berzins@nordicbuild.lv",
  },
  {
    id: "user-2",
    name: "Līga Ozola",
    email: "liga.ozola@nordicbuild.lv",
  },
  {
    id: "user-3",
    name: "Mārtiņš Kalniņš",
    email: "martins.kalnins@nordicbuild.lv",
  },
];
