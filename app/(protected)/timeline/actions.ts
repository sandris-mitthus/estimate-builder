"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import { updateTimelineEntry } from "@/app/lib/timeline/repository";
import type { UpdateTimelineEntryInput } from "@/app/lib/timeline/types";

function revalidateTimeline() {
  revalidatePath("/timeline");
}

export async function updateTimelineEntryAction(input: UpdateTimelineEntryInput) {
  const { denied } = await requireAction("timeline.manage");
  if (denied) return denied;

  const result = await updateTimelineEntry(input);

  if (result.ok) {
    revalidateTimeline();
  }

  return result;
}
