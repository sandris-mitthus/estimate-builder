"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/app/lib/auth/require-auth";
import {
  createPositionPrice,
  deletePositionPrice,
  listPositionPriceHistory,
  updatePositionNameAndUnit,
  updatePositionPrice,
  updatePositionUnitPrice,
} from "@/app/lib/positions/repository";
import type {
  CreatePositionInput,
  UpdatePositionInput,
  UpdatePositionUnitPriceInput,
} from "@/app/lib/positions/types";

function revalidatePositions() {
  revalidatePath("/settings/positions");
  revalidatePath("/estimate");
}

export async function createPositionAction(input: CreatePositionInput) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await createPositionPrice(input);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function syncPositionFromEstimateLineItemAction(input: {
  positionPriceId: string;
  name: string;
  unit: string;
}) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await updatePositionNameAndUnit({
    id: input.positionPriceId,
    name: input.name,
    unit: input.unit,
  });

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function updatePositionAction(input: UpdatePositionInput) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await updatePositionPrice(input);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function updatePositionUnitPriceAction(
  input: UpdatePositionUnitPriceInput,
) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await updatePositionUnitPrice(input);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function deletePositionAction(id: string) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await deletePositionPrice(id);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function getPositionPriceHistoryAction(positionId: string) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  return listPositionPriceHistory(positionId);
}
