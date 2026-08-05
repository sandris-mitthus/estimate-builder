"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import {
  clearTimelineGraphPeopleSections,
  reorderTimelineGraphProjects,
  setTimelineGraphParallelPair,
  updateTimelineGraphPeopleCount,
} from "@/app/lib/timeline-graph/repository";

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

export async function updateTimelineGraphPeopleCountAction(
  projectId: string,
  sectionId: string,
  peopleCount: number,
) {
  const { denied } = await requireAction("timeline_graph.manage");
  if (denied) {
    return denied;
  }

  // Bez revalidatePath — lokālais optimistic stāvoklis ir avots; citādi
  // bieža refresh var pārrakstīt citu projektu nesaglabātās izmaiņas.
  return updateTimelineGraphPeopleCount(projectId, sectionId, peopleCount);
}

export async function clearTimelineGraphPeopleSectionsAction(
  projectId: string,
  sectionIds: string[],
) {
  const { denied } = await requireAction("timeline_graph.manage");
  if (denied) {
    return denied;
  }

  return clearTimelineGraphPeopleSections(projectId, sectionIds);
}

export async function setTimelineGraphParallelPairAction(
  projectId: string,
  sectionId: string,
  targetSectionId: string | null,
) {
  const { denied } = await requireAction("timeline_graph.manage");
  if (denied) {
    return denied;
  }

  return setTimelineGraphParallelPair(
    projectId,
    sectionId,
    targetSectionId,
  );
}
