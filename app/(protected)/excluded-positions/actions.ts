"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import {
  createExcludedPosition,
  deleteExcludedPosition,
  reorderExcludedPositions,
  updateExcludedPosition,
} from "@/app/lib/excluded-positions/repository";
import type {
  CreateExcludedPositionInput,
  ReorderExcludedPositionsInput,
  UpdateExcludedPositionInput,
} from "@/app/lib/excluded-positions/types";

function revalidateExcludedPositions() {
  revalidatePath("/excluded-positions");
}

export async function createExcludedPositionAction(input: CreateExcludedPositionInput) {
  const { denied } = await requireAction("excluded_positions.manage");
  if (denied) return denied;

  const result = await createExcludedPosition(input);

  if (result.ok) {
    revalidateExcludedPositions();
  }

  return result;
}

export async function updateExcludedPositionAction(input: UpdateExcludedPositionInput) {
  const { denied } = await requireAction("excluded_positions.manage");
  if (denied) return denied;

  const result = await updateExcludedPosition(input);

  if (result.ok) {
    revalidateExcludedPositions();
  }

  return result;
}

export async function deleteExcludedPositionAction(id: string) {
  const { denied } = await requireAction("excluded_positions.manage");
  if (denied) return denied;

  const result = await deleteExcludedPosition(id);

  if (result.ok) {
    revalidateExcludedPositions();
  }

  return result;
}

export async function reorderExcludedPositionsAction(input: ReorderExcludedPositionsInput) {
  const { denied } = await requireAction("excluded_positions.manage");
  if (denied) return denied;

  const result = await reorderExcludedPositions(input);

  if (result.ok) {
    revalidateExcludedPositions();
  }

  return result;
}
