"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/app/lib/auth/require-auth";
import type { ModuleBlockKind } from "@/app/lib/modules/types";
import {
  removeProjectModuleBlock,
  updateProjectModuleBlocks,
  updateProjectProjectDescription,
  uploadProjectModuleBlock,
} from "@/app/lib/projects/project-module-data";
import type {
  UpdateProjectModuleBlocksInput,
  UpdateProjectProjectDescriptionInput,
} from "@/app/lib/projects/types";

function revalidateProject(projectId: string) {
  revalidatePath(`/${projectId}`);
  revalidatePath(`/${projectId}/module-data`);
  revalidatePath("/");
}

export async function updateProjectModuleBlocksAction(
  input: UpdateProjectModuleBlocksInput,
) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await updateProjectModuleBlocks(input);

  if (result.ok) {
    revalidateProject(input.id);
  }

  return result;
}

export async function updateProjectProjectDescriptionAction(
  input: UpdateProjectProjectDescriptionInput,
) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await updateProjectProjectDescription(input);

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
  const { denied } = await requireAuth();
  if (denied) return denied;

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
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await removeProjectModuleBlock(projectId, kind, blockId);

  if (result.ok) {
    revalidateProject(projectId);
  }

  return result;
}
