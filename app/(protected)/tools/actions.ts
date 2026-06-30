"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import {
  assignToolWorker,
  createTool,
  deleteTool,
  updateTool,
} from "@/app/lib/tools/repository";
import type {
  AssignToolWorkerInput,
  CreateToolInput,
  UpdateToolInput,
} from "@/app/lib/tools/types";

function revalidateTools() {
  revalidatePath("/tools");
}

export async function createToolAction(input: CreateToolInput) {
  const { denied } = await requireAction("tools.manage");
  if (denied) return denied;

  const result = await createTool(input);

  if (result.ok) {
    revalidateTools();
  }

  return result;
}

export async function updateToolAction(input: UpdateToolInput) {
  const { denied } = await requireAction("tools.manage");
  if (denied) return denied;

  const result = await updateTool(input);

  if (result.ok) {
    revalidateTools();
  }

  return result;
}

export async function assignToolWorkerAction(input: AssignToolWorkerInput) {
  const { denied } = await requireAction("tools.manage");
  if (denied) return denied;

  const result = await assignToolWorker(input);

  if (result.ok) {
    revalidateTools();
  }

  return result;
}

export async function deleteToolAction(id: string) {
  const { denied } = await requireAction("tools.manage");
  if (denied) return denied;

  const result = await deleteTool(id);

  if (result.ok) {
    revalidateTools();
  }

  return result;
}
