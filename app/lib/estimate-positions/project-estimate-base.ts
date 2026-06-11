import { cloneSagataveDocumentForProject } from "@/app/lib/estimate-positions/clone-sagatave-for-project";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import type {
  EstimateCategory,
  MultiOptionLinkGroup,
} from "@/app/lib/estimates/types";

export type ProjectEstimateBase = {
  categories: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
};

export async function getProjectEstimateBaseFromSagatave(): Promise<ProjectEstimateBase> {
  const sagatave = await ensureDefaultEstimatePosition();

  return cloneSagataveDocumentForProject(
    sagatave.sections,
    sagatave.multiOptionLinks,
  );
}
