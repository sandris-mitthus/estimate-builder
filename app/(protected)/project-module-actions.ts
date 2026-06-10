"use server";

import { revalidatePath } from "next/cache";
import type { ModuleBlockKind } from "@/app/lib/modules/types";
import {
  removeProjectModuleBlock,
  updateProjectModuleBlocks,
  uploadProjectModuleBlock,
} from "@/app/lib/projects/project-module-data";
import type { UpdateProjectModuleBlocksInput } from "@/app/lib/projects/types";

function revalidateProject(projectId: string) {
  revalidatePath(`/${projectId}`);
  revalidatePath(`/${projectId}/module-data`);
  revalidatePath("/");
}

export async function updateProjectModuleBlocksAction(
  input: UpdateProjectModuleBlocksInput,
) {
  const result = await updateProjectModuleBlocks(input);

  if (result.ok) {
    revalidateProject(input.id);
  }

  return result;
}

export async function uploadProjectModuleBlockAction(
  projectId: string,
  kind: ModuleBlockKind,
  formData: FormData,
) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Izvēlies failu." };
  }

  const result = await uploadProjectModuleBlock(projectId, kind, file);

  if (result.ok) {
    revalidateProject(projectId);
  }

  return result;
}

export async function removeProjectModuleBlockAction(
  projectId: string,
  kind: ModuleBlockKind,
  blockId: string,
) {
  const result = await removeProjectModuleBlock(projectId, kind, blockId);

  if (result.ok) {
    revalidateProject(projectId);
  }

  return result;
}
