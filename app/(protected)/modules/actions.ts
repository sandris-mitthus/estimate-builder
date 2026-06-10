"use server";

import { revalidatePath } from "next/cache";
import {
  createBuildingModule,
  deleteBuildingModule,
  removeBuildingModuleBlock,
  updateBuildingModule,
  updateBuildingModuleBlocks,
  uploadBuildingModuleBlock,
} from "@/app/lib/modules/repository";
import type {
  CreateBuildingModuleInput,
  ModuleBlockKind,
  UpdateBuildingModuleBlocksInput,
  UpdateBuildingModuleInput,
} from "@/app/lib/modules/types";

function revalidateModules() {
  revalidatePath("/modules");
}

function revalidateModuleDetail(id: string) {
  revalidatePath(`/modules/${id}`);
}

export async function createBuildingModuleAction(input: CreateBuildingModuleInput) {
  const result = await createBuildingModule(input);

  if (result.ok) {
    revalidateModules();
  }

  return result;
}

export async function updateBuildingModuleAction(input: UpdateBuildingModuleInput) {
  const result = await updateBuildingModule(input);

  if (result.ok) {
    revalidateModules();
  }

  return result;
}

export async function deleteBuildingModuleAction(id: string) {
  const result = await deleteBuildingModule(id);

  if (result.ok) {
    revalidateModules();
  }

  return result;
}

export async function updateBuildingModuleBlocksAction(
  input: UpdateBuildingModuleBlocksInput,
) {
  const result = await updateBuildingModuleBlocks(input);

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
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Izvēlies failu." };
  }

  const result = await uploadBuildingModuleBlock(moduleId, kind, file);

  if (result.ok) {
    revalidateModuleDetail(moduleId);
  }

  return result;
}

export async function removeBuildingModuleBlockAction(
  moduleId: string,
  kind: ModuleBlockKind,
  blockId: string,
) {
  const result = await removeBuildingModuleBlock(moduleId, kind, blockId);

  if (result.ok) {
    revalidateModuleDetail(moduleId);
  }

  return result;
}
