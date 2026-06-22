"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import {
  createBuildingModule,
  deleteBuildingModule,
  removeBuildingModuleBlock,
  updateBuildingModule,
  updateBuildingModuleBlocks,
  updateBuildingModuleProjectDescription,
  uploadBuildingModuleBlock,
} from "@/app/lib/modules/repository";
import type {
  CreateBuildingModuleInput,
  ModuleBlockKind,
  UpdateBuildingModuleBlocksInput,
  UpdateBuildingModuleInput,
  UpdateBuildingModuleProjectDescriptionInput,
} from "@/app/lib/modules/types";

function revalidateModules() {
  revalidatePath("/modules");
}

function revalidateModuleDetail(id: string) {
  revalidatePath(`/modules/${id}`);
}

export async function createBuildingModuleAction(input: CreateBuildingModuleInput) {
  const { denied } = await requireAction("modules.manage");
  if (denied) return denied;

  const result = await createBuildingModule(input);

  if (result.ok) {
    revalidateModules();
  }

  return result;
}

export async function updateBuildingModuleAction(input: UpdateBuildingModuleInput) {
  const { denied } = await requireAction("modules.manage");
  if (denied) return denied;

  const result = await updateBuildingModule(input);

  if (result.ok) {
    revalidateModules();
    revalidateModuleDetail(input.id);
  }

  return result;
}

export async function deleteBuildingModuleAction(id: string) {
  const { denied } = await requireAction("modules.manage");
  if (denied) return denied;

  const result = await deleteBuildingModule(id);

  if (result.ok) {
    revalidateModules();
  }

  return result;
}

export async function updateBuildingModuleBlocksAction(
  input: UpdateBuildingModuleBlocksInput,
) {
  const { denied } = await requireAction("modules.manage");
  if (denied) return denied;

  const result = await updateBuildingModuleBlocks(input);

  if (result.ok) {
    revalidateModules();
    revalidateModuleDetail(input.id);
  }

  return result;
}

export async function updateBuildingModuleProjectDescriptionAction(
  input: UpdateBuildingModuleProjectDescriptionInput,
) {
  const { denied } = await requireAction("modules.manage");
  if (denied) return denied;

  const result = await updateBuildingModuleProjectDescription(input);

  if (result.ok) {
    revalidateModuleDetail(input.id);
  }

  return result;
}

export async function uploadBuildingModuleBlockAction(
  moduleId: string,
  kind: ModuleBlockKind,
  formData: FormData,
) {
  const { denied } = await requireAction("modules.manage");
  if (denied) return denied;

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Izvēlies failu." };
  }

  const result = await uploadBuildingModuleBlock(moduleId, kind, file);

  if (result.ok) {
    revalidateModules();
    revalidateModuleDetail(moduleId);
  }

  return result;
}

export async function removeBuildingModuleBlockAction(
  moduleId: string,
  kind: ModuleBlockKind,
  blockId: string,
) {
  const { denied } = await requireAction("modules.manage");
  if (denied) return denied;

  const result = await removeBuildingModuleBlock(moduleId, kind, blockId);

  if (result.ok) {
    revalidateModules();
    revalidateModuleDetail(moduleId);
  }

  return result;
}
