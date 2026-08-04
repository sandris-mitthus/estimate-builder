"use server";

import { revalidatePath } from "next/cache";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { reorderTimelineGraphProjects } from "@/app/lib/timeline-graph/repository";

const DENIED = { ok: false as const, error: "Nav autorizācijas." };

export async function reorderTimelineGraphProjectsAction(
  projectIds: string[],
) {
  const user = await getCurrentUser();
  if (!user) {
    return DENIED;
  }

  await assertNavAccess("timeline_graph");

  const result = await reorderTimelineGraphProjects(projectIds);

  if (result.ok) {
    revalidatePath("/timeline-graph");
  }

  return result;
}
