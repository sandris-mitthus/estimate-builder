"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import { reorderTimelineGraphProjects } from "@/app/lib/timeline-graph/repository";

export async function reorderTimelineGraphProjectsAction(
  projectIds: string[],
) {
  const { denied } = await requireAction("timeline_graph.manage");
  if (denied) {
    return denied;
  }

  const result = await reorderTimelineGraphProjects(projectIds);

  if (result.ok) {
    revalidatePath("/timeline-graph");
  }

  return result;
}
