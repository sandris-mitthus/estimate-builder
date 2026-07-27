export const ESTIMATE_KIND_MAIN = "main" as const;
export const ESTIMATE_KIND_ADDITIONAL_WORK = "additional_work" as const;

export type EstimateKind =
  | typeof ESTIMATE_KIND_MAIN
  | typeof ESTIMATE_KIND_ADDITIONAL_WORK;
