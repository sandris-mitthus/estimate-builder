import {
  defaultEstimateDeadline,
  projectCreatedDateIso,
  SAMPLE_META,
} from "@/app/lib/estimates/sample-data";
import type { EstimateMeta } from "@/app/lib/projects/types";

export function resolveEstimateMeta(
  createdAt: string,
  address: string,
  validityDays: number,
  overrides: Partial<EstimateMeta> = {},
): EstimateMeta {
  const defaultDate = projectCreatedDateIso(createdAt);
  const date = overrides.date?.trim() || defaultDate;
  const deadline =
    overrides.deadline?.trim() ||
    defaultEstimateDeadline(date, validityDays);

  return {
    ...SAMPLE_META,
    ...overrides,
    project: overrides.project?.trim() || address,
    date,
    deadline,
  };
}
